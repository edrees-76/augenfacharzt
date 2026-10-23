# AugenFacharzt – Mündliche Prüfung

Private Lernplattform zur Vorbereitung auf die mündliche Facharztprüfung Augenheilkunde
(Stage 1 – Funktionaler Kern). Next.js (App Router) + TypeScript + Tailwind CSS + PostgreSQL
(Prisma ORM).

This README documents the whole Stage 1 build: setup, how to import your existing question
files, how to wire up Stage 2 services later, what's done, and what's explicitly not done yet.
Everything here is accurate to the actual code — nothing is claimed as working that hasn't been
built and run.

## 1. Setup

```bash
npm install
cp .env.example .env
```

### Database (pick one — no Docker/psql required)

**Option A — zero install, Prisma's own local dev Postgres (recommended for trying it out):**

```bash
npx prisma dev -d -n augenfacharzt   # prints a postgres:// URL, runs in the background
```

Copy the printed URL into `DATABASE_URL` in `.env` (already set up this way by default — adjust
the port if it differs). Stop it later with `npx prisma dev stop`; list running instances with
`npx prisma dev ls`.

**Option B — Docker:**

```bash
docker compose up -d
```

Then set `DATABASE_URL="postgres://postgres:postgres@localhost:5432/augenfacharzt?sslmode=disable"`
in `.env`.

**Option C — a free hosted Postgres** (Neon, Supabase, etc.) — paste its connection string into
`DATABASE_URL`.

### Apply the schema and seed data

```bash
npx prisma migrate dev
npx prisma db seed
```

Seeding creates the 12 default specialties and one admin account from `ADMIN_SEED_USERNAME` /
`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` in `.env`. **Change that password after first login.**

### Run it

```bash
npm run dev
```

Open http://localhost:3000, log in with the seeded admin account, and go to
**Benutzerverwaltung** to approve any learners who register.

## 2. Importing your existing question files

Log in as an admin → **Dokumente hochladen** → upload a PDF, DOCX, TXT or XLSX file (one at a
time, up to 20 MB each — repeat the upload for each file you have).

What happens:

- **TXT/DOCX**: text is extracted and split into candidate questions using a numbered-list
  heuristic (`1.`, `2)`, `Frage 3:` …), falling back to blank-line-separated paragraphs if no
  numbering is found. A line starting with `Antwort:` inside a block is captured separately as
  the original answer.
