import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  // Just redirect home — Supabase handles the session via the URL hash on the client side
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
