import "server-only";
import { getRedis } from "./client";
import { CACHE_PREFIX, invalidationMap } from "./keys";
import { env } from "@/lib/env";

/**
 * Read-through cache. Data comes from Redis when available, otherwise from
 * `loader` (the database). Redis failures never break the request.
 */
export async function cached<T>(key: string, loader: () => Promise<T>, ttl = env.CACHE_TTL_SECONDS): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit !== null) return JSON.parse(hit) as T;
    } catch {
      /* fall through to loader */
    }
  }
  const value = await loader();
  if (redis && value !== undefined && value !== null) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch {
      /* ignore */
    }
  }
  return value;
}

async function deleteByPattern(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  let cursor = "0";
  let removed = 0;
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = next;
    if (keys.length) removed += await redis.del(...keys);
  } while (cursor !== "0");
  return removed;
}

/** Drop all public cache namespaces affected by a change to `entityType`. */
export async function invalidateEntity(entityType: string): Promise<number> {
  const namespaces = invalidationMap[entityType] ?? [];
  let total = 0;
  for (const ns of namespaces) {
    try {
      total += await deleteByPattern(`${CACHE_PREFIX}:${ns}*`);
    } catch (e) {
      console.warn("[cache] invalidation failed", ns, e instanceof Error ? e.message : e);
    }
  }
  return total;
}

export async function invalidateAll(): Promise<number> {
  try {
    return await deleteByPattern(`${CACHE_PREFIX}:*`);
  } catch {
    return 0;
  }
}
