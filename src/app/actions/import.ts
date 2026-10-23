"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { save, ALLOWED_IMPORT_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { extractQuestionBlocks } from "@/lib/import/extractText";

export type ActionState = { error?: string } | null;

export async function uploadImportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdminUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine Datei auswählen." };
  }
  const fileType = ALLOWED_IMPORT_TYPES[file.type];
  if (!fileType) {
    return { error: "Nicht unterstütztes Dateiformat. Erlaubt: PDF, DOCX, TXT, XLSX." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Die Datei ist zu groß (maximal 20 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await save("imports", file.name, buffer); // kept on disk for traceability; not directly linked from the batch row

  const batch = await prisma.importBatch.create({
    data: {
      fileName: file.name,
      fileType,
      status: "PROCESSING",
      uploadedById: admin.id,
    },
  });

  try {
    const result = await extractQuestionBlocks(fileType, buffer);

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        rawText: result.rawText.slice(0, 500_000),
        status: "NEEDS_REVIEW",
        errorMessage: result.warning,
      },
    });

    for (const block of result.blocks) {
      const question = await prisma.question.create({
        data: {
          originalText: block.originalText,
          sourceType: "IMPORT",
          sourceFile: file.name,
          pageReference: block.pageReference,
          importDate: new Date(),
          importBatchId: batch.id,
          status: "DRAFT",
          createdById: admin.id,
        },
      });
      if (block.originalAnswer) {
        await prisma.questionAnswer.create({
          data: { questionId: question.id, type: "ORIGINAL", text: block.originalAnswer },
        });
      }
    }

    await logAudit(
      admin.id,
      "ImportBatch",
      batch.id,
      "IMPORT",
      `${result.blocks.length} Fragen extrahiert aus ${file.name}`,
    );
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unbekannter Fehler beim Import.",
      },
    });
  }

  redirect(`/admin/import/${batch.id}`);
}

export async function markBatchReviewedAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.importBatch.update({ where: { id }, data: { status: "REVIEWED" } });
  await logAudit(admin.id, "ImportBatch", id, "REVIEWED");
  revalidatePath(`/admin/import/${id}`);
  revalidatePath("/admin/import");
}

