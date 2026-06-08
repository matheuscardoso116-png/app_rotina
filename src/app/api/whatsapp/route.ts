import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseMensagem } from '@/lib/claude'
import { sendWhatsApp } from '@/lib/whatsapp'

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

    // Ignora mensagens sem conteúdo relevante
    if (evento.tipo === 'outro' && evento.descricao.toLowerCase().includes('sem conteúdo')) {
      return NextResponse.json({ ok: true })
    }

    // Registra na timeline
    await supabase.from('timeline').insert({
      user_id: userId,
      mensagem_original: mensagem,
      tipo: evento.tipo,
      descricao: evento.descricao,
      hora_evento: evento.hora_evento ?? null,
      valor: evento.valor ?? null,
    })

    const meuNumero = process.env.WHATSAPP_NUMBER!
    let confirmacao = ''

    // Salva no módulo correto conforme o tipo
    if (evento.tipo === 'tarefa') {
      await supabase.from('obrigacoes').insert({
        user_id: userId,
        titulo: evento.descricao,
        prioridade: 'media',
        tipo: 'pessoal',
        status: 'pendente',
      })
      confirmacao = `✅ *Tarefa adicionada!*\n"${evento.descricao}"\n\nVocê pode ver em Tarefas no app.`
    }

    if (evento.tipo === 'gasto' && evento.valor) {
      await supabase.from('gastos').insert({
        user_id: userId,
        descricao: evento.descricao,
        valor: evento.valor,
        categoria: 'outros',
        tipo: 'pessoal',
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `💸 *Gasto registrado!*\n"${evento.descricao}"\nValor: R$ ${Number(evento.valor).toFixed(2)}`
    }

    if (evento.tipo === 'treino') {
      await supabase.from('treinos').insert({
        user_id: userId,
        tipo: evento.descricao,
        duracao_min: null,
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `💪 *Treino registrado!*\n"${evento.descricao}"`
    }

    if (evento.tipo === 'salario' && evento.valor) {
      await supabase.from('salarios').insert({
        user_id: userId,
        descricao: evento.descricao,
        valor: evento.valor,
        tipo: 'salario',
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `💰 *Entrada registrada!*\n"${evento.descricao}"\nValor: R$ ${Number(evento.valor).toFixed(2)}`
    }

    if (evento.tipo === 'atividade') {
      const hora = evento.hora_evento ? ` às ${evento.hora_evento}` : ''
      confirmacao = `📍 *Atividade registrada na timeline!*\n"${evento.descricao}"${hora}`
    }

    if (!confirmacao) {
      confirmacao = `📝 *Registrado na timeline!*\n"${evento.descricao}"`
    }

    // Envia confirmação de volta para o WhatsApp
    await sendWhatsApp(meuNumero, confirmacao)

    return NextResponse.json({ ok: true, evento })
  } catch (err) {
    console.error('Webhook WhatsApp erro:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook ativo' })
}
