"use client";

import { useActionState } from "react";
import { deleteMyAccountAction, type ActionState } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup, HelpText } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteMyAccountAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      <FieldGroup>
        <Label htmlFor="confirmation">
          Geben Sie zur Bestätigung Ihren Benutzernamen (&quot;{username}&quot;) ein
        </Label>
        <Input id="confirmation" name="confirmation" required />
        <HelpText>
          Löscht unwiderruflich Ihren Lernfortschritt, Lesezeichen und Prüfungssimulationen.
        </HelpText>
      </FieldGroup>
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Wird gelöscht …" : "Konto endgültig löschen"}
      </Button>
    </form>
  );
}
