/**
 * Flip due SCHEDULED blog posts to PUBLISHED (the public site already shows
 * them once due; this keeps admin status accurate) and clear caches.
 * Cron: every 5 minutes →  * /5 * * * * cd /var/www/axios-station && npx tsx scripts/publish-scheduled.ts
 */
import "dotenv/config";
import Redis from "ioredis";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = new URL(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  }),
});

async function main() {
  const r = await prisma.blogPost.updateMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() }, deletedAt: null },
    data: { status: "PUBLISHED" },
  });
  if (r.count && process.env.REDIS_URL) {
    const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    const keys = await redis.keys("axs:pub:blog*");
    const pageKeys = await redis.keys("axs:pub:page*");
    if (keys.length + pageKeys.length) await redis.del(...keys, ...pageKeys);
    redis.disconnect();
  }
  console.log(`[${new Date().toISOString()}] published ${r.count} scheduled post(s)`);
}

main().finally(() => prisma.$disconnect());
