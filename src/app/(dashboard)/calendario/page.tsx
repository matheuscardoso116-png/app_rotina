'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DiaData {
  gastos: number
  treinos: string[]
  tarefas: number
  tarefasConcluidas: number
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarioPage() {
  const [mesAtual, setMesAtual] = useState(new Date())
  const [dados, setDados] = useState<Record<string, DiaData>>({})
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)
  const [detalhes, setDetalhes] = useState<{gastos: {descricao: string; valor: number}[]; treinos: {tipo: string; grupos_musculares: string}[]; tarefas: {titulo: string; status: string}[]} | null>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [mesAtual])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const inicio = format(startOfMonth(mesAtual), 'yyyy-MM-dd')
    const fim = format(endOfMonth(mesAtual), 'yyyy-MM-dd')

    const [g, t, o] = await Promise.all([
      supabase.from('gastos').select('data, valor').eq('user_id', user.id).gte('data', inicio).lte('data', fim),
      supabase.from('treinos').select('data, tipo, grupos_musculares').eq('user_id', user.id).gte('data', inicio).lte('data', fim),
      supabase.from('obrigacoes').select('prazo, status, titulo').eq('user_id', user.id),
    ])

    const map: Record<string, DiaData> = {}
    const dias = eachDayOfInterval({ start: startOfMonth(mesAtual), end: endOfMonth(mesAtual) })
    dias.forEach(d => {
      const key = format(d, 'yyyy-MM-dd')
      map[key] = { gastos: 0, treinos: [], tarefas: 0, tarefasConcluidas: 0 }
    })

    g.data?.forEach((x: {data: string; valor: number}) => { if (map[x.data]) map[x.data].gastos += Number(x.valor) })
    t.data?.forEach((x: {data: string; tipo: string}) => { if (map[x.data]) map[x.data].treinos.push(x.tipo) })
    o.data?.forEach((x: {prazo: string; status: string}) => {
      if (x.prazo && map[x.prazo]) {
        if (x.status === 'pendente') map[x.prazo].tarefas++
        else map[x.prazo].tarefasConcluidas++
      }
    })
    setDados(map)
  }

  async function selecionarDia(dia: Date) {
    setDiaSelecionado(dia)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = format(dia, 'yyyy-MM-dd')

    const [g, t, o] = await Promise.all([
      supabase.from('gastos').select('descricao, valor').eq('user_id', user.id).eq('data', data),
      supabase.from('treinos').select('tipo, grupos_musculares').eq('user_id', user.id).eq('data', data),
      supabase.from('obrigacoes').select('titulo, status').eq('user_id', user.id).eq('prazo', data),
    ])
    setDetalhes({ gastos: g.data ?? [], treinos: t.data ?? [], tarefas: o.data ?? [] })
  }

  const diasMes = eachDayOfInterval({ start: startOfMonth(mesAtual), end: endOfMonth(mesAtual) })
  const primeiroDia = getDay(startOfMonth(mesAtual))

  function mudarMes(delta: number) {
    const novo = new Date(mesAtual)
    novo.setMonth(novo.getMonth() + delta)
    setMesAtual(novo)
    setDiaSelecionado(null)
    setDetalhes(null)
  }

  return (
    <div className="pb-24" style={{ background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4" style={{ background: '#111827', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center justify-between">
          <button onClick={() => mudarMes(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400" style={{ background: '#1e293b' }}>‹</button>
          <h1 className="text-white font-bold text-lg capitalize">
            {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
          <button onClick={() => mudarMes(1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400" style={{ background: '#1e293b' }}>›</button>
        </div>

        {/* Legenda */}
        <div className="flex gap-4 mt-3 justify-center">
          {[['#ef4444', 'Gastos'], ['#3b82f6', 'Treino'], ['#f59e0b', 'Tarefa pend.'], ['#22c55e', 'Tarefa concl.']].map(([cor, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: cor }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-xs text-slate-600 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Grade */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
          {diasMes.map(dia => {
            const key = format(dia, 'yyyy-MM-dd')
            const d = dados[key]
            const sel = diaSelecionado && isSameDay(dia, diaSelecionado)
            const hoje = isToday(dia)

            return (
              <button key={key} onClick={() => selecionarDia(dia)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 relative transition-all"
                style={{
                  background: sel ? '#4f46e5' : hoje ? '#1e293b' : 'transparent',
                  border: `1px solid ${sel ? '#6366f1' : hoje ? '#334155' : 'transparent'}`,
                }}>
                <span className="text-xs font-medium" style={{ color: sel ? '#fff' : hoje ? '#818cf8' : '#94a3b8' }}>
                  {format(dia, 'd')}
                </span>
                {d && (
                  <div className="flex gap-0.5">
                    {d.gastos > 0 && <div className="w-1 h-1 rounded-full" style={{ background: '#ef4444' }} />}
                    {d.treinos.length > 0 && <div className="w-1 h-1 rounded-full" style={{ background: '#3b82f6' }} />}
                    {d.tarefas > 0 && <div className="w-1 h-1 rounded-full" style={{ background: '#f59e0b' }} />}
                    {d.tarefasConcluidas > 0 && <div className="w-1 h-1 rounded-full" style={{ background: '#22c55e' }} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Detalhes do dia */}
        {diaSelecionado && detalhes && (
          <div className="mt-5 rounded-2xl p-4 space-y-3" style={{ background: '#111827', border: '1px solid #1e293b' }}>
            <p className="text-white font-semibold capitalize">
              {format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>

            {detalhes.gastos.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">💸 Gastos</p>
                {detalhes.gastos.map((g, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-slate-300">{g.descricao}</span>
                    <span className="text-red-400 font-medium">R$ {Number(g.valor).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {detalhes.treinos.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">💪 Treinos</p>
                {detalhes.treinos.map((t, i) => (
                  <div key={i} className="text-sm text-slate-300 py-1">
                    {t.tipo}{t.grupos_musculares ? ` · ${t.grupos_musculares.split(',').join(', ')}` : ''}
                  </div>
                ))}
              </div>
            )}

            {detalhes.tarefas.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">✅ Tarefas com prazo</p>
                {detalhes.tarefas.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1">
                    <span>{t.status === 'concluida' ? '✅' : '⏳'}</span>
                    <span className="text-slate-300">{t.titulo}</span>
                  </div>
                ))}
              </div>
            )}

            {detalhes.gastos.length === 0 && detalhes.treinos.length === 0 && detalhes.tarefas.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-2">Nenhum registro neste dia</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
