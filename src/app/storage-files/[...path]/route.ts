import { NextResponse } from "next/server";
import path from "path";
import { readFile, stat } from "fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments || segments.some((s) => s.includes(".."))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const relativePath = segments.join("/");

  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED") {
    return new NextResponse("Nicht autorisiert", { status: 401 });
  }

  if (relativePath.startsWith("imports/")) {
    if (user.role !== "ADMIN") {
      return new NextResponse("Nicht autorisiert", { status: 403 });
    }
  } else if (relativePath.startsWith("images/")) {
    if (user.role !== "ADMIN") {
      const image = await prisma.questionImage.findFirst({
        where: { filePath: relativePath },
        include: { question: true },
      });
      const visible = image && image.status === "PUBLISHED" && image.question.status === "PUBLISHED";
      if (!visible) {
        return new NextResponse("Nicht gefunden", { status: 404 });
      }
    }
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  const fullPath = path.join(STORAGE_ROOT, relativePath);
  try {
    const info = await stat(fullPath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
