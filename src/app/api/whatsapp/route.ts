import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { parseMensagem, responderIA } from '@/lib/claude'

// Payload que a Z-API envia no webhook quando recebe mensagem
interface ZAPIWebhookPayload {
  phone: string
  body?: string
  text?: { message?: string }
  type?: string
  instanceId?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload: ZAPIWebhookPayload = await req.json()

    // Extrai o texto da mensagem (Z-API manda em diferentes campos)
    const mensagem = payload.body ?? payload.text?.message ?? ''
    if (!mensagem || mensagem.trim().length === 0) {
      return NextResponse.json({ ok: true })
    }

    // Ignora mensagens do próprio bot (enviadas pelo app)
    if (payload.type === 'SendMessage') {
      return NextResponse.json({ ok: true })
    }

    // Número do dono do app — só processa mensagens DELE
    const meuNumero = process.env.WHATSAPP_NUMBER ?? ''
    const remetente = (payload.phone ?? '').replace(/\D/g, '')
    if (meuNumero && !remetente.includes(meuNumero.replace(/\D/g, ''))) {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Se não tem sessão, busca o primeiro usuário do app (dono)
      const { data: users } = await supabase.auth.admin.listUsers()
      const owner = users?.users?.[0]
      if (!owner) return NextResponse.json({ ok: true })
    }

    const { data: { user: owner } } = await supabase.auth.getUser()
    const userId = owner?.id
    if (!userId) return NextResponse.json({ ok: true })

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

// Endpoint de verificação do webhook Z-API
export async function GET() {
  return NextResponse.json({ status: 'webhook ativo' })
}
