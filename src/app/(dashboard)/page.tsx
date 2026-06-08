'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'

const CATEGORIAS_CORES: Record<string, string> = {
  Alimentação: '#f59e0b', Transporte: '#3b82f6', Moradia: '#8b5cf6',
  Saúde: '#10b981', Lazer: '#ec4899', Educação: '#06b6d4',
  Fornecedor: '#f97316', Funcionário: '#6366f1', Marketing: '#84cc16', Outros: '#64748b',
}

const saudacao = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function DashboardPage() {
  const [gastos, setGastos] = useState<{valor: number; categoria: string; tipo: string; data: string}[]>([])
  const [treinos, setTreinos] = useState<{data: string}[]>([])
  const [tarefas, setTarefas] = useState<{status: string; prioridade: string; titulo: string; prazo: string}[]>([])
  const [timeline, setTimeline] = useState<{tipo: string; descricao: string; created_at: string}[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const inicioMes = format(new Date(), 'yyyy-MM') + '-01'
    const [g, t, o, tl] = await Promise.all([
      supabase.from('gastos').select('valor, categoria, tipo, data').eq('user_id', user.id).gte('data', inicioMes),
      supabase.from('treinos').select('data').eq('user_id', user.id).gte('data', inicioMes),
      supabase.from('obrigacoes').select('status, prioridade, titulo, prazo').eq('user_id', user.id),
      supabase.from('timeline').select('tipo, descricao, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])
    setGastos(g.data ?? [])
    setTreinos(t.data ?? [])
    setTarefas(o.data ?? [])
    setTimeline(tl.data ?? [])
    setLoading(false)
  }

  // Dados para gráfico semanal
  const hoje = new Date()
  const dadosSemanais = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(hoje, 6 - i)
    const data = format(d, 'yyyy-MM-dd')
    const total = gastos.filter(g => g.data === data).reduce((s, g) => s + Number(g.valor), 0)
    return { dia: format(d, 'EEE', { locale: ptBR }), valor: total }
  })

  // Dados para gráfico de categorias
  const porCategoria = Object.entries(
    gastos.reduce((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.valor)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)

  const totalMes = gastos.reduce((s, g) => s + Number(g.valor), 0)
  const totalHoje = gastos.filter(g => g.data === format(hoje, 'yyyy-MM-dd')).reduce((s, g) => s + Number(g.valor), 0)
  const pendentes = tarefas.filter(t => t.status === 'pendente')
  const tarefasAlta = pendentes.filter(t => t.prioridade === 'alta')
  const mesLabel = format(hoje, "MMMM 'de' yyyy", { locale: ptBR })
  const dataLabel = format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })

  if (loading) return <div className="flex items-center justify-center h-screen" style={{ background: '#0a0f1e' }}><div className="text-slate-500">Carregando...</div></div>

  return (
    <div className="pb-24" style={{ background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(180deg, #111827 0%, #0a0f1e 100%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm capitalize">{dataLabel}</p>
            <h1 className="text-2xl font-bold text-white mt-1">{saudacao()}, Matheus 👋</h1>
          </div>
          <Link href="/chat" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#1e293b' }}>
            <span className="text-lg">🤖</span>
          </Link>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Card de saldo do mês */}
        <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div className="absolute right-4 top-4 opacity-10 text-8xl">💳</div>
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Total gasto em {mesLabel}</p>
          <p className="text-white text-4xl font-bold mt-2">R$ {totalMes.toFixed(2)}</p>
          <div className="flex gap-4 mt-4">
            <div>
              <p className="text-indigo-200 text-xs">Hoje</p>
              <p className="text-white font-semibold">R$ {totalHoje.toFixed(2)}</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p className="text-indigo-200 text-xs">Treinos no mês</p>
              <p className="text-white font-semibold">{treinos.length}x</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p className="text-indigo-200 text-xs">Tarefas pendentes</p>
              <p className="text-white font-semibold">{pendentes.length}</p>
            </div>
          </div>
        </div>

        {/* Gráfico semanal */}
        <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #1e293b' }}>
          <p className="text-white font-semibold mb-4">Gastos dos últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dadosSemanais} barSize={28}>
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
                formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, 'Gasto']}
              />
              <Bar dataKey="valor" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de categorias */}
        {porCategoria.length > 0 && (
          <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-white font-semibold mb-4">Por categoria (mês)</p>
            <div className="flex gap-4 items-center">
              <PieChart width={120} height={120}>
                <Pie data={porCategoria} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {porCategoria.map((entry, i) => (
                    <Cell key={i} fill={CATEGORIAS_CORES[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-2">
                {porCategoria.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORIAS_CORES[c.name] ?? '#64748b' }} />
                      <span className="text-xs text-slate-400">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">R$ {c.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tarefas urgentes */}
        {tarefasAlta.length > 0 && (
          <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #ef444433' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold">🔴 Urgentes</p>
              <Link href="/obrigacoes" className="text-xs text-slate-400">Ver todas →</Link>
            </div>
            <div className="space-y-2">
              {tarefasAlta.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: '#1e293b' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
                  <span className="text-sm text-white flex-1">{t.titulo}</span>
                  {t.prazo && <span className="text-xs text-slate-500">📅 {t.prazo}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline recente */}
        {timeline.length > 0 && (
          <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold">⏱️ Últimas atividades</p>
              <Link href="/timeline" className="text-xs text-slate-400">Ver tudo →</Link>
            </div>
            <div className="space-y-3">
              {timeline.slice(0, 4).map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">
                    {ev.tipo === 'gasto' ? '💸' : ev.tipo === 'tarefa' ? '✅' : ev.tipo === 'treino' ? '💪' : ev.tipo === 'salario' ? '💰' : '📍'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{ev.descricao}</p>
                    <p className="text-xs text-slate-500">{format(new Date(ev.created_at), "HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/gastos" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <span className="text-2xl">💸</span>
            <div>
              <p className="text-white text-sm font-semibold">Novo gasto</p>
              <p className="text-slate-500 text-xs">Registrar despesa</p>
            </div>
          </Link>
          <Link href="/obrigacoes" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-white text-sm font-semibold">Nova tarefa</p>
              <p className="text-slate-500 text-xs">Adicionar obrigação</p>
            </div>
          </Link>
          <Link href="/treinos" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <span className="text-2xl">💪</span>
            <div>
              <p className="text-white text-sm font-semibold">Registrar treino</p>
              <p className="text-slate-500 text-xs">Log de exercício</p>
            </div>
          </Link>
          <Link href="/chat" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid #6366f133' }}>
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-white text-sm font-semibold">Chat IA</p>
              <p className="text-slate-500 text-xs">Perguntar ao assistente</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
