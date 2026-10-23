import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SPECIALTIES = [
  "Retina und Glaskörper",
  "Glaukom",
  "Katarakt und Intraokularlinsen",
  "Hornhaut und äußere Augenerkrankungen",
  "Uveitis",
  "Neuroophthalmologie",
  "Kinderophthalmologie und Strabologie",
  "Lider, Tränenwege und Orbita",
  "Augenverletzungen und Notfälle",
  "Refraktion und Optik",
  "Allgemeine Augenheilkunde",
  "Diagnostik und Bildgebung",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await prisma.registrationSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, registrationOpen: true },
  });

  const specialtyMap: Record<string, string> = {};
  for (const [index, name] of SPECIALTIES.entries()) {
    const s = await prisma.specialty.upsert({
      where: { name },
      update: { order: index },
      create: { name, slug: slugify(name), order: index },
    });
    specialtyMap[name] = s.id;
  }

  const username = process.env.ADMIN_SEED_USERNAME ?? "admin";
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      username,
      email,
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
  });
  console.log(`Seeded admin account: ${admin.username} (status=${admin.status})`);

  // Published questions to seed
  const SEED_QUESTIONS = [
    {
      specialty: "Glaukom",
      originalText: "Welche diagnostischen Kriterien sprechen für das Vorliegen eines primären Offenwinkelglaukoms (POWG)?",
      modelAnswer: "Typische Befunde sind: Exkavation der Papille (vergrößerte Cup-to-Disc-Ratio, ISNT-Regel verletzt), Gesichtsfeldausfälle (z. B. Bjerrum-Skotom, nasaler Sprung), Kammerwinkel offen (Gonioskopie Grad III-IV nach Shaffer) und häufig ein erhöhter Augeninnendruck (> 21 mmHg).",
      citation: { type: "DOG_LEITLINIE" as const, title: "DOG/BVA Leitlinie Primäres Offenwinkelglaukom", dateLabel: "2023" },
      image: null,
      confidence: "SICHER" as const,
    },
    {
      specialty: "Glaukom",
      originalText: "Beurteilen Sie den beiliegenden Papillenbefund bei Verdacht auf Glaukom.",
      modelAnswer: "Zu sehen ist eine fortgeschrittene glaukomatöse Papillenatrophie mit ausgeprägter Exkavation, neuroretinaler Randsaum superior und inferior verschmälert (ISNT-Regel verletzt), sowie peripapilläre Atrophie (Zone Beta).",
      citation: { type: "DOG_LEITLINIE" as const, title: "DOG Leitlinie Glaukomatöse Papille", dateLabel: "2022" },
      image: {
        filePath: "images/glaukom-papille.png",
        type: "SLIT_LAMP" as const,
        caption: "Glaukomatöse Papillenexkavation mit Randsaumverschmälerung",
      },
      confidence: "TEILWEISE" as const,
    },
    {
      specialty: "Retina und Glaskörper",
      originalText: "Was sind die Leitsymptome und diagnostischen Schritte bei einer akuten hinteren Glaskörperabhebung und Verdacht auf Amotio retinae?",
      modelAnswer: "Symptome: Lichtblitze (Photopsien), Rußregen, fliegende Mücken (Mouches volantes), evtl. Gesichtsfeldausfall ('Schatten/Vorhang'). Diagnostik: Ophthalmoskopie in Mydriasis mit Dreispiegelglas oder Weitwinkel-Funduskopie zur Suche nach Netzhautforamina.",
      citation: { type: "DOG_LEITLINIE" as const, title: "DOG Leitlinie Netzhautablösung", dateLabel: "2022" },
      image: null,
      confidence: "SICHER" as const,
    },
    {
      specialty: "Retina und Glaskörper",
      originalText: "Welche Netzhautveränderungen zeigt die Fundusaufnahme bei einer diabetischen Retinopathie?",
      modelAnswer: "Mikroaneurysmen, intraretinale Blutungen, harte Exsudate und Kaliberschwankungen der Venen. Bei proliferativer Retinopathie zusätzlich Neovaskularisationen an der Papille (NVD) oder anderswo (NVE).",
      citation: { type: "AWMF_LEITLINIE" as const, title: "Nationale VersorgungsLeitlinie Diabetische Retinopathie", dateLabel: "2023" },
      image: {
        filePath: "images/retina-fundus.png",
        type: "FUNDUS" as const,
        caption: "Fundusaufnahme der Netzhaut bei diabetischer Retinopathie",
      },
      confidence: "NICHT_GEWUSST" as const,
    },
    {
      specialty: "Uveitis",
      originalText: "Welche klinischen Zeichen charakterisieren eine akute anteriore Uveitis (Iritis/Iridozyklitis) und welche Systemerkrankung ist häufig assoziiert?",
      modelAnswer: "Zeichen: Ziliare Injektion, Tyndall-Phänomen (Zellen und Eiweiß in der Vorderkammer), Endothelbeschläge (Präzipitate), Synechien, Miosis, dumpfe Augenschmerzen und Photophobie. Assoziation: HLA-B27-positive Erkrankungen wie Morbus Bechterew (Spondylitis ankylosans).",
      citation: { type: "AWMF_LEITLINIE" as const, title: "AWMF Leitlinie Uveitis anterior", dateLabel: "2021" },
      image: null,
      confidence: "SICHER" as const,
    },
    {
      specialty: "Hornhaut und äußere Augenerkrankungen",
      originalText: "Wie diagnostizieren und behandeln Sie eine Keratitis dendritica (Herpes-simplex-Keratitis)?",
      modelAnswer: "Diagnostik: Spaltlampenuntersuchung mit Fluoreszeinfärbung zeigt charakteristische bäumchenartige Verzweigungen (Dendriten) mit Endkolben sowie Hornhaut-Hypästhesie. Therapie: Topisches Aciclovir/Ganciclovir 5x tgl., KEINE lokalen Kortikosteroide im Epithelstadium!",
      citation: { type: "DOG_LEITLINIE" as const, title: "DOG Empfehlungen Herpes-Keratitis", dateLabel: "2022" },
      image: null,
      confidence: "TEILWEISE" as const,
    },
    {
      specialty: "Katarakt und Intraokularlinsen",
      originalText: "Welche Formen der senilen Katarakt unterscheiden wir und welche IOL-Berechnungsformeln sind bei Standard-Bulbuslängen indiziert?",
      modelAnswer: "Formen: Rindenkatarakt (Cataracta corticalis), Kernkatarakt (Cataracta nuclearis), hintere subkapsuläre Katarakt. IOL-Formeln: SRK/T, Haigis, Hoffer Q, Barrett Universal II.",
      citation: { type: "DOG_LEITLINIE" as const, title: "DOG Empfehlungen Kataraktchirurgie", dateLabel: "2023" },
      image: null,
      confidence: "SICHER" as const,
    },
  ];

  const seededQuestionIds: string[] = [];

  for (const qData of SEED_QUESTIONS) {
    const specialtyId = specialtyMap[qData.specialty];
    if (!specialtyId) continue;

    // Check if question already exists by originalText
    let question = await prisma.question.findFirst({
      where: { originalText: qData.originalText },
    });

    if (!question) {
      question = await prisma.question.create({
        data: {
          originalText: qData.originalText,
          status: "PUBLISHED",
          createdById: admin.id,
          specialties: {
            create: {
              specialtyId,
            },
          },
          answers: {
            create: {
              type: "MODEL",
              text: qData.modelAnswer,
              approvedById: admin.id,
              approvedAt: new Date(),
              citations: {
                create: {
                  type: qData.citation.type,
                  title: qData.citation.title,
                  dateLabel: qData.citation.dateLabel,
                  order: 0,
                },
              },
            },
          },
        },
      });
    } else {
      // Ensure it is published
      await prisma.question.update({
        where: { id: question.id },
        data: { status: "PUBLISHED" },
      });
    }

    seededQuestionIds.push(question.id);

    // If image attached
    if (qData.image) {
      const existingImage = await prisma.questionImage.findFirst({
        where: { questionId: question.id },
      });
      if (!existingImage) {
        await prisma.questionImage.create({
          data: {
            questionId: question.id,
            filePath: qData.image.filePath,
            type: qData.image.type,
            caption: qData.image.caption,
            status: "PUBLISHED",
            uploadedById: admin.id,
          },
        });
      } else {
        await prisma.questionImage.update({
          where: { id: existingImage.id },
          data: { status: "PUBLISHED" },
        });
      }
    }

    // Seed UserProgress for admin
    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: admin.id,
          questionId: question.id,
        },
      },
      update: {
        confidence: qData.confidence,
        timesReviewed: 2,
        lastReviewedAt: new Date(Date.now() - 86400000 * 2),
        nextReviewAt: new Date(Date.now() + 86400000 * 5),
      },
      create: {
        userId: admin.id,
        questionId: question.id,
        confidence: qData.confidence,
        timesReviewed: 2,
        lastReviewedAt: new Date(Date.now() - 86400000 * 2),
        nextReviewAt: new Date(Date.now() + 86400000 * 5),
      },
    });
  }

  // Seed at least 2 completed ExamSessions for admin
  const existingExam = await prisma.examSession.findFirst({
    where: { userId: admin.id, completedAt: { not: null } },
  });

  if (!existingExam && seededQuestionIds.length > 0) {
    const exam1 = await prisma.examSession.create({
      data: {
        userId: admin.id,
        mode: "MIXED",
        startedAt: new Date(Date.now() - 86400000 * 3),
        completedAt: new Date(Date.now() - 86400000 * 3 + 900000),
        answers: {
          create: seededQuestionIds.slice(0, 4).map((qId) => ({
            questionId: qId,
            userAnswerText: "Vollständige Prüfungssimulationsantwort des Prüflings.",
            revealedModelAnswer: true,
            selfRating: "SICHER",
          })),
        },
      },
    });
    console.log(`Seeded completed ExamSession MIXED: ${exam1.id}`);

    const exam2 = await prisma.examSession.create({
      data: {
        userId: admin.id,
        mode: "SPECIALTY",
        specialtyId: specialtyMap["Glaukom"],
        startedAt: new Date(Date.now() - 86400000 * 1),
        completedAt: new Date(Date.now() - 86400000 * 1 + 600000),
        answers: {
          create: seededQuestionIds.slice(0, 2).map((qId) => ({
            questionId: qId,
            userAnswerText: "Antwort auf Glaukomfrage in der Fachgebietssimulation.",
            revealedModelAnswer: true,
            selfRating: "TEILWEISE",
          })),
        },
      },
    });
    console.log(`Seeded completed ExamSession SPECIALTY: ${exam2.id}`);
  }

  console.log(`Seeded ${SPECIALTIES.length} specialties and ${SEED_QUESTIONS.length} published questions with progress & exams.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
