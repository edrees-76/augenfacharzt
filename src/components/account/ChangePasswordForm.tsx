"use client";

import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changePasswordAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-1">
      {state?.error && <Alert tone="danger" className="mb-4">{state.error}</Alert>}
      {state?.success && <Alert tone="success" className="mb-4">{state.success}</Alert>}
      <FieldGroup>
        <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="newPassword">Neues Passwort</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={10} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} />
      </FieldGroup>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Passwort ändern"}
      </Button>
    </form>
  );
}
