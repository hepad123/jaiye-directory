import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'
import { sanitizeNote } from '../lib/sanitize'

const router = Router()

// POST /api/saved — save a vendor
router.post('/saved', requireAuth, async (req, res) => {
  const { userId } = req
  const { vendor_id } = req.body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }

  const { error } = await supabaseAdmin.from('saved_vendors')
    .insert({ clerk_user_id: userId, vendor_id })

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

// DELETE /api/saved — unsave a vendor
router.delete('/saved', requireAuth, async (req, res) => {
  const { userId } = req
  const { vendor_id } = req.body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }

  const { error } = await supabaseAdmin.from('saved_vendors')
    .delete()
    .eq('clerk_user_id', userId!)
    .eq('vendor_id', vendor_id)

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

// PATCH /api/saved — update notes/quoted price on a saved vendor
router.patch('/saved', requireAuth, async (req, res) => {
  const { userId } = req
  const { vendor_id, notes, quoted_price } = req.body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }

  const cleanNotes = notes !== undefined ? sanitizeNote(notes ?? '') : undefined
  if (quoted_price !== undefined && quoted_price !== null && typeof quoted_price !== 'number') {
    res.status(400).json({ error: 'quoted_price must be a number or null' }); return
  }

  const updatePayload: Record<string, unknown> = {}
  if (cleanNotes !== undefined) updatePayload.notes = cleanNotes
  if (quoted_price !== undefined) updatePayload.quoted_price = quoted_price

  const { error } = await supabaseAdmin.from('saved_vendors')
    .update(updatePayload)
    .eq('clerk_user_id', userId!)
    .eq('vendor_id', vendor_id)

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
