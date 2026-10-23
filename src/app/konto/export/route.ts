import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return new NextResponse("Nicht autorisiert", { status: 401 });
  }

  const [progress, examSessions] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId: user.id },
      include: { question: { select: { originalText: true } } },
    }),
    prisma.examSession.findMany({
      where: { userId: user.id },
      include: { answers: { include: { question: { select: { originalText: true } } } } },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
    progress: progress.map((p) => ({
      question: p.question.originalText,
      confidence: p.confidence,
      bookmarked: p.bookmarked,
      timesReviewed: p.timesReviewed,
      lastReviewedAt: p.lastReviewedAt,
      nextReviewAt: p.nextReviewAt,
    })),
    examSessions: examSessions.map((s) => ({
      mode: s.mode,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      answers: s.answers.map((a) => ({
        question: a.question.originalText,
        userAnswerText: a.userAnswerText,
        selfRating: a.selfRating,
      })),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="augenfacharzt-daten-${user.username}.json"`,
    },
  });
}
