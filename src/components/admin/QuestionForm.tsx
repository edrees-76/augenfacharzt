"use client";

import { useActionState } from "react";
import { saveQuestionAction, type ActionState } from "@/app/actions/questions";
import { Button } from "@/components/ui/Button";
import { Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

type Specialty = { id: string; name: string };

export function QuestionForm({
  id,
  originalText,
  specialties,
  selectedSpecialtyIds,
}: {
  id?: string;
  originalText?: string;
  specialties: Specialty[];
  selectedSpecialtyIds?: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveQuestionAction,
    null,
  );
  const selected = new Set(selectedSpecialtyIds ?? []);

  return (
    <form action={formAction} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <FieldGroup>
        <Label htmlFor="originalText">Originalfragetext</Label>
        <Textarea
          id="originalText"
          name="originalText"
          rows={4}
          required
          defaultValue={originalText}
          placeholder="z. B. Was ist ein Zentralarterienverschluss?"
        />
      </FieldGroup>
      <FieldGroup>
        <Label>Fachgebiete</Label>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3 sm:grid-cols-3">
          {specialties.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specialtyIds"
                value={s.id}
                defaultChecked={selected.has(s.id)}
                className="rounded border-border text-accent focus:ring-accent/30"
              />
              {s.name}
            </label>
          ))}
        </div>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert …" : id ? "Änderungen speichern" : "Frage anlegen"}
      </Button>
    </form>
  );
}
