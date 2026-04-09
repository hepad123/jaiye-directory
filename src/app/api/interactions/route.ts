import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/interactions — mark vendor as used or recommended
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vendor_id, type } = await req.json()

  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }
  if (type !== 'used' && type !== 'recommend') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  if (type === 'used') {
    const { error } = await supabaseAdmin.from('vendor_used')
      .insert({ vendor_id, clerk_user_id: userId })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else if (type === 'recommend') {
    const { error } = await supabaseAdmin.from('vendor_recommendations')
      .insert({ vendor_id, clerk_user_id: userId })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/interactions — unmark vendor as used or recommended
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vendor_id, type } = await req.json()

  if (!vendor_id || typeof vendor_id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor_id' }, { status: 400 })
  }
  if (type !== 'used' && type !== 'recommend') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const table = type === 'used' ? 'vendor_used' : 'vendor_recommendations'

  const { error } = await supabaseAdmin.from(table)
    .delete()
    .eq('vendor_id', vendor_id)
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
