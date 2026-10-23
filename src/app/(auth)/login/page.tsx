import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <Card>
      <CardTitle>Anmelden</CardTitle>
      <CardDescription>Melden Sie sich mit Ihrem genehmigten Konto an.</CardDescription>
      {params.reset === "1" && (
        <Alert tone="success" className="mt-4">
          Ihr Passwort wurde geändert. Bitte melden Sie sich mit dem neuen Passwort an.
        </Alert>
      )}
      <div className="mt-6">
        <LoginForm next={params.next} />
      </div>
    </Card>
  );
}
