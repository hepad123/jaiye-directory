// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

// ─── In-memory store (edge-compatible) ───────────────────────────────────────

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs, limit };
  }

  entry.count++;
  store.set(key, entry);
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    limit,
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const AUTH_LIMIT   = { limit: 5,  windowMs: 15 * 60 * 1000 }; // 5 per 15 min
const GENERAL_LIMIT = { limit: 60, windowMs: 60 * 1000 };       // 60 per min

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

function tooManyRequests(resetAt: number, message: string): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: message, retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

function addRateLimitHeaders(res: NextResponse, result: ReturnType<typeof rateLimit>): NextResponse {
  res.headers.set("X-RateLimit-Limit",     String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset",     String(Math.ceil(result.resetAt / 1000)));
  return res;
}

// ─── Proxy ───────────────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getIP(req);
  const isAuth = pathname.startsWith("/api/auth/") || pathname === "/api/auth";

  if (isAuth) {
    const result = rateLimit(`auth:${ip}`, AUTH_LIMIT.limit, AUTH_LIMIT.windowMs);
    if (!result.success) {
      return tooManyRequests(result.resetAt, "Too many login attempts. Please wait 15 minutes before trying again.");
    }
    return addRateLimitHeaders(NextResponse.next(), result);
  }

  const result = rateLimit(`api:${ip}`, GENERAL_LIMIT.limit, GENERAL_LIMIT.windowMs);
  if (!result.success) {
    return tooManyRequests(result.resetAt, "Too many requests. Please slow down and try again shortly.");
  }
  return addRateLimitHeaders(NextResponse.next(), result);
}

export const config = {
  matcher: ["/api/:path*"],
};
