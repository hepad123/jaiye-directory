import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeDisplayName, sanitizeUsername, isValidUsername, sanitizeText, LIMITS } from '@/lib/sanitize'

// POST /api/profile — upsert profile (onboarding)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const { display_name, business_name, username, profile_type } = await req.json()

  const cleanDisplayName = sanitizeDisplayName(display_name ?? '')
  const cleanUsername = sanitizeUsername(username ?? '')
  const cleanBusinessName = business_name ? sanitizeText(business_name, LIMITS.displayName) : null

  if (!isValidUsername(cleanUsername)) {
    return NextResponse.json({ error: 'Invalid username (3-30 lowercase alphanumeric/underscore characters)' }, { status: 400 })
  }
  if (!cleanDisplayName) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
  }
  if (profile_type !== 'customer' && profile_type !== 'vendor') {
    return NextResponse.json({ error: 'Invalid profile_type' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('profiles').upsert({
    clerk_user_id: userId,
    display_name: cleanDisplayName,
    business_name: cleanBusinessName,
    username: cleanUsername,
    profile_type,
    avatar_url: clerkUser?.imageUrl || null,
  }).select().maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// PATCH /api/profile — update profile (edit profile page)
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clerkUser = await currentUser()
    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (body.display_name !== undefined) {
      const clean = sanitizeDisplayName(body.display_name)
      if (!clean) return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 })
      updates.display_name = clean
    }
    if (body.username !== undefined) {
      const clean = sanitizeUsername(body.username)
      if (!isValidUsername(clean)) {
        return NextResponse.json({ error: 'Invalid username (3-30 lowercase alphanumeric/underscore characters)' }, { status: 400 })
      }
      updates.username = clean
    }
    if (body.bio !== undefined) updates.bio = sanitizeText(body.bio ?? '', LIMITS.bio)
    if (body.business_name !== undefined) updates.business_name = sanitizeText(body.business_name ?? '', LIMITS.displayName)
    // Keep avatar_url in sync with Clerk
    if (clerkUser?.imageUrl) updates.avatar_url = clerkUser.imageUrl

    const { data, error } = await supabaseAdmin.from('profiles')
      .update(updates)
      .eq('clerk_user_id', userId)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('PATCH /api/profile error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
