import { createClerkClient } from '@clerk/backend'
import { getAuthUserId, supabase, json, sanitizeDisplayName, sanitizeUsername, isValidUsername, sanitizeText } from './_utils'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') { json(res, 200, {}); return }

  const userId = await getAuthUserId(req)
  if (!userId) { json(res, 401, { error: 'Unauthorized' }); return }

  if (req.method === 'POST') {
    const { display_name, business_name, username, profile_type } = req.body ?? {}

    const cleanDisplayName = sanitizeDisplayName(display_name ?? '')
    const cleanUsername = sanitizeUsername(username ?? '')
    const cleanBusinessName = business_name ? sanitizeText(business_name, 60) : null

    if (!isValidUsername(cleanUsername)) {
      json(res, 400, { error: 'Invalid username' }); return
    }
    if (!cleanDisplayName) {
      json(res, 400, { error: 'Display name is required' }); return
    }
    if (profile_type !== 'customer' && profile_type !== 'vendor') {
      json(res, 400, { error: 'Invalid profile_type' }); return
    }

    let avatarUrl: string | null = null
    try {
      const clerkUser = await clerk.users.getUser(userId)
      avatarUrl = clerkUser.imageUrl || null
    } catch { /* ignore */ }

    const { data, error } = await supabase.from('profiles').upsert({
      clerk_user_id: userId,
      display_name: cleanDisplayName,
      business_name: cleanBusinessName,
      username: cleanUsername,
      profile_type,
      avatar_url: avatarUrl,
    }).select().maybeSingle()

    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { data })
    return
  }

  if (req.method === 'PATCH') {
    const body = req.body ?? {}
    const updates: Record<string, unknown> = {}

    if (body.display_name !== undefined) {
      const clean = sanitizeDisplayName(body.display_name)
      if (!clean) { json(res, 400, { error: 'Display name cannot be empty' }); return }
      updates.display_name = clean
    }
    if (body.username !== undefined) {
      const clean = sanitizeUsername(body.username)
      if (!isValidUsername(clean)) {
        json(res, 400, { error: 'Invalid username' }); return
      }
      updates.username = clean
    }
    if (body.bio !== undefined) updates.bio = sanitizeText(body.bio ?? '', 200)
    if (body.business_name !== undefined) updates.business_name = sanitizeText(body.business_name ?? '', 60)

    try {
      const clerkUser = await clerk.users.getUser(userId)
      if (clerkUser?.imageUrl) updates.avatar_url = clerkUser.imageUrl
    } catch { /* ignore */ }

    const { data, error } = await supabase.from('profiles')
      .update(updates)
      .eq('clerk_user_id', userId)
      .select()
      .maybeSingle()

    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { data })
    return
  }

  json(res, 405, { error: 'Method not allowed' })
}
