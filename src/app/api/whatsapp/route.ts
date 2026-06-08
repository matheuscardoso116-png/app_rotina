import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseMensagem } from '@/lib/claude'
import { sendWhatsApp } from '@/lib/whatsapp'

interface ZAPIPayload {
  phone?: string
  fromMe?: boolean
  body?: string
  text?: { message?: string }
  type?: string
  isStatusReply?: boolean
  isGroup?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const payload: ZAPIPayload = await req.json()

    console.log('[webhook] payload recebido:', JSON.stringify(payload).slice(0, 400))

    // Ignora grupos, status replies e mensagens recebidas de outros
    if (payload.isGroup || payload.isStatusReply) {
      return NextResponse.json({ ok: true, skip: 'group_or_status' })
    }

    // Só processa mensagens ENVIADAS pelo dono (fromMe) ou que venham do próprio número
    const meuNumero = process.env.WHATSAPP_NUMBER ?? ''
    const remetente = payload.phone ?? ''
    const ehMeuNumero = remetente.replace(/\D/g, '').includes(meuNumero.replace(/\D/g, ''))
    if (payload.fromMe === false && !ehMeuNumero) {
      return NextResponse.json({ ok: true, skip: 'not_from_me' })
    }

    const mensagem = payload.body ?? payload.text?.message ?? ''
    if (!mensagem || mensagem.trim().length < 3) {
      return NextResponse.json({ ok: true, skip: 'empty' })
    }

    console.log('[webhook] mensagem:', mensagem)

    // Service role — sem sessão de usuário
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Busca o dono do app
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const owner = usersData?.users?.[0]
    if (!owner) {
      console.error('[webhook] nenhum usuário encontrado')
      return NextResponse.json({ ok: true })
    }
    const userId = owner.id

    // Parseia com IA
    const evento = await parseMensagem(mensagem)
    console.log('[webhook] evento parseado:', evento)

    let confirmacao = ''

    if (evento.tipo === 'gasto' && evento.valor) {
      const cat = detectarCategoria(evento.descricao)
      await supabase.from('gastos').insert({
        user_id: userId,
        descricao: evento.descricao,
        valor: evento.valor,
        categoria: cat,
        tipo: 'pessoal',
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `💸 *Gasto registrado!*\n"${evento.descricao}"\nValor: R$ ${Number(evento.valor).toFixed(2)}\nCategoria: ${cat}`
    }

    else if (evento.tipo === 'treino') {
      await supabase.from('treinos').insert({
        user_id: userId,
        tipo: evento.descricao,
        grupos_musculares: '',
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `💪 *Treino registrado!*\n"${evento.descricao}"`
    }

    else if (evento.tipo === 'tarefa') {
      await supabase.from('obrigacoes').insert({
        user_id: userId,
        titulo: evento.descricao,
        prioridade: 'media',
        categoria: 'Pessoal',
        status: 'pendente',
      })
      confirmacao = `✅ *Tarefa adicionada!*\n"${evento.descricao}"\n\nVer em → Tarefas no app.`
    }

    else if (evento.tipo === 'salario' && evento.valor) {
      await supabase.from('salarios').insert({
        user_id: userId,
        descricao: evento.descricao,
        valor: evento.valor,
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `💰 *Entrada registrada!*\n"${evento.descricao}"\nValor: R$ ${Number(evento.valor).toFixed(2)}`
    }

    else if (evento.tipo === 'atividade') {
      await supabase.from('timeline').insert({
        user_id: userId,
        titulo: evento.descricao,
        tipo: 'outro',
        hora: evento.hora_evento ?? new Date().toTimeString().slice(0, 5),
        data: new Date().toISOString().split('T')[0],
      })
      confirmacao = `📍 *Atividade registrada!*\n"${evento.descricao}"`
    }

    else {
      // Não entendeu — pede para tentar de novo
      confirmacao = `🤔 Não entendi o que registrar com essa mensagem.\n\nExemplos:\n• "Gastei R$50 no mercado"\n• "Fiz treino de peito 1h"\n• "Ligar para cliente amanhã" (tarefa)\n• "Recebi R$3000 de cliente"`
    }

    // Envia confirmação
    if (confirmacao && meuNumero) {
      try {
        await sendWhatsApp(meuNumero, confirmacao)
        console.log('[webhook] confirmação enviada')
      } catch (errSend) {
        console.error('[webhook] erro ao enviar confirmação:', errSend)
      }
    }

    return NextResponse.json({ ok: true, tipo: evento.tipo })
  } catch (err) {
    console.error('[webhook] erro geral:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// Detecta categoria baseado em palavras-chave
function detectarCategoria(descricao: string): string {
  const d = descricao.toLowerCase()
  if (/mercado|supermercado|feira|comida|almoço|jantar|lanche|restaurante|ifood|padaria/.test(d)) return 'Alimentação'
  if (/uber|taxi|gasolina|combustível|ônibus|metrô|transporte|estacionamento|pedagio/.test(d)) return 'Transporte'
  if (/aluguel|condomínio|água|luz|energia|internet|casa/.test(d)) return 'Moradia'
  if (/médico|farmácia|remédio|consulta|dentista|hospital|plano de saúde/.test(d)) return 'Saúde'
  if (/cinema|netflix|spotify|lazer|viagem|hotel|show/.test(d)) return 'Lazer'
  if (/curso|livro|faculdade|escola|treinamento/.test(d)) return 'Educação'
  if (/fornecedor|produto|estoque|material/.test(d)) return 'Fornecedor'
  if (/funcionário|salário|pagamento de func/.test(d)) return 'Funcionário'
  if (/marketing|anúncio|publicidade|google ads|facebook ads/.test(d)) return 'Marketing'
  return 'Outros'
}

export async function GET() {
  return NextResponse.json({ status: 'webhook ativo', ts: new Date().toISOString() })
}
