import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function NewQuestionPage() {
  const specialties = await prisma.specialty.findMany({ orderBy: { order: "asc" } });
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardTitle>Neue Frage</CardTitle>
        <CardDescription>
          Antworten, klinischer Fall und Bilder können nach dem Anlegen ergänzt werden.
        </CardDescription>
        <div className="mt-6">
          <QuestionForm specialties={specialties} />
        </div>
      </Card>
    </div>
  );
}
