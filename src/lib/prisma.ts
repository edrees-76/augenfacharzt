import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  // `max: 1` avoids flaky "Connection terminated unexpectedly" errors seen
  // against `prisma dev`'s local proxy database under concurrent queries in
  // dev mode; a real Postgres instance (Docker/managed) tolerates a larger
  // pool fine, but a small pool is a safe default either way at Stage 1 scale.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
