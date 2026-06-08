import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gerarRelatorioIA } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.json().catch(() => ({}))
  const periodo = body.periodo ?? 'hoje'
  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = hoje.substring(0, 7) + '-01'

  const dataInicio = periodo === 'mes' ? inicioMes : hoje

  const [gastosRes, treinosRes, timelineRes, salariosRes] = await Promise.all([
    supabase.from('gastos').select('descricao, valor, tipo, data').gte('data', dataInicio),
    supabase.from('treinos').select('atividade, duracao_min, data').gte('data', dataInicio),
    supabase.from('timeline').select('tipo, descricao, hora_evento, valor, created_at').gte('created_at', dataInicio + 'T00:00:00'),
    supabase.from('salarios').select('descricao, valor, data').gte('data', dataInicio),
  ])

  const relatorio = await gerarRelatorioIA({
    timeline: timelineRes.data ?? [],
    gastos: gastosRes.data ?? [],
    treinos: treinosRes.data ?? [],
    salarios: salariosRes.data ?? [],
    periodo: periodo === 'mes' ? 'mês atual' : 'hoje',
  })

  return NextResponse.json({ ok: true, relatorio })
}

// Endpoint GET para gerar relatório direto pelo app
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const periodo = searchParams.get('periodo') ?? 'hoje'

  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = hoje.substring(0, 7) + '-01'
  const dataInicio = periodo === 'mes' ? inicioMes : hoje

  const [gastosRes, treinosRes, timelineRes, salariosRes] = await Promise.all([
    supabase.from('gastos').select('descricao, valor, tipo, data').eq('user_id', userId).gte('data', dataInicio),
    supabase.from('treinos').select('atividade, duracao_min, data').eq('user_id', userId).gte('data', dataInicio),
    supabase.from('timeline').select('tipo, descricao, hora_evento, valor, created_at').eq('user_id', userId).gte('created_at', dataInicio + 'T00:00:00'),
    supabase.from('salarios').select('descricao, valor, data').eq('user_id', userId).gte('data', dataInicio),
  ])

  const relatorio = await gerarRelatorioIA({
    timeline: timelineRes.data ?? [],
    gastos: gastosRes.data ?? [],
    treinos: treinosRes.data ?? [],
    salarios: salariosRes.data ?? [],
    periodo: periodo === 'mes' ? 'mês atual' : 'hoje',
  })

  return NextResponse.json({ ok: true, relatorio })
}
