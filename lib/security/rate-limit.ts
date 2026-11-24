import "server-only";
import { getRedis } from "@/lib/redis/client";

type Result = { allowed: boolean; remaining: number; retryAfterSec: number };

const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window rate limiter. Uses Redis (shared across PM2 instances) when
 * available, otherwise an in-process map so protection never disappears.
 */
export async function rateLimit(bucket: string, id: string, limit: number, windowSec: number): Promise<Result> {
  const key = `axs:rl:${bucket}:${id}`;
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);
      const ttl = await redis.ttl(key);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSec: ttl > 0 ? ttl : windowSec };
    } catch {
      /* fall back to memory */
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    if (memory.size > 10_000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return { allowed: true, remaining: limit - 1, retryAfterSec: windowSec };
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/** Clear a counter (e.g. after a successful login, so only failures count). */
export async function resetRateLimit(bucket: string, id: string): Promise<void> {
  const key = `axs:rl:${bucket}:${id}`;
  memory.delete(key);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      /* ignore */
    }
  }
}

export const limits = {
  login: { limit: 5, windowSec: 15 * 60 },
  contact: { limit: 5, windowSec: 60 * 60 },
  newsletter: { limit: 5, windowSec: 60 * 60 },
  passwordReset: { limit: 3, windowSec: 60 * 60 },
  upload: { limit: 60, windowSec: 60 * 60 },
} as const;
