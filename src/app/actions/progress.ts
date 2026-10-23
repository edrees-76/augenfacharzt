"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const CONFIDENCE_INTERVAL_DAYS: Record<string, number> = {
  NICHT_GEWUSST: 1,
  TEILWEISE: 3,
  SICHER: 10,
};

const rateSchema = z.object({
  questionId: z.string().min(1),
  confidence: z.enum(["SICHER", "TEILWEISE", "NICHT_GEWUSST"]),
});

export async function rateQuestionAction(input: { questionId: string; confidence: string }) {
  const user = await requireUser();
  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const intervalDays = CONFIDENCE_INTERVAL_DAYS[parsed.data.confidence] ?? 1;
  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  await prisma.userProgress.upsert({
    where: { userId_questionId: { userId: user.id, questionId: parsed.data.questionId } },
    update: {
      confidence: parsed.data.confidence as never,
      lastReviewedAt: new Date(),
      nextReviewAt,
      timesReviewed: { increment: 1 },
    },
    create: {
      userId: user.id,
      questionId: parsed.data.questionId,
      confidence: parsed.data.confidence as never,
      lastReviewedAt: new Date(),
      nextReviewAt,
      timesReviewed: 1,
    },
  });

  revalidatePath("/wiederholungen");
  revalidatePath("/fortschritt");
  revalidatePath("/");
  return { ok: true };
}

const bookmarkSchema = z.object({
  questionId: z.string().min(1),
  bookmarked: z.boolean(),
});

export async function setBookmarkAction(input: { questionId: string; bookmarked: boolean }) {
  const user = await requireUser();
  const parsed = bookmarkSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  await prisma.userProgress.upsert({
    where: { userId_questionId: { userId: user.id, questionId: parsed.data.questionId } },
    update: { bookmarked: parsed.data.bookmarked },
    create: { userId: user.id, questionId: parsed.data.questionId, bookmarked: parsed.data.bookmarked },
  });

  revalidatePath("/wiederholungen");
  return { ok: true };
}

export async function deleteMyProgressAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return;
  await prisma.userProgress.deleteMany({ where: { userId: user.id, questionId } });
  revalidatePath("/wiederholungen");
  revalidatePath("/fortschritt");
}
