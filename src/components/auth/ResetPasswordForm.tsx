"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup, HelpText } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resetPasswordAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <Alert tone="danger" className="mb-4">
          {state.error}
        </Alert>
      )}
      <FieldGroup>
        <Label htmlFor="password">Neues Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} autoFocus />
        <HelpText>Mindestens 10 Zeichen.</HelpText>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Passwort speichern"}
      </Button>
    </form>
  );
}
