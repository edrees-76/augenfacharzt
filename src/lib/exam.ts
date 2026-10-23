import "server-only";
import { prisma } from "@/lib/prisma";
import { urlFor } from "@/lib/storage";

export type ExamCitation = { type: string; title: string; dateLabel: string | null; url: string | null };
export type ExamQuestion = {
  id: string;
  originalText: string;
  scenarioText: string | null;
  followUps: string[];
  modelAnswer: string | null;
  citations: ExamCitation[];
  images: { url: string; caption: string | null }[];
};

const EXAM_SESSION_LENGTH = 10;

export async function getExamQuestions(options: {
  mode: "SPECIALTY" | "MIXED" | "IMAGE";
  specialtyId?: string | null;
  seed: string; // deterministic per-session shuffle so reloading the page keeps the same order
}): Promise<ExamQuestion[]> {
  const questions = await prisma.question.findMany({
    where: {
      status: "PUBLISHED",
      ...(options.mode === "SPECIALTY" && options.specialtyId
        ? { specialties: { some: { specialtyId: options.specialtyId } } }
        : {}),
      ...(options.mode === "IMAGE" ? { images: { some: { status: "PUBLISHED" } } } : {}),
    },
    include: {
      answers: { where: { type: "MODEL" }, include: { citations: { orderBy: { order: "asc" } } } },
      clinicalCase: { include: { followUps: { orderBy: { order: "asc" } } } },
      images: { where: { status: "PUBLISHED" } },
    },
  });

  // Deterministic shuffle keyed by the exam session id, so a page reload
  // mid-exam shows the same order instead of a fresh random sample.
  let seedNum = 0;
  for (const ch of options.seed) seedNum = (seedNum * 31 + ch.charCodeAt(0)) % 2147483647;
  const rand = () => {
    seedNum = (seedNum * 48271) % 2147483647;
    return seedNum / 2147483647;
  };
  const shuffled = [...questions].sort(() => rand() - 0.5);

  return shuffled.slice(0, EXAM_SESSION_LENGTH).map((q) => ({
    id: q.id,
    originalText: q.originalText,
    scenarioText: q.clinicalCase?.scenarioText ?? null,
    followUps: q.clinicalCase?.followUps.map((f) => f.text) ?? [],
    modelAnswer: q.answers[0]?.text ?? null,
    citations: (q.answers[0]?.citations ?? []).map((c) => ({
      type: c.type,
      title: c.title,
      dateLabel: c.dateLabel,
      url: c.url,
    })),
    images: q.images.map((img) => ({ url: urlFor(img.filePath), caption: img.caption })),
  }));
}
