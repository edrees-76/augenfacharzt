import "server-only";
import { prisma } from "@/lib/prisma";

const CONFIDENCE_PRIORITY: Record<string, number> = { NICHT_GEWUSST: 0, TEILWEISE: 1, SICHER: 2 };

export async function getDueReviewIds(userId: string): Promise<string[]> {
  const rows = await prisma.userProgress.findMany({
    where: { userId, nextReviewAt: { lte: new Date() }, question: { status: "PUBLISHED" } },
    select: { questionId: true, confidence: true, nextReviewAt: true },
  });
  rows.sort((a, b) => {
    const pa = CONFIDENCE_PRIORITY[a.confidence ?? "TEILWEISE"] ?? 1;
    const pb = CONFIDENCE_PRIORITY[b.confidence ?? "TEILWEISE"] ?? 1;
    if (pa !== pb) return pa - pb;
    return (a.nextReviewAt?.getTime() ?? 0) - (b.nextReviewAt?.getTime() ?? 0);
  });
  return rows.map((r) => r.questionId);
}

export async function getBookmarkedQuestions(userId: string) {
  return prisma.userProgress.findMany({
    where: { userId, bookmarked: true },
    include: { question: { include: { specialties: { include: { specialty: true } } } } },
    orderBy: { updatedAt: "desc" },
  });
}
