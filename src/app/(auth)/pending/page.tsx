import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/app/actions/auth";

const STATUS_MESSAGES: Record<string, { tone: "warning" | "danger"; text: string }> = {
  PENDING: {
    tone: "warning",
    text: "Ihr Konto wartet auf die Freischaltung durch den Administrator. Dies kann einige Zeit dauern.",
  },
  REJECTED: {
    tone: "danger",
    text: "Ihre Registrierung wurde abgelehnt. Bitte wenden Sie sich an den Administrator.",
  },
  SUSPENDED: {
    tone: "danger",
    text: "Ihr Konto wurde gesperrt. Bitte wenden Sie sich an den Administrator.",
  },
};

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const entry = user ? STATUS_MESSAGES[user.status] : undefined;

  return (
    <Card>
      <CardTitle>Freischaltung ausstehend</CardTitle>
      <CardDescription>Status Ihres Kontos</CardDescription>
      <div className="mt-6 space-y-4">
        {params.registered === "1" && (
          <Alert tone="success">Ihr Konto wurde erstellt und wartet nun auf Freischaltung.</Alert>
        )}
        <Alert tone={entry?.tone ?? "warning"}>
          {entry?.text ??
            "Bitte melden Sie sich an, sobald Ihr Konto von einem Administrator freigeschaltet wurde."}
        </Alert>
        {user ? (
          <form action={logoutAction}>
            <Button type="submit" variant="secondary" className="w-full">
              Abmelden
            </Button>
          </form>
        ) : (
          <Link href="/login" className="block">
            <Button type="button" className="w-full">
              Zur Anmeldung
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
