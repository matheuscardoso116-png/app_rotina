'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CORES = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4']

function downloadCSV(gastos: {descricao: string; valor: number; categoria: string; tipo: string; data: string}[]) {
  const csv = ['Descrição,Valor,Categoria,Tipo,Data', ...gastos.map(g => `"${g.descricao}",${g.valor},"${g.categoria}","${g.tipo}","${g.data}"`)].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `relatorio_${format(new Date(), 'yyyy-MM')}.csv`
  a.click()
}

export default function RelatoriosPage() {
  const [gastos, setGastos] = useState<{descricao: string; valor: number; categoria: string; tipo: string; data: string}[]>([])
  const [salarios, setSalarios] = useState<{valor: number; descricao: string}[]>([])
  const [treinos, setTreinos] = useState<{data: string; tipo: string; grupos_musculares: string}[]>([])
  const [tarefas, setTarefas] = useState<{status: string}[]>([])
  const [relatorioIA, setRelatorioIA] = useState('')
  const [gerandoIA, setGerandoIA] = useState(false)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'mes' | 'hoje'>('mes')
  const supabase = createClient()

  useEffect(() => { load() }, [periodo])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const hoje = format(new Date(), 'yyyy-MM-dd')
    const inicio = periodo === 'mes' ? format(startOfMonth(new Date()), 'yyyy-MM-dd') : hoje

    const [g, s, t, o] = await Promise.all([
      supabase.from('gastos').select('descricao, valor, categoria, tipo, data').eq('user_id', user.id).gte('data', inicio),
      supabase.from('salarios').select('valor, descricao').eq('user_id', user.id).gte('data', inicio),
      supabase.from('treinos').select('data, tipo, grupos_musculares').eq('user_id', user.id).gte('data', inicio),
      supabase.from('obrigacoes').select('status').eq('user_id', user.id),
    ])
    setGastos(g.data ?? [])
    setSalarios(s.data ?? [])
    setTreinos(t.data ?? [])
    setTarefas(o.data ?? [])
    setLoading(false)
  }

  async function gerarIA() {
    setGerandoIA(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch(`/api/relatorio?userId=${user.id}&periodo=${periodo}`)
    const { relatorio } = await res.json()
    setRelatorioIA(relatorio ?? 'Erro ao gerar.')
    setGerandoIA(false)
  }

  const totalGastos = gastos.reduce((s, g) => s + Number(g.valor), 0)
  const totalReceitas = salarios.reduce((s, x) => s + Number(x.valor), 0)
  const saldo = totalReceitas - totalGastos

  const porCategoria = Object.entries(
    gastos.reduce((acc, g) => { acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.valor); return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const porDia = (() => {
    const map: Record<string, number> = {}
    gastos.forEach(g => { map[g.data] = (map[g.data] || 0) + Number(g.valor) })
    return Object.entries(map).sort().slice(-14).map(([data, valor]) => ({
      dia: format(new Date(data + 'T12:00:00'), 'dd/MM'),
      valor,
    }))
  })()

  const pendentes = tarefas.filter(t => t.status === 'pendente').length
  const concluidas = tarefas.filter(t => t.status === 'concluida').length
  const mesLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="pb-24" style={{ background: '#0a0f1e', minHeight: '100vh' }}>
      <div className="px-5 pt-12 pb-4" style={{ background: '#111827', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Relatórios 📊</h1>
            <p className="text-slate-400 text-sm capitalize mt-0.5">{mesLabel}</p>
          </div>
          <button onClick={() => downloadCSV(gastos)}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 flex items-center gap-1"
            style={{ background: '#1e293b' }}>
            ⬇️ Baixar CSV
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {(['mes', 'hoje'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: periodo === p ? '#6366f1' : '#1e293b', color: '#fff' }}>
              {p === 'mes' ? 'Este mês' : 'Hoje'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Resumo financeiro */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-xs text-slate-500 mb-1">Receitas</p>
            <p className="text-green-400 font-bold">R$ {totalReceitas.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-xs text-slate-500 mb-1">Gastos</p>
            <p className="text-red-400 font-bold">R$ {totalGastos.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#111827', border: `1px solid ${saldo >= 0 ? '#22c55e33' : '#ef444433'}` }}>
            <p className="text-xs text-slate-500 mb-1">Saldo</p>
            <p className="font-bold" style={{ color: saldo >= 0 ? '#22c55e' : '#ef4444' }}>R$ {saldo.toFixed(0)}</p>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-2xl">💪</p>
            <p className="text-white font-bold mt-1">{treinos.length}x</p>
            <p className="text-xs text-slate-500">Treinos</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-2xl">⏳</p>
            <p className="text-white font-bold mt-1">{pendentes}</p>
            <p className="text-xs text-slate-500">Pendentes</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-2xl">✅</p>
            <p className="text-white font-bold mt-1">{concluidas}</p>
            <p className="text-xs text-slate-500">Concluídas</p>
          </div>
        </div>

        {/* Gráfico por dia */}
        {porDia.length > 0 && (
          <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-white font-semibold mb-4">Gastos por dia</p>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={porDia} barSize={14}>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
                  formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, 'Gasto']} />
                <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por categoria */}
        {porCategoria.length > 0 && (
          <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-white font-semibold mb-4">Por categoria</p>
            <div className="flex gap-4 items-center">
              <PieChart width={100} height={100}>
                <Pie data={porCategoria} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={3}>
                  {porCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-1.5">
                {porCategoria.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: CORES[i % CORES.length] }} />
                      <span className="text-xs text-slate-400">{c.name}</span>
                    </div>
                    <span className="text-xs text-white font-medium">R$ {c.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Relatório IA */}
        <div className="rounded-3xl p-5" style={{ background: '#111827', border: '1px solid #6366f133' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold">🤖 Análise com IA</p>
            <button onClick={gerarIA} disabled={gerandoIA}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-50"
              style={{ background: '#4f46e5' }}>
              {gerandoIA ? 'Gerando...' : 'Gerar análise'}
            </button>
          </div>
          {relatorioIA ? (
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{relatorioIA}</p>
          ) : (
            <p className="text-sm text-slate-500">Clique em "Gerar análise" para receber insights personalizados sobre seus gastos, rotina e produtividade.</p>
          )}
        </div>
      </div>
    </div>
  )
}
