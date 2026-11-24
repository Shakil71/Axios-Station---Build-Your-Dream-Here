import "server-only";
import { prisma } from "./prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function logActivity(entry: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  meta?: Prisma.InputJsonValue;
  ip?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary?.slice(0, 500),
        meta: entry.meta,
        ip: entry.ip,
      },
    });
  } catch (e) {
    console.error("[activity] failed to log", e instanceof Error ? e.message : e);
  }
}
