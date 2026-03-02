/**
 * Rate Limiting Utility
 * In-memory rate limiter for API endpoints
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

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
 * Check if a request should be rate limited
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID, phone number)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if the request is allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const { limit, windowSeconds, identifier = "default" } = config;
  const fullKey = `${identifier}:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const record = rateLimitStore.get(fullKey);

  // No existing record or window has expired
  if (!record || record.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(fullKey, { count: 1, resetAt });
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
  rateLimitStore.set(fullKey, record);

  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
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
  // Password reset: 3 requests per hour per email
  PASSWORD_RESET: { limit: 3, windowSeconds: 3600, identifier: "password-reset" },
  // General API: 100 requests per minute per IP
  API_GENERAL: { limit: 100, windowSeconds: 60, identifier: "api" },
} as const;
