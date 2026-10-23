import { getPublishedQuestions } from "@/lib/learning";
import { LearnSession } from "@/components/learn/LearnSession";

export default async function BildfragenPage() {
  const questions = await getPublishedQuestions({ onlyWithImages: true });
  return <LearnSession questions={questions} title="Bildfragen" mode="bildfragen" />;
}
