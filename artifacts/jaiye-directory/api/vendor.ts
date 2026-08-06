import { getAuthUserId, supabase, json, sanitizeText, safeVendorUrl } from './_utils'

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') { json(res, 200, {}); return }

  const userId = await getAuthUserId(req)
  if (!userId) { json(res, 401, { error: 'Unauthorized' }); return }

  if (req.method === 'PATCH') {
    const body = req.body ?? {}
    const { vendor_id } = body
    if (!vendor_id || typeof vendor_id !== 'string') {
      json(res, 400, { error: 'Invalid vendor_id' }); return
    }

    const { data: vendor } = await supabase.from('vendors')
      .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
    if (!vendor || vendor.clerk_claimed_by !== userId) {
      json(res, 403, { error: 'Not authorized' }); return
    }

    const sanitized: Record<string, unknown> = {}
    if (body.bio       !== undefined) sanitized.bio       = sanitizeText(body.bio ?? '', 500)
    if (body.services  !== undefined) sanitized.services  = sanitizeText(body.services ?? '', 500)
    if (body.phone     !== undefined) sanitized.phone     = sanitizeText(body.phone ?? '', 30)
    if (body.instagram !== undefined) sanitized.instagram = sanitizeText(body.instagram ?? '', 50)
    if (body.price_from!== undefined) sanitized.price_from= sanitizeText(body.price_from ?? '', 20)
    if (body.website   !== undefined) sanitized.website   = safeVendorUrl(body.website)

    const { error } = await supabase.from('vendors').update(sanitized).eq('id', vendor_id)
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST') {
    const { action, ...body } = req.body ?? {}

    if (action === 'claim') {
      const { vendor_id, message } = body
      if (!vendor_id || typeof vendor_id !== 'string') {
        json(res, 400, { error: 'Invalid vendor_id' }); return
      }
      const { error } = await supabase.from('vendor_claims')
        .insert({ vendor_id, clerk_user_id: userId, message: sanitizeText(message ?? '', 500) })
      if (error) {
        if (error.code === '23505') { json(res, 409, { error: 'duplicate' }); return }
        json(res, 400, { error: error.message }); return
      }
      await supabase.from('vendors').update({ claim_status: 'pending' }).eq('id', vendor_id)
      json(res, 200, { ok: true }); return
    }

    if (action === 'photo') {
      const { vendor_id, url } = body
      if (!vendor_id || !url) { json(res, 400, { error: 'Invalid params' }); return }
      const { data: v } = await supabase.from('vendors')
        .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
      if (!v || v.clerk_claimed_by !== userId) { json(res, 403, { error: 'Not authorized' }); return }
      const { data, error } = await supabase.from('vendor_photos')
        .insert({ vendor_id, clerk_user_id: userId, url }).select().maybeSingle()
      if (error) { json(res, 400, { error: error.message }); return }
      json(res, 200, { data }); return
    }

    if (action === 'respond') {
      const { review_id, vendor_id, response } = body
      if (!vendor_id || !review_id) { json(res, 400, { error: 'Invalid params' }); return }
      const { data: v } = await supabase.from('vendors')
        .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
      if (!v || v.clerk_claimed_by !== userId) { json(res, 403, { error: 'Not authorized' }); return }
      const { data, error } = await supabase.from('review_responses')
        .insert({ review_id, vendor_id, clerk_user_id: userId, response: sanitizeText(response ?? '', 1000) })
        .select().maybeSingle()
      if (error) { json(res, 400, { error: error.message }); return }
      json(res, 200, { data }); return
    }

    if (action === 'delete_photo') {
      const { photo_id, vendor_id } = body
      if (!vendor_id || !photo_id) { json(res, 400, { error: 'Invalid params' }); return }
      const { data: v } = await supabase.from('vendors')
        .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
      if (!v || v.clerk_claimed_by !== userId) { json(res, 403, { error: 'Not authorized' }); return }
      await supabase.from('vendor_photos').delete().eq('id', photo_id)
      json(res, 200, { ok: true }); return
    }

    if (action === 'delete_response') {
      const { response_id, vendor_id } = body
      if (!vendor_id || !response_id) { json(res, 400, { error: 'Invalid params' }); return }
      const { data: v } = await supabase.from('vendors')
        .select('clerk_claimed_by').eq('id', vendor_id).maybeSingle()
      if (!v || v.clerk_claimed_by !== userId) { json(res, 403, { error: 'Not authorized' }); return }
      await supabase.from('review_responses').delete().eq('id', response_id)
      json(res, 200, { ok: true }); return
    }

    json(res, 400, { error: 'Unknown action' })
    return
  }

  json(res, 405, { error: 'Method not allowed' })
}
