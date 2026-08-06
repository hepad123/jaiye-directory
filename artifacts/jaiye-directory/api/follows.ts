import { getAuthUserId, supabase, json } from './_utils'

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') { json(res, 200, {}); return }

  const userId = await getAuthUserId(req)
  if (!userId) { json(res, 401, { error: 'Unauthorized' }); return }

  const { target_id } = req.body ?? {}
  if (!target_id || typeof target_id !== 'string') {
    json(res, 400, { error: 'Invalid target_id' }); return
  }

  if (req.method === 'POST') {
    const { error } = await supabase.from('follows')
      .insert({ clerk_follower_id: userId, clerk_following_id: target_id })
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('follows')
      .delete()
      .eq('clerk_follower_id', userId)
      .eq('clerk_following_id', target_id)
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  json(res, 405, { error: 'Method not allowed' })
}
