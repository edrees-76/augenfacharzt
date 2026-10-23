import { setContentStatusAction } from "@/app/actions/questions";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Entwurf",
  IN_REVIEW: "Zur Prüfung",
  APPROVED: "Freigegeben",
  PUBLISHED: "Veröffentlicht",
};

export function StatusControl({
  entityType,
  id,
  status,
}: {
  entityType: "Question" | "ClinicalCase" | "QuestionImage";
  id: string;
  status: string;
}) {
  return (
    <form action={setContentStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="id" value={id} />
      <Select key={status} name="status" defaultValue={status} className="w-auto">
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" size="sm">
        Übernehmen
      </Button>
    </form>
  );
}
