import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const hoje = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('timeline')
    .select('*')
    .eq('user_id', user.id)
    .eq('data', hoje)
    .order('hora', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const hoje = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('timeline')
    .insert({ ...body, user_id: user.id, data: hoje })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await req.json()
  await supabase.from('timeline').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
