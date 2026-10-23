import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Card>
      <CardTitle>Neues Passwort festlegen</CardTitle>
      <CardDescription>Wählen Sie ein neues Passwort für Ihr Konto.</CardDescription>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
    </Card>
  );
}
