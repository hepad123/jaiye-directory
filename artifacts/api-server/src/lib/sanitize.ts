// Server-side input sanitization
export const LIMITS = {
  email: 254,
  password: 128,
  displayName: 60,
  username: 30,
  bio: 200,
  reviewComment: 1000,
  note: 2000,
  search: 100,
  generic: 500,
} as const

function stripControlChars(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

export function sanitizeText(value: string, maxLength: number): string {
  return stripControlChars(value.trim()).slice(0, maxLength)
}

export function sanitizeDisplayName(raw: string): string {
  return sanitizeText(raw, LIMITS.displayName)
}

export function sanitizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, LIMITS.username)
}

export function sanitizeReviewComment(raw: string): string {
  return sanitizeText(raw, LIMITS.reviewComment)
}

export function sanitizeNote(raw: string): string {
  return sanitizeText(raw, LIMITS.note)
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(username)
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
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
