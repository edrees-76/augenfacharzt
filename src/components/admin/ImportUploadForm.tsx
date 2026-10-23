"use client";

import { useActionState } from "react";
import { uploadImportAction, type ActionState } from "@/app/actions/import";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup, HelpText } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function ImportUploadForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadImportAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <FieldGroup>
        <Label htmlFor="file">Datei</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
        />
        <HelpText>PDF, DOCX, TXT oder XLSX, maximal 20 MB. Eine Datei pro Durchlauf.</HelpText>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird verarbeitet …" : "Hochladen und Fragen extrahieren"}
      </Button>
    </form>
  );
}
