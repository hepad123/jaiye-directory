import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// POST /api/interactions — mark vendor as used or recommended
router.post('/interactions', requireAuth, async (req, res) => {
  const { userId } = req
  const { vendor_id, type } = req.body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }
  if (type !== 'used' && type !== 'recommend') {
    res.status(400).json({ error: 'Invalid type' }); return
  }

  if (type === 'used') {
    const { error } = await supabaseAdmin.from('vendor_used')
      .insert({ vendor_id, clerk_user_id: userId })
    if (error) { res.status(400).json({ error: error.message }); return }
  } else {
    const { error } = await supabaseAdmin.from('vendor_recommendations')
      .insert({ vendor_id, clerk_user_id: userId })
    if (error) { res.status(400).json({ error: error.message }); return }
  }

  res.json({ ok: true })
})

// DELETE /api/interactions — unmark vendor as used or recommended
router.delete('/interactions', requireAuth, async (req, res) => {
  const { userId } = req
  const { vendor_id, type } = req.body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }
  if (type !== 'used' && type !== 'recommend') {
    res.status(400).json({ error: 'Invalid type' }); return
  }

  const table = type === 'used' ? 'vendor_used' : 'vendor_recommendations'
  const { error } = await supabaseAdmin.from(table)
    .delete()
    .eq('vendor_id', vendor_id)
    .eq('clerk_user_id', userId!)

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
