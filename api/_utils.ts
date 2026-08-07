/// <reference types="node" />
import { verifyToken } from '@clerk/backend'
import { createClient } from '@supabase/supabase-js'

const secretKey = process.env.CLERK_SECRET_KEY!

// Use fallback placeholder so module doesn't crash at load time if env vars
// are missing — actual DB calls will fail gracefully instead of with
// FUNCTION_INVOCATION_FAILED at the module level.
export const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY ?? 'placeholder-key',
)

export async function getAuthUserId(req: any): Promise<string | null> {
  const authHeader = (req.headers?.authorization as string) ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  try {
    const payload = await verifyToken(token, { secretKey })
    return payload.sub
  } catch {
    return null
  }
}

export function json(res: any, status: number, body: unknown) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.status(status).end(JSON.stringify(body))
}

// Simple sanitizers (mirrors api-server/src/lib/sanitize.ts)
function stripCtrl(s: string) { return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') }
export function sanitizeText(v: string, max: number) { return stripCtrl(v.trim()).slice(0, max) }
export function sanitizeDisplayName(v: string) { return sanitizeText(v, 60) }
export function sanitizeUsername(v: string) { return v.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) }
export function isValidUsername(u: string) { return /^[a-z0-9_]{3,30}$/.test(u) }
export function sanitizeNote(v: string) { return sanitizeText(v, 2000) }
export function safeVendorUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}
