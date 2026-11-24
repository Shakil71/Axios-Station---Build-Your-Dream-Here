import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRedis } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for Nginx / uptime monitors. Reveals no secrets. */
export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  const redis = getRedis() ? "up" : "unavailable";
  return NextResponse.json({ status: db ? "ok" : "degraded", db: db ? "up" : "down", redis }, { status: db ? 200 : 503 });
}
