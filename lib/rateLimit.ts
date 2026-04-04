// src/lib/rateLimit.ts
// In-memory rate limiter — works on Vercel Edge/Node runtimes
// Resets on cold start, but sufficient for abuse prevention without Redis

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export type RateLimitConfig = {
  limit: number;       // max requests
  windowMs: number;    // time window in ms
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;     // unix ms timestamp
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request in this window, or window has expired
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, newEntry);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Within the window
  entry.count += 1;
  store.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  return {
    success: entry.count <= config.limit,
    limit: config.limit,
    remaining,
    resetAt: entry.resetAt,
  };
}
