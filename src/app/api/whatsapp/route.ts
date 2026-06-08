import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assistenteWhatsApp, type ContextoUsuario } from '@/lib/claude'
import { sendWhatsApp } from '@/lib/whatsapp'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ZAPIPayload {
  phone?: string
  fromMe?: boolean
  body?: string
  text?: { message?: string }
  isGroup?: boolean
  isStatusReply?: boolean
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const payload: ZAPIPayload = await req.json()
    console.log('[wa] payload:', JSON.stringify(payload).slice(0, 300))

    // Ignora grupos e status
    if (payload.isGroup || payload.isStatusReply) {
      return NextResponse.json({ ok: true, skip: 'group_or_status' })
    }

    // Só processa mensagens enviadas por mim
    const meuNumero = (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
    if (payload.fromMe === false) {
      return NextResponse.json({ ok: true, skip: 'not_from_me' })
    }

    const mensagem = (payload.body ?? payload.text?.message ?? '').trim()
    if (mensagem.length < 2) {
      return NextResponse.json({ ok: true, skip: 'empty' })
    }
    console.log('[wa] mensagem:', mensagem)

    // ── Busca usuário ───────────────────────────────────────────────────────
    const supabase = supabaseAdmin()
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const owner = usersData?.users?.[0]
    if (!owner) return NextResponse.json({ ok: true, skip: 'no_user' })
    const userId = owner.id

    // ── Monta contexto com dados reais ──────────────────────────────────────
    const hoje = new Date().toISOString().split('T')[0]
    const mesInicio = hoje.slice(0, 7) + '-01'

    const [gastosRes, treinosRes, tarefasRes, salariosRes] = await Promise.all([
      supabase.from('gastos').select('descricao,valor,categoria,data').eq('user_id', userId).gte('data', mesInicio).order('data', { ascending: false }),
      supabase.from('treinos').select('tipo,grupos_musculares,data').eq('user_id', userId).gte('data', mesInicio).order('data', { ascending: false }),
      supabase.from('obrigacoes').select('titulo,prioridade,status').eq('user_id', userId),
      supabase.from('salarios').select('descricao,valor,data').eq('user_id', userId).gte('data', mesInicio),
    ])

    const gastos  = (gastosRes.data  ?? []) as Array<{descricao:string;valor:number;categoria:string;data:string}>
    const treinos = (treinosRes.data ?? []) as Array<{tipo:string;grupos_musculares:string;data:string}>
    const tarefas = (tarefasRes.data ?? []) as Array<{titulo:string;prioridade:string;status:string}>
    const salarios = (salariosRes.data ?? []) as Array<{descricao:string;valor:number;data:string}>

    const totalGastosMes   = gastos.reduce((s, g)  => s + Number(g.valor), 0)
    const totalReceitasMes = salarios.reduce((s, x) => s + Number(x.valor), 0)

    const gastosPorCategoria: Record<string, number> = {}
    gastos.forEach(g => { gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] ?? 0) + Number(g.valor) })

    const ctx: ContextoUsuario = {
      totalGastosMes,
      totalReceitasMes,
      saldo: totalReceitasMes - totalGastosMes,
      gastosPorCategoria,
      qtTreinosMes: treinos.length,
      diasTreinados: [...new Set(treinos.map(t => t.data))],
      tarefasPendentes: tarefas.filter(t => t.status === 'pendente').map(t => ({ titulo: t.titulo, prioridade: t.prioridade })),
      ultimosGastos: gastos.slice(0, 8),
      ultimosTreinos: treinos.slice(0, 5),
      hoje,
      mesNome: format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }),
    }

    // ── Chama assistente IA ─────────────────────────────────────────────────
    const resultado = await assistenteWhatsApp(mensagem, ctx)
    console.log('[wa] acao:', resultado.acao, '| resposta:', resultado.resposta.slice(0, 100))

    // ── Executa ação ────────────────────────────────────────────────────────
    const d = resultado.dados ?? {}

    if (resultado.acao === 'gasto' && d.descricao) {
      await supabase.from('gastos').insert({
        user_id: userId,
        descricao: d.descricao,
        valor: d.valor ?? 0,
        categoria: d.categoria ?? 'Outros',
        tipo: 'pessoal',
        data: hoje,
      })
    }

    if (resultado.acao === 'treino' && d.descricao) {
      await supabase.from('treinos').insert({
        user_id: userId,
        tipo: d.tipo ?? d.descricao,
        grupos_musculares: d.grupos_musculares ?? '',
        data: hoje,
      })
    }

    if (resultado.acao === 'tarefa' && d.descricao) {
      await supabase.from('obrigacoes').insert({
        user_id: userId,
        titulo: d.descricao,
        prioridade: d.prioridade ?? 'media',
        categoria: 'Pessoal',
        status: 'pendente',
      })
    }

    if (resultado.acao === 'salario' && d.descricao) {
      await supabase.from('salarios').insert({
        user_id: userId,
        descricao: d.descricao,
        valor: d.valor ?? 0,
        data: hoje,
      })
    }

    if (resultado.acao === 'atividade' && d.descricao) {
      await supabase.from('timeline').insert({
        user_id: userId,
        titulo: d.descricao,
        tipo: 'outro',
        hora: new Date().toTimeString().slice(0, 5),
        data: hoje,
      })
    }

    // ── Envia resposta no WhatsApp ──────────────────────────────────────────
    if (resultado.resposta && meuNumero) {
      await sendWhatsApp(meuNumero, resultado.resposta)
    }

    return NextResponse.json({ ok: true, acao: resultado.acao })
  } catch (err) {
    console.error('[wa] erro:', err)
    // tenta avisar no WhatsApp em caso de erro
    const meuNumero = (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
    if (meuNumero) {
      try {
        await sendWhatsApp(meuNumero, '⚠️ Erro interno ao processar sua mensagem. Tente novamente.')
      } catch { /* ignora */ }
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook ativo', ts: new Date().toISOString() })
}
