// src/lib/sanitize.ts
// Client-side input sanitization — trim, strip control chars, enforce limits.
// This is a first line of defence. Supabase RLS is the authoritative gate.

// ─── Limits ──────────────────────────────────────────────────────────────────

export const LIMITS = {
  email:        254,   // RFC 5321
  password:     128,
  displayName:  60,
  username:     30,
  bio:          200,
  reviewComment: 1000,
  note:         2000,
  search:       100,
  generic:      500,
} as const;

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Remove ASCII control chars (except \t \n \r) and Unicode "specials" block */
function stripControlChars(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/** Trim + strip control chars + enforce max length */
export function sanitizeText(value: string, maxLength: number): string {
  return stripControlChars(value.trim()).slice(0, maxLength);
}

// ─── Typed sanitizers ────────────────────────────────────────────────────────

export function sanitizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, LIMITS.email);
}

export function sanitizePassword(raw: string): string {
  // Don't trim passwords — spaces are valid. Just enforce max length.
  return raw.slice(0, LIMITS.password);
}

export function sanitizeDisplayName(raw: string): string {
  return sanitizeText(raw, LIMITS.displayName);
}

export function sanitizeUsername(raw: string): string {
  // Lowercase, alphanumeric + underscore only, max length
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, LIMITS.username);
}

export function sanitizeReviewComment(raw: string): string {
  return sanitizeText(raw, LIMITS.reviewComment);
}

export function sanitizeNote(raw: string): string {
  return sanitizeText(raw, LIMITS.note);
}

export function sanitizeSearch(raw: string): string {
  return sanitizeText(raw, LIMITS.search);
}

// ─── Validators ──────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  // Simple RFC-ish check — not exhaustive but catches obvious junk
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= LIMITS.password;
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

export function isValidDisplayName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= LIMITS.displayName;
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
export function safeVendorUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.href
  } catch {
    return null
  }
}
