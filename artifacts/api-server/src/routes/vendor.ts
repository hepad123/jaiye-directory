import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'
import { sanitizeText, safeVendorUrl } from '../lib/sanitize'

const router = Router()

// PATCH /api/vendor — update vendor profile (dashboard)
router.patch('/vendor', requireAuth, async (req, res) => {
  const { userId } = req
  const body = req.body
  const { vendor_id } = body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }

  // Verify ownership
  const { data: vendor } = await supabaseAdmin.from('vendors')
    .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()

  if (!vendor || vendor.clerk_claimed_by !== userId) {
    res.status(403).json({ error: 'Not authorized' }); return
  }

  const sanitized: Record<string, unknown> = {}
  if (body.bio !== undefined) sanitized.bio = sanitizeText(body.bio ?? '', 500)
  if (body.services !== undefined) sanitized.services = sanitizeText(body.services ?? '', 500)
  if (body.phone !== undefined) sanitized.phone = sanitizeText(body.phone ?? '', 30)
  if (body.instagram !== undefined) sanitized.instagram = sanitizeText(body.instagram ?? '', 50)
  if (body.price_from !== undefined) sanitized.price_from = sanitizeText(body.price_from ?? '', 20)
  if (body.website !== undefined) sanitized.website = safeVendorUrl(body.website)

  const { error } = await supabaseAdmin.from('vendors')
    .update(sanitized).eq('id', vendor_id)

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

// POST /api/vendor — claim, photo, respond, delete actions
router.post('/vendor', requireAuth, async (req, res) => {
  const { userId } = req
  const { action, ...body } = req.body

  if (action === 'claim') {
    const { vendor_id, message } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      res.status(400).json({ error: 'Invalid vendor_id' }); return
    }
    const cleanMessage = sanitizeText(message ?? '', 500)
    const { error } = await supabaseAdmin.from('vendor_claims')
      .insert({ vendor_id, clerk_user_id: userId, message: cleanMessage })
    if (error) {
      if (error.code === '23505') { res.status(409).json({ error: 'duplicate' }); return }
      res.status(400).json({ error: error.message }); return
    }
    await supabaseAdmin.from('vendors').update({ claim_status: 'pending' }).eq('id', vendor_id)
    res.json({ ok: true }); return
  }

  if (action === 'photo') {
    const { vendor_id, url } = body
    if (!vendor_id || typeof vendor_id !== 'string' || !url || typeof url !== 'string') {
      res.status(400).json({ error: 'Invalid params' }); return
    }
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      res.status(403).json({ error: 'Not authorized' }); return
    }
    const { data, error } = await supabaseAdmin.from('vendor_photos')
      .insert({ vendor_id, clerk_user_id: userId, url }).select().maybeSingle()
    if (error) { res.status(400).json({ error: error.message }); return }
    res.json({ data }); return
  }

  if (action === 'respond') {
    const { review_id, vendor_id, response } = body
    if (!vendor_id || !review_id) { res.status(400).json({ error: 'Invalid params' }); return }
    const cleanResponse = sanitizeText(response ?? '', 1000)
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      res.status(403).json({ error: 'Not authorized' }); return
    }
    const { data, error } = await supabaseAdmin.from('review_responses')
      .insert({ review_id, vendor_id, clerk_user_id: userId, response: cleanResponse })
      .select().maybeSingle()
    if (error) { res.status(400).json({ error: error.message }); return }
    res.json({ data }); return
  }

  if (action === 'delete_photo') {
    const { photo_id, vendor_id } = body
    if (!vendor_id || !photo_id) { res.status(400).json({ error: 'Invalid params' }); return }
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      res.status(403).json({ error: 'Not authorized' }); return
    }
    await supabaseAdmin.from('vendor_photos').delete().eq('id', photo_id)
    res.json({ ok: true }); return
  }

  if (action === 'delete_response') {
    const { response_id, vendor_id } = body
    if (!vendor_id || !response_id) { res.status(400).json({ error: 'Invalid params' }); return }
    const { data: v } = await supabaseAdmin.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!v || v.clerk_claimed_by !== userId) {
      res.status(403).json({ error: 'Not authorized' }); return
    }
    await supabaseAdmin.from('review_responses').delete().eq('id', response_id)
    res.json({ ok: true }); return
  }

  res.status(400).json({ error: 'Unknown action' })
})

export default router
