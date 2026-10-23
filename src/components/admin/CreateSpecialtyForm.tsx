"use client";

import { useActionState } from "react";
import { createSpecialtyAction, type ActionState } from "@/app/actions/specialties";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function CreateSpecialtyForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createSpecialtyAction,
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input name="name" placeholder="Neues Fachgebiet, z. B. Onkologie des Auges" required />
        {state?.error && (
          <Alert tone="danger" className="mt-2">
            {state.error}
          </Alert>
        )}
        {state?.success && (
          <Alert tone="success" className="mt-2">
            {state.success}
          </Alert>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird angelegt …" : "Hinzufügen"}
      </Button>
    </form>
  );
}