- **PDF**: same splitting, after extracting the PDF's text layer. If a PDF has little or no
  extractable text (i.e. it's scanned images without OCR), the batch is flagged **"Prüfung
  erforderlich"** with no auto-extracted questions — there is no OCR in Stage 1 (see §3). Open the
  batch page to read the extracted text (if any) and add questions manually.
- **XLSX**: each row becomes one question. The importer looks for a column whose header contains
  "Frage"/"Question" (and optionally "Antwort"/"Answer"); if none is found, the first column is
  used.

Every extracted question is created as a **Entwurf** (draft) linked to its import batch, with the
original source file, page/row reference and import date preserved — the original text is never
overwritten. Review each one under **Fragenverwaltung** or from the import batch's own page: edit
the text, assign specialties, add a model answer, then change its status to **Freigegeben** or
**Veröffentlicht**. Only **Veröffentlicht** content is visible to learners. The admin question list
also flags likely duplicates (exact or near-duplicate text) for your attention — Stage 1 has no AI,
so this is a simple text-overlap heuristic, not semantic matching.

To import `Niedersachsen Protokolle 2.pdf` (or any other protocol collection): upload it the same
way and review the extracted drafts before publishing.

## 3. Configuring Stage 2 services (optional, not required to run Stage 1)

Stage 1 runs fully without any of these. Nothing in the UI claims they're active unless you've
actually configured them.

| Feature | What's needed | Where it plugs in |
|---|---|---|
| AI question/case extraction, AI-suggested model answers, adaptive follow-up questions, AI image recommendations, AI answer feedback | An LLM provider API key (e.g. `ANTHROPIC_API_KEY`) | New service module calling the provider from the admin review flow (`src/app/actions/questions.ts`, `src/lib/import/`) — the `AI_SUGGESTED` answer type and the Entwurf→Veröffentlicht content pipeline already exist for this content to flow through once built |
| Password-reset email delivery | SMTP credentials or a provider key (Resend etc.) | `requestPasswordResetAction` in `src/app/actions/auth.ts` currently only logs the reset link to the server console — replace that `console.log` with an actual send call |
| Production file storage | S3/R2/MinIO credentials | `src/lib/storage.ts` is a small, swappable abstraction (`save`/`remove`/`urlFor`) — only this file needs to change |
| Real third-party speech-to-text (for broader browser support than Chrome's built-in engine) | A transcription provider key | `src/components/MicInput.tsx` currently uses the browser's native `SpeechRecognition` API only |

## 4. What's implemented vs. not (Stage 1 completion checklist)

**Implemented and runnable:**

- Registration with admin approval workflow; login/logout; password reset (token flow works,
  delivery is console-logged — see table above); admin can suspend/reject users (sessions are
  revoked immediately) and open/close public registration.
- Role-based access: approved-user gate and admin-only gate, enforced server-side in every
  layout/action, not just in the UI.
- White, minimal, responsive interface (desktop + mobile) per the design spec.
- Specialty management (the 12 default categories, editable).
- Manual question creation and full editing: original text, specialties, Originalantwort vs.
  freigegebene Musterantwort (kept separate), optional clinical case + 2–5 follow-up questions,
  image upload with type/caption/source/license and its own approval status.
- Document import (PDF/DOCX/TXT/XLSX) with heuristic question splitting, per-batch review page,
  and a duplicate-question warning in the question list.
- Content lifecycle (Entwurf → Zur Prüfung → Freigegeben → Veröffentlicht) on questions, clinical
  cases and images individually, with a batch approve/publish view (**Inhaltsfreigabe**) and a
  basic audit log.
- Lernmodus (per specialty or all), Bildfragen (image-only), and Prüfungssimulation (per
  specialty / mixed / image-based, case → answer → static follow-ups → reveal model answer →
  self-rating), each saving progress independently per user.
- Meine Wiederholungen (simple spaced repetition: next-review date derived from your last
  self-rating) and Lernfortschritt (per-specialty breakdown, exam history).
- Real browser-based German dictation (not a decorative button) with keyboard fallback, start/
  stop/retry, editable transcript, and a consent notice — used in Lernmodus, Bildfragen and
  Prüfungssimulation.
- Account page: change password, export your own data as JSON, delete your own account (blocked
  with an explanation if that account has authored/approved content, to preserve traceability).
- `/datenschutz` page describing what's technically stored — explicitly marked as not a legal
  GDPR compliance statement (see §5).

**Not implemented (by design, for the reasons in the table above) — all Stage 2/3 per the original
spec:**

- No AI anywhere (extraction, clinical-case generation, suggested answers, adaptive follow-ups,
  image recommendation/sourcing, answer feedback/scoring). The data model and review pipeline are
  already shaped to receive this once a provider key is wired in.
- No OCR for scanned PDFs.
- No third-party speech-to-text provider (browser-native only).
- No outgoing email (password-reset links are logged, not sent).
- No production object storage (local disk under `./storage`, gitignored).
- No background job queue — document import runs synchronously in the request; fine at Stage 1
  volumes, would need a queue for very large/many files.
- Multi-file import is one file per upload (repeat per file), not a batch picker.
- Rate limiting on login/registration is in-memory per process — fine for a single instance, needs
  a shared store (e.g. Redis) if ever run multi-instance/behind a load balancer.

## 5. Data protection

`/datenschutz` lists what the app technically stores and processes, including the browser speech
API's privacy implication. It is **not** a substitute for legal review: the data controller's
name/contact, legal basis, retention policy, and any processor agreements (hosting, email
provider, LLM/speech provider once Stage 2 is configured) must be filled in/arranged by whoever
operates this before it's used with real users' data.

## 6. Deployment

Not deployed by this build. To deploy:

1. Provision a Postgres database (managed Postgres recommended) and set `DATABASE_URL`.
2. Run `npx prisma migrate deploy` against it, then `npx prisma db seed` once for the first admin.
3. Build (`npm run build`) and run (`npm run start`) on a Node host, or deploy to Vercel (set the
   same env vars in the project settings — note Vercel's serverless filesystem is ephemeral, so
   `src/lib/storage.ts` must be swapped to real object storage before deploying there).
4. Set a real `ADMIN_SEED_PASSWORD` before seeding production, and change it after first login.

## 7. Project structure notes

- `src/lib/auth.ts` — hand-rolled session auth (bcrypt + hashed opaque DB-backed session tokens,
  not NextAuth) chosen so that suspending a user revokes access immediately.
- `src/lib/guards.ts` — `requireApprovedUser()` / `requireAdminUser()`, called in every protected
  layout; `src/proxy.ts` (Next's "proxy"/middleware convention) does a fast cookie-presence
  pre-check only — the DB-backed check in the guards is the authoritative one.
- `src/lib/storage.ts`, `src/lib/import/` — the swap points described in §3.
- `prisma/schema.prisma` — see inline comments for the content-lifecycle and audit design.
