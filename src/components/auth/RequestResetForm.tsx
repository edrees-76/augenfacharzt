"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function RequestResetForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.success) {
    return <Alert tone="success">{state.success}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-1">
      {state?.error && (
        <Alert tone="danger" className="mb-4">
          {state.error}
        </Alert>
      )}
      <FieldGroup>
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Wird gesendet …" : "Link zum Zurücksetzen anfordern"}
      </Button>
    </form>
  );
}
