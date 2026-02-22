/**
 * Simple in-memory rate limiter.
 * For production at scale, use Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum requests within the window */
  max: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

/** Pre-configured rate limits */
export const RATE_LIMITS = {
  /** AI endpoints: 20 requests per minute */
  ai: { max: 20, windowSeconds: 60 } as RateLimitConfig,
  /** Auth endpoints: 10 requests per minute */
  auth: { max: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Upload: 10 requests per minute */
  upload: { max: 10, windowSeconds: 60 } as RateLimitConfig,
  /** General API: 60 requests per minute */
  general: { max: 60, windowSeconds: 60 } as RateLimitConfig,
};
