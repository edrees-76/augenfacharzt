import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { RequestResetForm } from "@/components/auth/RequestResetForm";

export default function RequestResetPage() {
  return (
    <Card>
      <CardTitle>Passwort vergessen</CardTitle>
      <CardDescription>
        Geben Sie Ihre hinterlegte E-Mail-Adresse ein. Falls kein Anbieter für den E-Mail-Versand
        konfiguriert ist, wenden Sie sich zusätzlich an den Administrator.
      </CardDescription>
      <div className="mt-6">
        <RequestResetForm />
      </div>
    </Card>
  );
}
