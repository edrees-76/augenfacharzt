"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { save, remove, ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage";

export type ActionState = { error?: string; success?: string } | null;

const CONTENT_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED"] as const;

// ---------- Question CRUD ----------

const questionSchema = z.object({
  id: z.string().optional(),
  originalText: z.string().trim().min(5, "Bitte den Fragetext eingeben."),
  specialtyIds: z.array(z.string()).min(1, "Bitte mindestens ein Fachgebiet auswählen."),
});

export async function saveQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdminUser();
  const specialtyIds = formData.getAll("specialtyIds").map(String).filter(Boolean);
  const parsed = questionSchema.safeParse({
    id: formData.get("id") || undefined,
    originalText: formData.get("originalText"),
    specialtyIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  let questionId: string;
  if (parsed.data.id) {
    const question = await prisma.question.update({
      where: { id: parsed.data.id },
      data: { originalText: parsed.data.originalText },
    });
    questionId = question.id;
    await prisma.questionSpecialty.deleteMany({ where: { questionId } });
    await logAudit(admin.id, "Question", questionId, "UPDATE");
  } else {
    const question = await prisma.question.create({
      data: {
        originalText: parsed.data.originalText,
        sourceType: "MANUAL",
        status: "DRAFT",
        createdById: admin.id,
      },
    });
    questionId = question.id;
    await logAudit(admin.id, "Question", questionId, "CREATE");
  }

  await prisma.questionSpecialty.createMany({
    data: parsed.data.specialtyIds.map((specialtyId) => ({ questionId, specialtyId })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/fragen");
  redirect(`/admin/fragen/${questionId}`);
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const images = await prisma.questionImage.findMany({ where: { questionId: id } });
  await Promise.all(images.map((img) => remove(img.filePath)));
  await prisma.question.delete({ where: { id } });
  await logAudit(admin.id, "Question", id, "DELETE");
  revalidatePath("/admin/fragen");
  redirect("/admin/fragen");
}

const statusSchema = z.object({
  entityType: z.enum(["Question", "ClinicalCase", "QuestionImage"]),
  id: z.string().min(1),
  status: z.enum(CONTENT_STATUSES),
  redirectTo: z.string().optional(),
});

export async function setContentStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = statusSchema.safeParse({
    entityType: formData.get("entityType"),
    id: formData.get("id"),
    status: formData.get("status"),
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!parsed.success) return;

  const { entityType, id, status } = parsed.data;
  if (entityType === "Question") {
    await prisma.question.update({ where: { id }, data: { status } });
  } else if (entityType === "ClinicalCase") {
    await prisma.clinicalCase.update({ where: { id }, data: { status } });
  } else if (entityType === "QuestionImage") {
    await prisma.questionImage.update({ where: { id }, data: { status } });
  }
  await logAudit(admin.id, entityType, id, "STATUS_CHANGE", status);

  revalidatePath("/admin/fragen");
  revalidatePath("/admin/freigabe");
  if (parsed.data.redirectTo) revalidatePath(parsed.data.redirectTo);
}

// ---------- Answers (Originalantwort / Musterantwort) ----------

const answerSchema = z.object({
  questionId: z.string().min(1),
  type: z.enum(["ORIGINAL", "MODEL"]),
  text: z.string().trim(),
});

export async function saveAnswerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdminUser();
  const parsed = answerSchema.safeParse({
    questionId: formData.get("questionId"),
    type: formData.get("type"),
    text: formData.get("text"),
  });
  if (!parsed.success) return { error: "Ungültige Eingabe." };
  if (parsed.data.text.length === 0) return { error: "Bitte einen Antworttext eingeben." };

  const existing = await prisma.questionAnswer.findFirst({
    where: { questionId: parsed.data.questionId, type: parsed.data.type },
  });

  if (existing) {
    await prisma.questionAnswer.update({
      where: { id: existing.id },
      data: {
        text: parsed.data.text,
        ...(parsed.data.type === "MODEL"
          ? { approvedById: admin.id, approvedAt: new Date() }
          : {}),
      },
    });
  } else {
    await prisma.questionAnswer.create({
      data: {
        questionId: parsed.data.questionId,
        type: parsed.data.type,
        text: parsed.data.text,
        ...(parsed.data.type === "MODEL"
          ? { approvedById: admin.id, approvedAt: new Date() }
          : {}),
      },
    });
  }

  await logAudit(admin.id, "QuestionAnswer", parsed.data.questionId, "UPSERT", parsed.data.type);
  revalidatePath(`/admin/fragen/${parsed.data.questionId}`);
  return { success: "Antwort gespeichert." };
}

// ---------- Clinical case + follow-ups ----------

const caseSchema = z.object({
  questionId: z.string().min(1),
  scenarioText: z.string().trim().min(5, "Bitte einen Fallbeschreibungstext eingeben."),
  followUps: z.array(z.string().trim()).max(5),
});

export async function saveClinicalCaseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdminUser();
  const followUps = formData
    .getAll("followUps")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = caseSchema.safeParse({
    questionId: formData.get("questionId"),
    scenarioText: formData.get("scenarioText"),
    followUps,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await prisma.clinicalCase.findUnique({
    where: { questionId: parsed.data.questionId },
  });

  const caseId = existing
    ? existing.id
    : (
        await prisma.clinicalCase.create({
          data: {
            questionId: parsed.data.questionId,
            scenarioText: parsed.data.scenarioText,
            status: "DRAFT",
            createdById: admin.id,
          },
        })
      ).id;

  if (existing) {
    await prisma.clinicalCase.update({
      where: { id: caseId },
      data: { scenarioText: parsed.data.scenarioText },
    });
    await prisma.followUpQuestion.deleteMany({ where: { caseId } });
  }

  await prisma.followUpQuestion.createMany({
    data: parsed.data.followUps.map((text, order) => ({ caseId, text, order })),
  });

  await logAudit(admin.id, "ClinicalCase", caseId, existing ? "UPDATE" : "CREATE");
  revalidatePath(`/admin/fragen/${parsed.data.questionId}`);
  return { success: "Klinischer Fall gespeichert." };
}

export async function deleteClinicalCaseAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!id) return;
  await prisma.clinicalCase.delete({ where: { id } });
  await logAudit(admin.id, "ClinicalCase", id, "DELETE");
  if (questionId) revalidatePath(`/admin/fragen/${questionId}`);
}

// ---------- Images ----------

export async function uploadQuestionImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdminUser();
  const questionId = String(formData.get("questionId") ?? "");
  const type = String(formData.get("type") ?? "OTHER");
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "").trim() || null;
  const license = String(formData.get("license") ?? "").trim() || null;
  const file = formData.get("file");

  if (!questionId || !(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine Bilddatei auswählen." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "Nur JPEG, PNG, WEBP oder GIF werden unterstützt." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Die Datei ist zu groß (maximal 20 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { relativePath } = await save("images", file.name, buffer);

  await prisma.questionImage.create({
    data: {
      questionId,
      filePath: relativePath,
      type: type as never,
      caption,
      source,
      license,
      status: "DRAFT",
      uploadedById: admin.id,
    },
  });

  await logAudit(admin.id, "QuestionImage", questionId, "UPLOAD");
  revalidatePath(`/admin/fragen/${questionId}`);
  return { success: "Bild hochgeladen (Status: Entwurf)." };
}

const batchStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(CONTENT_STATUSES),
});

export async function batchSetQuestionStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = batchStatusSchema.safeParse({
    ids: formData.getAll("ids").map(String),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.question.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { status: parsed.data.status },
  });
  await Promise.all(
    parsed.data.ids.map((id) =>
      logAudit(admin.id, "Question", id, "STATUS_CHANGE", `BATCH:${parsed.data.status}`),
    ),
  );
  revalidatePath("/admin/freigabe");
  revalidatePath("/admin/fragen");
}

export async function batchApproveQuestionsAction(formData: FormData): Promise<void> {
  formData.set("status", "APPROVED");
  await batchSetQuestionStatusAction(formData);
}

export async function batchPublishQuestionsAction(formData: FormData): Promise<void> {
  formData.set("status", "PUBLISHED");
  await batchSetQuestionStatusAction(formData);
}

export async function deleteQuestionImageAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  if (!id) return;
  const image = await prisma.questionImage.findUnique({ where: { id } });
  if (!image) return;
  await remove(image.filePath);
  await prisma.questionImage.delete({ where: { id } });
  await logAudit(admin.id, "QuestionImage", id, "DELETE");
  if (questionId) revalidatePath(`/admin/fragen/${questionId}`);
}
