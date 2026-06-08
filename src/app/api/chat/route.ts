import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data } = await supabase
    .from('chat_mensagens')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { mensagem } = await req.json()
  if (!mensagem?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  // Busca histórico para contexto
  const { data: historico } = await supabase
    .from('chat_mensagens')
    .select('role, conteudo')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(20)

  // Busca dados contextuais do usuário
  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = hoje.substring(0, 7) + '-01'

  const [gastosRes, treinosRes, tarefasRes] = await Promise.all([
    supabase.from('gastos').select('descricao, valor, categoria, data').eq('user_id', user.id).gte('data', inicioMes),
    supabase.from('treinos').select('tipo, grupos_musculares, data').eq('user_id', user.id).gte('data', inicioMes),
    supabase.from('obrigacoes').select('titulo, prioridade, status, prazo').eq('user_id', user.id),
  ])

  const totalGastosMes = (gastosRes.data ?? []).reduce((s, g) => s + Number(g.valor), 0)
  const tarefasPendentes = (tarefasRes.data ?? []).filter(t => t.status === 'pendente').length

  const contexto = `Você é o assistente pessoal inteligente do Matheus, empresário brasileiro.
Dados do mês atual:
- Total gasto: R$ ${totalGastosMes.toFixed(2)}
- Treinos realizados: ${treinosRes.data?.length ?? 0}
- Tarefas pendentes: ${tarefasPendentes}
- Gastos recentes: ${JSON.stringify(gastosRes.data?.slice(0, 5) ?? [])}
- Tarefas urgentes (alta prioridade): ${JSON.stringify((tarefasRes.data ?? []).filter(t => t.prioridade === 'alta' && t.status === 'pendente').slice(0, 3))}

Responda em português brasileiro, de forma direta, prática e personalizada. Use emojis para deixar mais visual.`

  // Salva mensagem do usuário
  await supabase.from('chat_mensagens').insert({ user_id: user.id, role: 'user', conteudo: mensagem })

  // Monta histórico para a API
  const messages = [
    ...(historico ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.conteudo })),
    { role: 'user' as const, content: mensagem },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    system: contexto,
    messages,
  })

  const resposta = response.content.find(b => b.type === 'text')?.text ?? 'Não consegui responder agora.'

  // Salva resposta da IA
  await supabase.from('chat_mensagens').insert({ user_id: user.id, role: 'assistant', conteudo: resposta })

  return NextResponse.json({ resposta })
}

export async function DELETE() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await supabase.from('chat_mensagens').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
