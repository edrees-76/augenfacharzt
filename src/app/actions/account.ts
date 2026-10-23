"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  verifyPassword,
  hashPassword,
  destroyAllSessionsForUser,
  destroyCurrentSession,
} from "@/lib/auth";

export type ActionState = { error?: string; success?: string } | null;

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 10) {
    return { error: "Das neue Passwort muss mindestens 10 Zeichen lang sein." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Die neuen Passwörter stimmen nicht überein." };
  }
  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(currentPassword, fresh.passwordHash))) {
    return { error: "Das aktuelle Passwort ist nicht korrekt." };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: "Passwort wurde geändert." };
}

export async function deleteMyAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== user.username) {
    return { error: "Bitte geben Sie zur Bestätigung Ihren Benutzernamen exakt ein." };
  }

  const authoredCount =
    (await prisma.question.count({ where: { createdById: user.id } })) +
    (await prisma.clinicalCase.count({ where: { createdById: user.id } })) +
    (await prisma.questionImage.count({ where: { uploadedById: user.id } })) +
    (await prisma.importBatch.count({ where: { uploadedById: user.id } }));

  if (authoredCount > 0) {
    return {
      error:
        "Ihr Konto hat Inhalte erstellt oder freigegeben (Fragen, Fälle, Bilder oder Importe) und kann " +
        "deshalb nicht automatisch gelöscht werden, um die Nachvollziehbarkeit der Lerninhalte zu " +
        "erhalten. Bitte wenden Sie sich an einen anderen Administrator.",
    };
  }

  await destroyCurrentSession();
  await destroyAllSessionsForUser(user.id);
  await prisma.user.delete({ where: { id: user.id } });
  redirect("/login");
}
