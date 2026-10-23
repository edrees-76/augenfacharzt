"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup, HelpText } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, null);

  return (
    <form action={formAction} className="space-y-1">
      {state?.error && (
        <Alert tone="danger" className="mb-4">
          {state.error}
        </Alert>
      )}
      <FieldGroup>
        <Label htmlFor="username">Benutzername</Label>
        <Input id="username" name="username" autoComplete="username" required autoFocus minLength={3} maxLength={32} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="email">E-Mail-Adresse (optional, für Passwort-Wiederherstellung)</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
        <HelpText>Mindestens 10 Zeichen.</HelpText>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </FieldGroup>
      <Alert tone="accent" className="mb-4">
        Ihr Konto muss von einem Administrator freigeschaltet werden, bevor Sie sich anmelden
        können.
      </Alert>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Wird erstellt …" : "Konto erstellen"}
      </Button>
      <p className="mt-4 text-center text-sm text-muted">
        Bereits registriert?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
