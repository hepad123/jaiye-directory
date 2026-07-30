import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'
import { createClerkClient } from '@clerk/backend'
import {
  sanitizeDisplayName, sanitizeUsername, isValidUsername,
  sanitizeText, LIMITS,
} from '../lib/sanitize'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
const router = Router()

// POST /api/profile — upsert profile (onboarding)
router.post('/profile', requireAuth, async (req, res) => {
  const { userId } = req
  const { display_name, business_name, username, profile_type } = req.body

  const cleanDisplayName = sanitizeDisplayName(display_name ?? '')
  const cleanUsername = sanitizeUsername(username ?? '')
  const cleanBusinessName = business_name ? sanitizeText(business_name, LIMITS.displayName) : null

  if (!isValidUsername(cleanUsername)) {
    res.status(400).json({ error: 'Invalid username (3-30 lowercase alphanumeric/underscore characters)' }); return
  }
  if (!cleanDisplayName) {
    res.status(400).json({ error: 'Display name is required' }); return
  }
  if (profile_type !== 'customer' && profile_type !== 'vendor') {
    res.status(400).json({ error: 'Invalid profile_type' }); return
  }

  let avatarUrl: string | null = null
  try {
    const clerkUser = await clerk.users.getUser(userId!)
    avatarUrl = clerkUser.imageUrl || null
  } catch { /* ignore */ }

  const { data, error } = await supabaseAdmin.from('profiles').upsert({
    clerk_user_id: userId,
    display_name: cleanDisplayName,
    business_name: cleanBusinessName,
    username: cleanUsername,
    profile_type,
    avatar_url: avatarUrl,
  }).select().maybeSingle()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ data })
})

// PATCH /api/profile — update profile
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { userId } = req
    const body = req.body
    const updates: Record<string, unknown> = {}

    if (body.display_name !== undefined) {
      const clean = sanitizeDisplayName(body.display_name)
      if (!clean) { res.status(400).json({ error: 'Display name cannot be empty' }); return }
      updates.display_name = clean
    }
    if (body.username !== undefined) {
      const clean = sanitizeUsername(body.username)
      if (!isValidUsername(clean)) {
        res.status(400).json({ error: 'Invalid username (3-30 lowercase alphanumeric/underscore characters)' }); return
      }
      updates.username = clean
    }
    if (body.bio !== undefined) updates.bio = sanitizeText(body.bio ?? '', LIMITS.bio)
    if (body.business_name !== undefined) updates.business_name = sanitizeText(body.business_name ?? '', LIMITS.displayName)

    try {
      const clerkUser = await clerk.users.getUser(userId!)
      if (clerkUser?.imageUrl) updates.avatar_url = clerkUser.imageUrl
    } catch { /* ignore */ }

    const { data, error } = await supabaseAdmin.from('profiles')
      .update(updates)
      .eq('clerk_user_id', userId!)
      .select()
      .maybeSingle()

    if (error) { res.status(400).json({ error: error.message }); return }
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
