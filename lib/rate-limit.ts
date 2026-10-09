import { createHash } from "node:crypto";

export interface RateLimitStore {
  consume(key: string, limit: number, windowMs: number, now: number): { allowed: boolean; remaining: number; resetAfterSeconds: number };
}

export type RateLimitResult =
  | { status: "allowed" | "limited"; limit: number; remaining: number; resetAfterSeconds: number }
  | { status: "unavailable" };

class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();
  private lastCleanup = 0;

  consume(key: string, limit: number, windowMs: number, now: number) {
    if (now - this.lastCleanup >= CLEANUP_INTERVAL_MS) {
      for (const [bucketKey, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(bucketKey);
      }
      this.lastCleanup = now;
    }
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)) };
    }
    const allowed = current.count < limit;
    if (allowed) current.count += 1;
    return {
      allowed,
      remaining: Math.max(0, limit - current.count),
      resetAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
}

const CLEANUP_INTERVAL_MS = 60_000;
let defaultStore: RateLimitStore = new MemoryRateLimitStore();

export function configureRateLimitStore(store: RateLimitStore) {
  defaultStore = store;
}

export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  return defaultStore.consume(key, limit, windowMs, Date.now()).allowed;
}

const incrementWithExpiry = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return {count, redis.call("PTTL", KEYS[1])}
`;

function hashedRateLimitKey(key: string) {
  return `agentnine:ratelimit:${createHash("sha256").update(key).digest("hex")}`;
}

export async function checkRequestRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const configuredUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!configuredUrl || !token) {
    if (process.env.NODE_ENV !== "production") {
      const result = defaultStore.consume(key, limit, windowMs, Date.now());
      return {
        status: result.allowed ? "allowed" : "limited",
        limit,
        remaining: result.remaining,
        resetAfterSeconds: result.resetAfterSeconds,
      };
    }
    console.error("Shared rate limiting is unavailable: Upstash URL or token is not configured.");
    return { status: "unavailable" };
  }

  try {
    const endpoint = new URL(configuredUrl);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new Error("UPSTASH_REDIS_REST_URL must be an HTTPS URL without credentials, query, or fragment.");
    }
    const baseUrl = endpoint.toString().replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["EVAL", incrementWithExpiry, "1", hashedRateLimitKey(key), String(windowMs)]]),
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) throw new Error(`Upstash returned HTTP ${response.status}.`);
    const result: unknown = await response.json();
    if (!Array.isArray(result) || result.length !== 1 || !result[0] || typeof result[0] !== "object") {
      throw new Error("Upstash returned an invalid rate-limit response.");
    }
    const entry = result[0] as { error?: unknown; result?: unknown };
    if (entry.error || !Array.isArray(entry.result) || entry.result.length !== 2) {
      throw new Error("Upstash could not evaluate the rate-limit command.");
    }
    const [count, ttl] = entry.result;
    if (typeof count !== "number" || !Number.isFinite(count) || typeof ttl !== "number" || !Number.isFinite(ttl) || ttl < 0) {
      throw new Error("Upstash returned invalid rate-limit counters.");
    }
    return {
      status: count <= limit ? "allowed" : "limited",
      limit,
      remaining: Math.max(0, limit - count),
      resetAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)),
    };
  } catch (error) {
    console.error("Distributed rate-limit request failed:", error);
    return { status: "unavailable" };
  }
}
