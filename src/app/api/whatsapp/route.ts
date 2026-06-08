import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseMensagem } from '@/lib/claude'

interface ZAPIWebhookPayload {
  phone: string
  body?: string
  text?: { message?: string }
  type?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload: ZAPIWebhookPayload = await req.json()

    const mensagem = payload.body ?? payload.text?.message ?? ''
    if (!mensagem || mensagem.trim().length === 0) {
      return NextResponse.json({ ok: true })
    }

    // Webhook usa service role — sem sessão de usuário disponível
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Busca o dono do app (único usuário)
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const owner = users?.[0]
    if (!owner) return NextResponse.json({ ok: true })
    const userId = owner.id

    // Parseia a mensagem com IA
    const evento = await parseMensagem(mensagem)

    // Registra na timeline
    await supabase.from('timeline').insert({
      user_id: userId,
      mensagem_original: mensagem,
      tipo: evento.tipo,
      descricao: evento.descricao,
      hora_evento: evento.hora_evento ?? null,
      valor: evento.valor ?? null,
    })

    // Se for gasto, registra também na tabela de gastos
    if (evento.tipo === 'gasto' && evento.valor) {
      await supabase.from('gastos').insert({
        user_id: userId,
        descricao: evento.descricao,
        valor: evento.valor,
        tipo: 'pessoal',
        data: new Date().toISOString().split('T')[0],
      })
    }

    // Se for salário, registra na tabela de salários
    if (evento.tipo === 'salario' && evento.valor) {
      await supabase.from('salarios').insert({
        user_id: userId,
        descricao: evento.descricao,
        valor: evento.valor,
        tipo: 'salario',
        data: new Date().toISOString().split('T')[0],
      })
    }

    return NextResponse.json({ ok: true, evento })
  } catch (err) {
    console.error('Webhook WhatsApp erro:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook ativo' })
}
