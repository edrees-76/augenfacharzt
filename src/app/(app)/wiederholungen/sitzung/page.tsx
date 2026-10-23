import { requireApprovedUser } from "@/lib/guards";
import { getDueReviewIds } from "@/lib/reviews";
import { getPublishedQuestions } from "@/lib/learning";
import { LearnSession } from "@/components/learn/LearnSession";

export default async function ReviewSessionPage() {
  const user = await requireApprovedUser();
  const dueIds = await getDueReviewIds(user.id);
  const questions = await getPublishedQuestions({ questionIds: dueIds });
  // Preserve the priority order computed by getDueReviewIds (not guaranteed by the IN query).
  const ordered = dueIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  return <LearnSession questions={ordered} title="Fällige Wiederholungen" />;
}
