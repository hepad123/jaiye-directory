import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeText, safeVendorUrl } from '@/lib/sanitize'

// PATCH /api/vendor — update vendor profile (dashboard)
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { vendor_id } = body

  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }

  // Verify ownership: only the vendor's claimer can update
  const { data: vendor } = await supabaseAdmin.from('vendors')
    .select('clerk_claimed_by')
    .eq('id', vendor_id)
    .maybeSingle()

  if (!vendor || vendor.clerk_claimed_by !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Explicitly pick and sanitize allowed fields only
  const sanitized: Record<string, unknown> = {}
  if (body.bio !== undefined) sanitized.bio = sanitizeText(body.bio ?? '', 500)
  if (body.services !== undefined) sanitized.services = sanitizeText(body.services ?? '', 500)
  if (body.phone !== undefined) sanitized.phone = sanitizeText(body.phone ?? '', 30)
  if (body.instagram !== undefined) sanitized.instagram = sanitizeText(body.instagram ?? '', 50)
  if (body.price_from !== undefined) sanitized.price_from = sanitizeText(body.price_from ?? '', 20)
  if (body.website !== undefined) sanitized.website = safeVendorUrl(body.website)

  const { error } = await supabaseAdmin.from('vendors')
    .update(sanitized)
    .eq('id', vendor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// POST /api/vendor — submit a claim or upload a photo or respond to review
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, ...body } = await req.json()

  if (action === 'claim') {
    const { vendor_id, message } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
    }
    const cleanMessage = sanitizeText(message ?? '', 500)
    const { error } = await supabaseAdmin.from('vendor_claims')
      .insert({ vendor_id, clerk_user_id: userId, message: cleanMessage })
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'duplicate' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    await supabaseAdmin.from('vendors').update({ claim_status: 'pending' }).eq('id', vendor_id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'photo') {
    const { vendor_id, url } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
    }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    }
    // Verify ownership
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const { data, error } = await supabaseAdmin.from('vendor_photos')
      .insert({ vendor_id, clerk_user_id: userId, url })
      .select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  if (action === 'respond') {
    const { review_id, vendor_id, response } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
    }
    if (!review_id || typeof review_id !== 'string') {
      return NextResponse.json({ error: 'Invalid review_id' }, { status: 400 })
    }
    const cleanResponse = sanitizeText(response ?? '', 1000)
    // Verify ownership
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const { data, error } = await supabaseAdmin.from('review_responses')
      .insert({ review_id, vendor_id, clerk_user_id: userId, response: cleanResponse })
      .select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  if (action === 'delete_photo') {
    const { photo_id, vendor_id } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
    }
    if (!photo_id || typeof photo_id !== 'string') {
      return NextResponse.json({ error: 'Invalid photo_id' }, { status: 400 })
    }
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    await supabaseAdmin.from('vendor_photos').delete().eq('id', photo_id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_response') {
    const { response_id, vendor_id } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
    }
    if (!response_id || typeof response_id !== 'string') {
      return NextResponse.json({ error: 'Invalid response_id' }, { status: 400 })
    }
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    await supabaseAdmin.from('review_responses').delete().eq('id', response_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
