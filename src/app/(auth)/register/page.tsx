import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const settings = await prisma.registrationSettings.findUnique({ where: { id: 1 } });
  const registrationOpen = settings?.registrationOpen ?? true;

  return (
    <Card>
      <CardTitle>Registrieren</CardTitle>
      <CardDescription>
        Erstellen Sie ein Konto. Der Zugriff auf die Lerninhalte erfolgt erst nach Freischaltung
        durch den Administrator.
      </CardDescription>
      <div className="mt-6">
        {registrationOpen ? (
          <RegisterForm />
        ) : (
          <>
            <Alert tone="warning">
              Die Registrierung ist derzeit geschlossen. Bitte wenden Sie sich an den
              Administrator.
            </Alert>
            <p className="mt-4 text-center text-sm text-muted">
              Bereits registriert?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Anmelden
              </Link>
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
