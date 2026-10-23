import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local-disk storage for Stage 1. Swap this module for an S3/R2/MinIO-backed
// implementation to go to production — nothing outside this file needs to
// change (every caller only uses save/remove/urlFor).
const STORAGE_ROOT = path.join(process.cwd(), "storage");

function assertSafeSubdir(subdir: string) {
  if (subdir.includes("..") || path.isAbsolute(subdir)) {
    throw new Error("Invalid storage subdirectory");
  }
}

export async function save(
  subdir: string,
  originalFileName: string,
  buffer: Buffer,
): Promise<{ relativePath: string }> {
  assertSafeSubdir(subdir);
  const dir = path.join(STORAGE_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(originalFileName).slice(0, 10);
  const safeName = `${randomUUID()}${ext}`;
  const fullPath = path.join(dir, safeName);
  await writeFile(fullPath, buffer);

  return { relativePath: path.posix.join(subdir, safeName) };
}

export async function remove(relativePath: string): Promise<void> {
  assertSafeSubdir(relativePath);
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  await unlink(fullPath).catch(() => {});
}

/** Public URL for a stored file, served via the /storage-files/[...path] route. */
export function urlFor(relativePath: string): string {
  return `/storage-files/${relativePath}`;
}

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_IMPORT_TYPES: Record<string, "PDF" | "DOCX" | "TXT" | "XLSX"> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
