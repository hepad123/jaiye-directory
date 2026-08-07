/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const env = {
    clerk: !!process.env.CLERK_SECRET_KEY,
    supabase_url: !!process.env.SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SECRET_KEY,
  }
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).end(JSON.stringify({ status: 'ok', ts: Date.now(), env }))
}
