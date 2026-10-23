"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

export type ActionState = { error?: string; success?: string } | null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const createSchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function createSpecialtyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdminUser();
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "Bitte einen gültigen Namen eingeben." };

  const existing = await prisma.specialty.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "Dieses Fachgebiet existiert bereits." };

  const maxOrder = await prisma.specialty.aggregate({ _max: { order: true } });
  const specialty = await prisma.specialty.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  await logAudit(admin.id, "Specialty", specialty.id, "CREATE", specialty.name);
  revalidatePath("/admin/fachgebiete");
  return { success: "Fachgebiet angelegt." };
}

const renameSchema = z.object({ id: z.string().min(1), name: z.string().trim().min(2).max(80) });

export async function renameSpecialtyAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = renameSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return;
  await prisma.specialty.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, slug: slugify(parsed.data.name) },
  });
  await logAudit(admin.id, "Specialty", parsed.data.id, "UPDATE", parsed.data.name);
  revalidatePath("/admin/fachgebiete");
}

export async function deleteSpecialtyAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.specialty.delete({ where: { id } });
  await logAudit(admin.id, "Specialty", id, "DELETE");
  revalidatePath("/admin/fachgebiete");
}
