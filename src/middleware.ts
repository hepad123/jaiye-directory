// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// ─── Rate limit configs ───────────────────────────────────────────────────────

const AUTH_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
};

const API_LIMIT = {
  limit: 60,
  windowMs: 60 * 1000, // 60 requests per minute
};

// ─── Helper: get a stable client identifier ──────────────────────────────────

function getIdentifier(req: NextRequest, prefix: string): string {
  // Use X-Forwarded-For (set by Vercel), fall back to a header hash
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}

// ─── Helper: build a rate-limit-exceeded response ────────────────────────────

function rateLimitedResponse(resetAt: number, message: string): NextResponse {
  const resetSecs = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    {
      error: message,
      retryAfter: resetSecs,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetSecs),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── Auth routes: strict limit ─────────────────────────────────────────────
  const isAuthRoute =
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/auth";

  if (isAuthRoute) {
    const id = getIdentifier(req, "auth");
    const result = rateLimit(id, AUTH_LIMIT);

    if (!result.success) {
      return rateLimitedResponse(
        result.resetAt,
        "Too many login attempts. Please wait 15 minutes before trying again."
      );
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(result.limit));
    res.headers.set("X-RateLimit-Remaining", String(result.remaining));
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
    return res;
  }

  // ── All other API routes: general limit ───────────────────────────────────
  const id = getIdentifier(req, "api");
  const result = rateLimit(id, API_LIMIT);

  if (!result.success) {
    return rateLimitedResponse(
      result.resetAt,
      "Too many requests. Please slow down and try again shortly."
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return res;
}

// ─── Route matcher ────────────────────────────────────────────────────────────

export const config = {
  matcher: ["/api/:path*"],
};
