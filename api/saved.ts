import { getAuthUserId, supabase, json, sanitizeNote } from './_utils'

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') { json(res, 200, {}); return }

  const userId = await getAuthUserId(req)
  if (!userId) { json(res, 401, { error: 'Unauthorized' }); return }

  const body = req.body ?? {}
  const { vendor_id } = body

  if (!vendor_id || typeof vendor_id !== 'string') {
    json(res, 400, { error: 'Invalid vendor_id' }); return
  }

  if (req.method === 'POST') {
    const { error } = await supabase.from('saved_vendors')
      .insert({ clerk_user_id: userId, vendor_id })
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('saved_vendors')
      .delete()
      .eq('clerk_user_id', userId)
      .eq('vendor_id', vendor_id)
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'PATCH') {
    const { notes, quoted_price } = body
    if (quoted_price !== undefined && quoted_price !== null && typeof quoted_price !== 'number') {
      json(res, 400, { error: 'quoted_price must be a number or null' }); return
    }
    const patch: Record<string, unknown> = {}
    if (notes !== undefined) patch.notes = sanitizeNote(notes ?? '')
    if (quoted_price !== undefined) patch.quoted_price = quoted_price
    const { error } = await supabase.from('saved_vendors')
      .update(patch)
      .eq('clerk_user_id', userId)
      .eq('vendor_id', vendor_id)
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  json(res, 405, { error: 'Method not allowed' })
}
