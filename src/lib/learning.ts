import "server-only";
import { prisma } from "@/lib/prisma";
import { urlFor } from "@/lib/storage";

export type LearnImage = { url: string; caption: string | null; type: string };
export type LearnCitation = { type: string; title: string; dateLabel: string | null; url: string | null };
export type LearnQuestion = {
  id: string;
  originalText: string;
  modelAnswer: string | null;
  citations: LearnCitation[];
  specialties: string[];
  images: LearnImage[];
};

export async function getPublishedQuestions(options: {
  specialtyId?: string;
  onlyWithImages?: boolean;
  questionIds?: string[];
}): Promise<LearnQuestion[]> {
  const questions = await prisma.question.findMany({
    where: {
      status: "PUBLISHED",
      ...(options.specialtyId ? { specialties: { some: { specialtyId: options.specialtyId } } } : {}),
      ...(options.questionIds ? { id: { in: options.questionIds } } : {}),
      ...(options.onlyWithImages ? { images: { some: { status: "PUBLISHED" } } } : {}),
    },
    include: {
      specialties: { include: { specialty: true } },
      answers: { where: { type: "MODEL" }, include: { citations: { orderBy: { order: "asc" } } } },
      images: { where: { status: "PUBLISHED" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return questions.map((q) => ({
    id: q.id,
    originalText: q.originalText,
    modelAnswer: q.answers[0]?.text ?? null,
    citations: (q.answers[0]?.citations ?? []).map((c) => ({
      type: c.type,
      title: c.title,
      dateLabel: c.dateLabel,
      url: c.url,
    })),
    specialties: q.specialties.map((s) => s.specialty.name),
    images: q.images.map((img) => ({ url: urlFor(img.filePath), caption: img.caption, type: img.type })),
  }));
}
