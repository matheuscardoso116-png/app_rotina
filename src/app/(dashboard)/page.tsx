'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Stats {
  gastosPessoal: number
  gastosEmpresa: number
  totalGastos: number
  treinos: number
  pendentes: number
  concluidas: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const hoje = format(new Date(), 'yyyy-MM-dd')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [g, t, o] = await Promise.all([
        supabase.from('gastos').select('valor, tipo').eq('user_id', user.id).eq('data', hoje),
        supabase.from('treinos').select('id').eq('user_id', user.id).eq('data', hoje),
        supabase.from('obrigacoes').select('status').eq('user_id', user.id),
      ])

      const gastosPessoal = (g.data ?? []).filter((x: {tipo: string}) => x.tipo === 'pessoal').reduce((s: number, x: {valor: number}) => s + Number(x.valor), 0)
      const gastosEmpresa = (g.data ?? []).filter((x: {tipo: string}) => x.tipo === 'empresa').reduce((s: number, x: {valor: number}) => s + Number(x.valor), 0)
      const pendentes = (o.data ?? []).filter((x: {status: string}) => x.status === 'pendente').length
      const concluidas = (o.data ?? []).filter((x: {status: string}) => x.status === 'concluida').length

      setStats({
        gastosPessoal,
        gastosEmpresa,
        totalGastos: gastosPessoal + gastosEmpresa,
        treinos: t.data?.length ?? 0,
        pendentes,
        concluidas,
      })
      setLoading(false)
    }
    load()
  }, [])

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  const cards = stats ? [
    { label: 'Gastos Pessoais Hoje', value: `R$ ${stats.gastosPessoal.toFixed(2)}`, icon: '👤', color: '#3b82f6' },
    { label: 'Gastos Empresa Hoje', value: `R$ ${stats.gastosEmpresa.toFixed(2)}`, icon: '🏢', color: '#8b5cf6' },
    { label: 'Total Gasto Hoje', value: `R$ ${stats.totalGastos.toFixed(2)}`, icon: '💸', color: '#ef4444' },
    { label: 'Treinos Hoje', value: String(stats.treinos), icon: '💪', color: '#10b981' },
    { label: 'Tarefas Pendentes', value: String(stats.pendentes), icon: '⏳', color: '#f59e0b' },
    { label: 'Tarefas Concluídas', value: String(stats.concluidas), icon: '✅', color: '#22c55e' },
  ] : []

  return (
    <div className="p-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Bom dia! 👋</h1>
        <p className="text-slate-400 text-sm capitalize mt-1">{hoje}</p>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 mt-20">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map(card => (
            <div key={card.label} className="rounded-2xl p-4" style={{ background: '#1e293b' }}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-xl font-bold" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs text-slate-400 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
