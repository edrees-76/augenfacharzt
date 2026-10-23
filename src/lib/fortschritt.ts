import "server-only";
import { prisma } from "@/lib/prisma";

export async function getProgressBySpecialty(userId: string) {
  const specialties = await prisma.specialty.findMany({ orderBy: { order: "asc" } });

  const results = await Promise.all(
    specialties.map(async (specialty) => {
      const totalPublished = await prisma.question.count({
        where: { status: "PUBLISHED", specialties: { some: { specialtyId: specialty.id } } },
      });
      const progress = await prisma.userProgress.findMany({
        where: {
          userId,
          confidence: { not: null },
          question: { status: "PUBLISHED", specialties: { some: { specialtyId: specialty.id } } },
        },
        select: { confidence: true },
      });
      const sicher = progress.filter((p) => p.confidence === "SICHER").length;
      const teilweise = progress.filter((p) => p.confidence === "TEILWEISE").length;
      const nichtGewusst = progress.filter((p) => p.confidence === "NICHT_GEWUSST").length;
      return {
        specialty: specialty.name,
        totalPublished,
        reviewed: progress.length,
        sicher,
        teilweise,
        nichtGewusst,
      };
    }),
  );

  return results.filter((r) => r.totalPublished > 0);
}

export async function getExamHistory(userId: string) {
  return prisma.examSession.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: { _count: { select: { answers: true } } },
  });
}
