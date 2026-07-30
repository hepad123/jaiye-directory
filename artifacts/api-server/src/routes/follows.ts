import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// POST /api/follows — follow a user
router.post('/follows', requireAuth, async (req, res) => {
  const { userId } = req
  const { target_id } = req.body

  if (!target_id || typeof target_id !== 'string') {
    res.status(400).json({ error: 'Invalid target_id' })
    return
  }

  const { error } = await supabaseAdmin.from('follows')
    .insert({ clerk_follower_id: userId, clerk_following_id: target_id })

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

// DELETE /api/follows — unfollow a user
router.delete('/follows', requireAuth, async (req, res) => {
  const { userId } = req
  const { target_id } = req.body

  if (!target_id || typeof target_id !== 'string') {
    res.status(400).json({ error: 'Invalid target_id' })
    return
  }

  const { error } = await supabaseAdmin.from('follows')
    .delete()
    .eq('clerk_follower_id', userId!)
    .eq('clerk_following_id', target_id)

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
