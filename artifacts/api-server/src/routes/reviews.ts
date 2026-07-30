import { Router } from 'express'
import { requireAuth } from '../lib/clerkAuth'
import { supabaseAdmin } from '../lib/supabase'
import { sanitizeText, sanitizeReviewComment, isValidRating } from '../lib/sanitize'

const router = Router()

// POST /api/reviews — create a review
router.post('/reviews', requireAuth, async (req, res) => {
  const { userId } = req
  const { vendor_id, reviewer_name, rating, comment } = req.body

  if (!vendor_id || typeof vendor_id !== 'string') {
    res.status(400).json({ error: 'Invalid vendor_id' }); return
  }
  if (!isValidRating(rating)) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5' }); return
  }

  const cleanName = sanitizeText(reviewer_name ?? '', 100)
  const cleanComment = sanitizeReviewComment(comment ?? '')

  const { data, error } = await supabaseAdmin.from('reviews').insert({
    vendor_id,
    reviewer_name: cleanName,
    clerk_user_id: userId,
    rating,
    comment: cleanComment,
  }).select()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ data })
})

export default router
