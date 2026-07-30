import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_id } = await req.json()
  if (!target_id || typeof target_id !== 'string') {
    return NextResponse.json({ error: 'Invalid target_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('follows')
    .insert({ clerk_follower_id: userId, clerk_following_id: target_id })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_id } = await req.json()
  if (!target_id || typeof target_id !== 'string') {
    return NextResponse.json({ error: 'Invalid target_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('follows')
    .delete()
    .eq('clerk_follower_id', userId)
    .eq('clerk_following_id', target_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
