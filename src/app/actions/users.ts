"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/guards";
import { destroyAllSessionsForUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const USER_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;

const statusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(USER_STATUSES),
});

export async function setUserStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = statusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  if (parsed.data.userId === admin.id && parsed.data.status !== "APPROVED") {
    // Guard rail: an admin cannot lock themselves out through this form.
    return;
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  });

  if (parsed.data.status !== "APPROVED") {
    // Suspension/rejection must take effect immediately: drop all live sessions.
    await destroyAllSessionsForUser(parsed.data.userId);
  }

  await logAudit(admin.id, "User", parsed.data.userId, "STATUS_CHANGE", parsed.data.status);
  revalidatePath("/admin/benutzer");
}

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;
  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    return; // cannot demote yourself and lose admin access
  }
  await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  await logAudit(admin.id, "User", parsed.data.userId, "ROLE_CHANGE", parsed.data.role);
  revalidatePath("/admin/benutzer");
}

export async function toggleRegistrationAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const open = formData.get("registrationOpen") === "true";
  await prisma.registrationSettings.upsert({
    where: { id: 1 },
    update: { registrationOpen: open },
    create: { id: 1, registrationOpen: open },
  });
  await logAudit(admin.id, "RegistrationSettings", "1", "UPDATE", open ? "OPEN" : "CLOSED");
  revalidatePath("/admin/benutzer");
  revalidatePath("/register");
}
