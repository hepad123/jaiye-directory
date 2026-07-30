import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeText, sanitizeReviewComment, isValidRating } from '@/lib/sanitize'

// POST /api/reviews — create a review
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vendor_id, reviewer_name, rating, comment } = await req.json()

  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }
  if (!isValidRating(rating)) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
  }

  const cleanName = sanitizeText(reviewer_name ?? '', 100)
  const cleanComment = sanitizeReviewComment(comment ?? '')

  const { data, error } = await supabaseAdmin.from('reviews')
    .insert({
      vendor_id,
      reviewer_name: cleanName,
      clerk_user_id: userId,
      rating,
      comment: cleanComment,
    })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
