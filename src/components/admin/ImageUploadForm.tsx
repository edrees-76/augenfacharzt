"use client";

import { useActionState, useRef } from "react";
import { uploadQuestionImageAction, type ActionState } from "@/app/actions/questions";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

const IMAGE_TYPES: { value: string; label: string }[] = [
  { value: "FUNDUS", label: "Fundusfoto" },
  { value: "OCT", label: "OCT" },
  { value: "SLIT_LAMP", label: "Spaltlampenfoto" },
  { value: "FLUORESCEIN_ANGIOGRAPHY", label: "Fluoreszenzangiographie" },
  { value: "VISUAL_FIELD", label: "Gesichtsfeld" },
  { value: "CORNEAL_TOPOGRAPHY", label: "Hornhauttopographie" },
  { value: "ULTRASOUND", label: "Okulärer Ultraschall" },
  { value: "CT_MRT", label: "CT / MRT" },
  { value: "ANATOMICAL_DIAGRAM", label: "Anatomisches Diagramm" },
  { value: "OTHER", label: "Sonstiges" },
];

export function ImageUploadForm({ questionId }: { questionId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadQuestionImageAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-3 rounded-md border border-dashed border-border p-4"
    >
      <input type="hidden" name="questionId" value={questionId} />
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <FieldGroup>
        <Label htmlFor="file">Bilddatei</Label>
        <Input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
      </FieldGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="type">Bildtyp</Label>
          <Select id="type" name="type" defaultValue="OTHER">
            {IMAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="caption">Bildunterschrift</Label>
          <Input id="caption" name="caption" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="source">Quelle</Label>
          <Input id="source" name="source" placeholder="z. B. eigene Aufnahme, Klinik XY" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="license">Lizenz</Label>
          <Input id="license" name="license" placeholder="z. B. intern, CC-BY ..." />
        </FieldGroup>
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Wird hochgeladen …" : "Bild hochladen"}
      </Button>
    </form>
  );
}
