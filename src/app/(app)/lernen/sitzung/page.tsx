import { prisma } from "@/lib/prisma";
import { getPublishedQuestions } from "@/lib/learning";
import { LearnSession } from "@/components/learn/LearnSession";

export default async function LearnSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string }>;
}) {
  const { specialty } = await searchParams;
  const [questions, specialtyRecord] = await Promise.all([
    getPublishedQuestions({ specialtyId: specialty }),
    specialty ? prisma.specialty.findUnique({ where: { id: specialty } }) : Promise.resolve(null),
  ]);

  return <LearnSession questions={questions} title={specialtyRecord?.name ?? "Alle Fachgebiete"} />;
}
