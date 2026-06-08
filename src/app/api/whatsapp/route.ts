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
  message?: Record<string, unknown>
  isGroup?: boolean
  isStatusReply?: boolean
  type?: string
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  try {
    const raw = await req.text()
    console.log('[wa] payload raw:', raw.slice(0, 600))

    const payload: ZAPIPayload = JSON.parse(raw)

    // Ignora grupos e status
    if (payload.isGroup || payload.isStatusReply) {
      return NextResponse.json({ ok: true, skip: 'group_or_status' })
    }

    const meuNumero = (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
    const phoneClean = (payload.phone ?? '').replace(/\D/g, '')

    // Aceita: mensagens enviadas POR mim (fromMe:true)
    //      OU mensagens recebidas DO meu número (fromMe:false, phone=meuNumero)
    //      Se WHATSAPP_NUMBER não configurado, aceita tudo que seja fromMe:true
    const isMeu =
      payload.fromMe === true ||
      (meuNumero !== '' && phoneClean === meuNumero)

    if (!isMeu) {
      console.log('[wa] skip: não é do Matheus. phone:', phoneClean, 'fromMe:', payload.fromMe)
      return NextResponse.json({ ok: true, skip: 'not_mine', phone: phoneClean })
    }

    // Extrai texto — Z-API usa campos diferentes conforme versão
    const mensagem = (
      payload.body ??
      payload.text?.message ??
      (payload.message?.['conversation'] as string | undefined) ??
      ''
    ).trim()

    if (!mensagem || mensagem.length < 2) {
      console.log('[wa] skip: mensagem vazia, type:', payload.type)
      return NextResponse.json({ ok: true, skip: 'empty_text' })
    }
    console.log('[wa] mensagem:', mensagem, '| fromMe:', payload.fromMe, '| phone:', phoneClean)

    // ── Busca usuário ─────────────────────────────────────────────────────────
    const supabase = supabaseAdmin()
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw new Error('listUsers: ' + usersError.message)

    const owner = usersData?.users?.[0]
    if (!owner) {
      console.error('[wa] nenhum usuário encontrado')
      return NextResponse.json({ ok: true, skip: 'no_user' })
    }
    const userId = owner.id
    console.log('[wa] userId:', userId.slice(0, 8))

    // ── Monta contexto com dados reais ────────────────────────────────────────
    const hoje = new Date().toISOString().split('T')[0]
    const mesInicio = hoje.slice(0, 7) + '-01'

    const [gastosRes, treinosRes, tarefasRes, salariosRes] = await Promise.all([
      supabase.from('gastos').select('descricao,valor,categoria,data').eq('user_id', userId).gte('data', mesInicio).order('data', { ascending: false }),
      supabase.from('treinos').select('tipo,grupos_musculares,data').eq('user_id', userId).gte('data', mesInicio).order('data', { ascending: false }),
      supabase.from('obrigacoes').select('titulo,prioridade,status').eq('user_id', userId),
      supabase.from('salarios').select('descricao,valor,data').eq('user_id', userId).gte('data', mesInicio),
    ])

    if (gastosRes.error)  console.error('[wa] gastos err:', gastosRes.error.message)
    if (treinosRes.error) console.error('[wa] treinos err:', treinosRes.error.message)
    if (tarefasRes.error) console.error('[wa] tarefas err:', tarefasRes.error.message)

    const gastos   = (gastosRes.data  ?? []) as Array<{descricao:string;valor:number;categoria:string;data:string}>
    const treinos  = (treinosRes.data ?? []) as Array<{tipo:string;grupos_musculares:string;data:string}>
    const tarefas  = (tarefasRes.data ?? []) as Array<{titulo:string;prioridade:string;status:string}>
    const salarios = (salariosRes.data ?? []) as Array<{descricao:string;valor:number;data:string}>

    const totalGastosMes   = gastos.reduce((s, g) => s + Number(g.valor), 0)
    const totalReceitasMes = salarios.reduce((s, x) => s + Number(x.valor), 0)
    const gastosPorCategoria: Record<string, number> = {}
    gastos.forEach(g => {
      gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] ?? 0) + Number(g.valor)
    })

    const ctx: ContextoUsuario = {
      totalGastosMes,
      totalReceitasMes,
      saldo: totalReceitasMes - totalGastosMes,
      gastosPorCategoria,
      qtTreinosMes: treinos.length,
      diasTreinados: [...new Set(treinos.map(t => t.data))],
      tarefasPendentes: tarefas
        .filter(t => t.status === 'pendente')
        .map(t => ({ titulo: t.titulo, prioridade: t.prioridade })),
      ultimosGastos: gastos.slice(0, 8),
      ultimosTreinos: treinos.slice(0, 5),
      hoje,
      mesNome: format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }),
    }

    // ── Chama IA ──────────────────────────────────────────────────────────────
    console.log('[wa] chamando IA...')
    const resultado = await assistenteWhatsApp(mensagem, ctx)
    console.log('[wa] IA ok em', Date.now() - t0, 'ms | acao:', resultado.acao)

    // ── Executa ação ──────────────────────────────────────────────────────────
    const d = resultado.dados ?? {}

    if (resultado.acao === 'gasto' && d.descricao) {
      const { error } = await supabase.from('gastos').insert({
        user_id: userId, descricao: d.descricao, valor: d.valor ?? 0,
        categoria: d.categoria ?? 'Outros', tipo: 'pessoal', data: hoje,
      })
      if (error) console.error('[wa] insert gasto:', error.message)
      else console.log('[wa] ✓ gasto registrado:', d.descricao)
    }

    if (resultado.acao === 'treino' && (d.tipo ?? d.descricao)) {
      const { error } = await supabase.from('treinos').insert({
        user_id: userId,
        tipo: d.tipo ?? d.descricao,
        grupos_musculares: d.grupos_musculares ?? '',
        data: hoje,
      })
      if (error) console.error('[wa] insert treino:', error.message)
      else console.log('[wa] ✓ treino registrado:', d.tipo ?? d.descricao)
    }

    if (resultado.acao === 'tarefa' && d.descricao) {
      const { error } = await supabase.from('obrigacoes').insert({
        user_id: userId, titulo: d.descricao,
        prioridade: d.prioridade ?? 'media',
        tipo: 'pessoal', status: 'pendente',
      })
      if (error) console.error('[wa] insert tarefa:', error.message)
      else console.log('[wa] ✓ tarefa registrada:', d.descricao)
    }

    if (resultado.acao === 'salario' && d.descricao) {
      const { error } = await supabase.from('salarios').insert({
        user_id: userId, descricao: d.descricao, valor: d.valor ?? 0, data: hoje,
      })
      if (error) console.error('[wa] insert salario:', error.message)
    }

    if (resultado.acao === 'atividade' && d.descricao) {
      const { error } = await supabase.from('timeline').insert({
        user_id: userId, titulo: d.descricao, tipo: 'outro',
        hora: new Date().toTimeString().slice(0, 5), data: hoje,
      })
      if (error) console.error('[wa] insert atividade:', error.message)
    }

    // ── Responde no WhatsApp ───────────────────────────────────────────────────
    const destino = phoneClean || meuNumero
    if (resultado.resposta && destino) {
      console.log('[wa] enviando resposta para:', destino)
      await sendWhatsApp(destino, resultado.resposta)
      console.log('[wa] ✓ resposta enviada | total:', Date.now() - t0, 'ms')
    } else {
      console.warn('[wa] sem destino ou resposta vazia. destino:', destino, 'resposta len:', resultado.resposta?.length)
    }

    return NextResponse.json({ ok: true, acao: resultado.acao, ms: Date.now() - t0 })
  } catch (err) {
    console.error('[wa] ERRO GERAL:', String(err))
    const meuNumero = (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
    if (meuNumero) {
      try { await sendWhatsApp(meuNumero, '⚠️ Erro interno. Tente novamente em instantes.') } catch { /* ignora */ }
    }
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'webhook ativo',
    ts: new Date().toISOString(),
    env: {
      supabaseUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey:        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole:    !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anthropicKey:   !!process.env.ANTHROPIC_API_KEY,
      zapiInstance:   !!process.env.ZAPI_INSTANCE_ID,
      zapiToken:      !!process.env.ZAPI_TOKEN,
      zapiClientToken:!!process.env.ZAPI_CLIENT_TOKEN,
      whatsappNumber: process.env.WHATSAPP_NUMBER ?? 'NÃO CONFIGURADO',
    },
  })
}
