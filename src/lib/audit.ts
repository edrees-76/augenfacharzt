import "server-only";
import { prisma } from "@/lib/prisma";

export async function logAudit(
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  summary?: string,
) {
  await prisma.auditLog.create({
    data: { actorId, entityType, entityId, action, summary },
  });
}
