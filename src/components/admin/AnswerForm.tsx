"use client";

import { useActionState } from "react";
import { saveAnswerAction, type ActionState } from "@/app/actions/questions";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function AnswerForm({
  questionId,
  type,
  initialText,
}: {
  questionId: string;
  type: "ORIGINAL" | "MODEL";
  initialText?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveAnswerAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="type" value={type} />
      <Textarea name="text" rows={6} defaultValue={initialText} />
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}
