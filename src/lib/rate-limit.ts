/**
 * Rate Limiting Utility
 *
 * Uses a pluggable store interface so the same code works in:
 *   - Development / single-instance: in-memory store (default)
 *   - Production / serverless: Redis store (set REDIS_URL env var)
 *
 * The store is selected automatically based on environment configuration.
 * To use Redis in production, set REDIS_URL and install `ioredis` or `@upstash/redis`.
 */

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * Store interface for rate limit records.
 * Implement this to plug in Redis, Upstash, or any other distributed store.
 */
export interface RateLimitStore {
  get(key: string): Promise<RateLimitRecord | null>;
  set(key: string, record: RateLimitRecord): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * In-memory rate limit store (default).
 * Works for single-instance deployments and development.
 * NOT suitable for serverless/multi-instance production — use RedisStore instead.
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitRecord>();

  constructor() {
    // Clean up expired entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (record.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, record: RateLimitRecord): Promise<void> {
    this.store.set(key, record);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Redis rate limit store (stub).
 * To enable: install `ioredis` (or `@upstash/redis`), set REDIS_URL,
 * and uncomment the implementation below.
 *
 * Example with ioredis:
 *   import Redis from "ioredis";
 *   const redis = new Redis(process.env.REDIS_URL);
 *   class RedisRateLimitStore implements RateLimitStore { ... }
 */
class RedisRateLimitStore implements RateLimitStore {
  private redis: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, px?: string, ex?: number): Promise<string | null>;
    del(key: string): Promise<number>;
  };

  constructor(redisClient: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, px?: string, ex?: number): Promise<string | null>;
    del(key: string): Promise<number>;
  }) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RateLimitRecord;
    } catch {
      return null;
    }
  }

  async set(key: string, record: RateLimitRecord): Promise<void> {
    const ttlMs = Math.max(0, record.resetAt - Date.now());
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    if (ttlSeconds > 0) {
      await this.redis.set(key, JSON.stringify(record), "EX", ttlSeconds);
    } else {
      await this.redis.set(key, JSON.stringify(record));
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// Singleton store instance
let _store: RateLimitStore | null = null;

/**
 * Get the rate limit store singleton.
 * Uses Redis if REDIS_URL is set and a Redis client is available,
 * otherwise falls back to in-memory.
 */
async function getStore(): Promise<RateLimitStore> {
  if (_store) return _store;

  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      // Dynamic import with variable to prevent bundler static analysis
      // ioredis is an optional dependency — only needed in production with Redis
      const moduleName = "ioredis";
      const mod = await (eval(`import(${JSON.stringify(moduleName)})`) as Promise<{
        default: new (url: string) => any;
      }>);
      const redisClient = new mod.default(redisUrl);
      _store = new RedisRateLimitStore(redisClient);
      console.log("Rate limiter: using Redis store");
    } catch {
      // ioredis not installed — fall back to memory
      console.warn("Rate limiter: REDIS_URL set but ioredis not installed. Using in-memory store.");
      _store = new MemoryRateLimitStore();
    }
  } else {
    _store = new MemoryRateLimitStore();
  }

  return _store;
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier prefix for the rate limit key */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID, phone number)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if the request is allowed
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const { limit, windowSeconds, identifier = "default" } = config;
  const fullKey = `${identifier}:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const store = await getStore();
  const record = await store.get(fullKey);

  // No existing record or window has expired
  if (!record || record.resetAt < now) {
    const resetAt = now + windowMs;
    const newRecord: RateLimitRecord = { count: 1, resetAt };
    await store.set(fullKey, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  // Within window, check count
  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSeconds,
    };
  }

  // Increment count
  record.count += 1;
  await store.set(fullKey, record);

  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Synchronous rate limit check (legacy — uses in-memory store only).
 * @deprecated Use the async `checkRateLimit` instead.
 */
export function checkRateLimitSync(key: string, config: RateLimitConfig): RateLimitResult {
  const { limit, windowSeconds, identifier = "default" } = config;
  const fullKey = `${identifier}:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Use the internal store directly for sync access
  const store = _store;
  if (!store || !(store instanceof MemoryRateLimitStore)) {
    // If no store initialized or not memory store, initialize memory store
    if (!_store) _store = new MemoryRateLimitStore();
  }

  const memoryStore = _store as MemoryRateLimitStore;
  // Access the internal map via the public interface
  // Since MemoryRateLimitStore.get is async, we need a sync path
  // This is a compromise for backward compatibility
  const record = memoryStore['store' as keyof MemoryRateLimitStore] as unknown as Map<string, RateLimitRecord>;
  if (!record) {
    // Fallback if internal access fails
    return { success: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }

  const existing = record.get(fullKey);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    record.set(fullKey, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  record.set(fullKey, existing);
  return { success: true, limit, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfterSeconds ? { "Retry-After": result.retryAfterSeconds.toString() } : {}),
  };
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  // OTP sending: 3 requests per 5 minutes per phone
  OTP_SEND: { limit: 3, windowSeconds: 300, identifier: "otp-send" },
  // OTP verification: 5 attempts per 10 minutes per phone
  OTP_VERIFY: { limit: 5, windowSeconds: 600, identifier: "otp-verify" },
  // Registration: 5 attempts per hour per IP
  REGISTER: { limit: 5, windowSeconds: 3600, identifier: "register" },
  // Login: 10 attempts per 15 minutes per IP
  LOGIN: { limit: 10, windowSeconds: 900, identifier: "login" },
  // Login failed attempts: 5 failures per 15 minutes per phone (account lockout)
  LOGIN_FAILED: { limit: 5, windowSeconds: 900, identifier: "login-failed" },
  // Password reset: 3 requests per hour per email
  PASSWORD_RESET: { limit: 3, windowSeconds: 3600, identifier: "password-reset" },
  // General API: 100 requests per minute per IP
  API_GENERAL: { limit: 100, windowSeconds: 60, identifier: "api" },
} as const;
