"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const startSchema = z.object({
  mode: z.enum(["SPECIALTY", "MIXED", "IMAGE"]),
  specialtyId: z.string().optional(),
});

export async function startExamSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = startSchema.safeParse({
    mode: formData.get("mode"),
    specialtyId: formData.get("specialtyId") || undefined,
  });
  if (!parsed.success) return;

  const session = await prisma.examSession.create({
    data: {
      userId: user.id,
      mode: parsed.data.mode,
      specialtyId: parsed.data.mode === "SPECIALTY" ? parsed.data.specialtyId : undefined,
    },
  });

  redirect(`/pruefung/sitzung/${session.id}`);
}

const saveAnswerSchema = z.object({
  examSessionId: z.string().min(1),
  questionId: z.string().min(1),
  userAnswerText: z.string(),
});

export async function saveExamAnswerAction(input: {
  examSessionId: string;
  questionId: string;
  userAnswerText: string;
}) {
  const user = await requireUser();
  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const session = await prisma.examSession.findUnique({ where: { id: parsed.data.examSessionId } });
  if (!session || session.userId !== user.id) return { ok: false };

  const existing = await prisma.examAnswer.findFirst({
    where: { examSessionId: parsed.data.examSessionId, questionId: parsed.data.questionId },
  });

  if (existing) {
    await prisma.examAnswer.update({
      where: { id: existing.id },
      data: { userAnswerText: parsed.data.userAnswerText },
    });
  } else {
    await prisma.examAnswer.create({
      data: {
        examSessionId: parsed.data.examSessionId,
        questionId: parsed.data.questionId,
        userAnswerText: parsed.data.userAnswerText,
      },
    });
  }
  return { ok: true };
}

const revealSchema = z.object({
  examSessionId: z.string().min(1),
  questionId: z.string().min(1),
  selfRating: z.enum(["SICHER", "TEILWEISE", "NICHT_GEWUSST"]).optional(),
});

export async function revealAndRateExamAnswerAction(input: {
  examSessionId: string;
  questionId: string;
  selfRating?: string;
}) {
  const user = await requireUser();
  const parsed = revealSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const session = await prisma.examSession.findUnique({ where: { id: parsed.data.examSessionId } });
  if (!session || session.userId !== user.id) return { ok: false };

  await prisma.examAnswer.updateMany({
    where: { examSessionId: parsed.data.examSessionId, questionId: parsed.data.questionId },
    data: { revealedModelAnswer: true, selfRating: parsed.data.selfRating as never },
  });

  return { ok: true };
}

export async function completeExamSessionAction(examSessionId: string) {
  const user = await requireUser();
  const session = await prisma.examSession.findUnique({ where: { id: examSessionId } });
  if (!session || session.userId !== user.id) return { ok: false };

  await prisma.examSession.update({ where: { id: examSessionId }, data: { completedAt: new Date() } });
  revalidatePath("/fortschritt");
  return { ok: true };
}
