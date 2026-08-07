import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// POST /api/service-interactions — mark beauty service as used or recommended
router.post('/service-interactions', requireAuth, async (req, res) => {
  const { userId } = req
  const { service_id, type } = req.body

  if (!service_id || typeof service_id !== 'string') {
    res.status(400).json({ error: 'Invalid service_id' }); return
  }
  if (type !== 'used' && type !== 'recommend') {
    res.status(400).json({ error: 'Invalid type' }); return
  }

  const table = type === 'used' ? 'service_used' : 'service_recommendations'
  const { error } = await supabaseAdmin.from(table)
    .insert({ service_id, clerk_user_id: userId })
  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

// DELETE /api/service-interactions — unmark beauty service as used or recommended
router.delete('/service-interactions', requireAuth, async (req, res) => {
  const { userId } = req
  const { service_id, type } = req.body

  if (!service_id || typeof service_id !== 'string') {
    res.status(400).json({ error: 'Invalid service_id' }); return
  }
  if (type !== 'used' && type !== 'recommend') {
    res.status(400).json({ error: 'Invalid type' }); return
  }

  const table = type === 'used' ? 'service_used' : 'service_recommendations'
  const { error } = await supabaseAdmin.from(table)
    .delete()
    .eq('service_id', service_id)
    .eq('clerk_user_id', userId!)
  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
