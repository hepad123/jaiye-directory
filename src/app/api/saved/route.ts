import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeNote } from '@/lib/sanitize'

// POST /api/saved — save a vendor
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vendor_id } = await req.json()
  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('saved_vendors')
    .insert({ clerk_user_id: userId, vendor_id })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/saved — unsave a vendor
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vendor_id } = await req.json()
  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('saved_vendors')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('vendor_id', vendor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// PATCH /api/saved — update notes/quoted price on a saved vendor
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vendor_id, notes, quoted_price } = await req.json()
  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }

  const cleanNotes = notes !== undefined ? sanitizeNote(notes ?? '') : undefined
  if (quoted_price !== undefined && quoted_price !== null && typeof quoted_price !== 'number') {
    return NextResponse.json({ error: 'quoted_price must be a number or null' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {}
  if (cleanNotes !== undefined) updatePayload.notes = cleanNotes
  if (quoted_price !== undefined) updatePayload.quoted_price = quoted_price

  const { error } = await supabaseAdmin.from('saved_vendors')
    .update(updatePayload)
    .eq('clerk_user_id', userId)
    .eq('vendor_id', vendor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
