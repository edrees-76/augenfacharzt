import { notFound } from "next/navigation";
import { requireApprovedUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getExamQuestions } from "@/lib/exam";
import { ExamSessionView } from "@/components/exam/ExamSessionView";

export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireApprovedUser();

  const session = await prisma.examSession.findUnique({ where: { id } });
  if (!session || session.userId !== user.id) notFound();

  const questions = await getExamQuestions({
    mode: session.mode,
    specialtyId: session.specialtyId,
    seed: session.id,
  });

  return <ExamSessionView examSessionId={session.id} questions={questions} />;
}
