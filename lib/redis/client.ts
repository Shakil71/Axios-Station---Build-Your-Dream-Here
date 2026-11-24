import "server-only";
import Redis from "ioredis";
import { env } from "@/lib/env";

const g = globalThis as unknown as { __redis?: Redis; __redisDownUntil?: number };

/** Returns a ready Redis client, or null when Redis is not configured / unavailable. */
export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (!g.__redis) {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: (times) => Math.min(times * 500, 10_000),
    });
    client.on("error", (e: Error) => {
      if (!g.__redisDownUntil || Date.now() > g.__redisDownUntil) {
        console.warn("[redis] unavailable, falling back to database:", e.message);
      }
      g.__redisDownUntil = Date.now() + 15_000;
    });
    client.on("ready", () => {
      g.__redisDownUntil = 0;
    });
    g.__redis = client;
  }
  return g.__redis.status === "ready" ? g.__redis : null;
}
