import { getAuthUserId, supabase, json } from './_utils'

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') { json(res, 200, {}); return }

  const userId = await getAuthUserId(req)
  if (!userId) { json(res, 401, { error: 'Unauthorized' }); return }

  const { service_id, type } = req.body ?? {}
  if (!service_id || typeof service_id !== 'string') {
    json(res, 400, { error: 'Invalid service_id' }); return
  }
  if (type !== 'used' && type !== 'recommend') {
    json(res, 400, { error: 'Invalid type' }); return
  }

  const table = type === 'used' ? 'service_used' : 'service_recommendations'

  if (req.method === 'POST') {
    const { error } = await supabase.from(table)
      .insert({ service_id, clerk_user_id: userId })
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from(table)
      .delete()
      .eq('service_id', service_id)
      .eq('clerk_user_id', userId)
    if (error) { json(res, 400, { error: error.message }); return }
    json(res, 200, { ok: true })
    return
  }

  json(res, 405, { error: 'Method not allowed' })
}
