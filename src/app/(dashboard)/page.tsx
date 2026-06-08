'use client'

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'

const CAT_CORES: Record<string, string> = {
  'Alimentação': '#f59e0b', 'Transporte': '#3b82f6', 'Moradia': '#8b5cf6',
  'Saúde': '#10b981', 'Lazer': '#ec4899', 'Educação': '#06b6d4',
  'Fornecedor': '#f97316', 'Funcionário': '#6366f1', 'Marketing': '#84cc16', 'Outros': '#64748b',
}

interface Gasto { id: string; descricao: string; valor: number; categoria: string; data: string }
interface Treino { id: string; tipo: string; data: string; grupos_musculares?: string }
interface Obrigacao { id: string; titulo: string; status: string; prioridade: string }
interface Salario { id: string; valor: number; data: string }

export default function DashboardPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [tarefas, setTarefas] = useState<Obrigacao[]>([])
  const [salarios, setSalarios] = useState<Salario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/gastos').then(r => r.json()),
      fetch('/api/treinos').then(r => r.json()),
      fetch('/api/obrigacoes').then(r => r.json()),
      fetch('/api/salarios').then(r => r.json()),
    ]).then(([g, t, o, s]) => {
      setGastos(g); setTreinos(t); setTarefas(o); setSalarios(s); setLoading(false)
    })
  }, [])

  const hoje = new Date()
  const mesAtual = format(hoje, 'yyyy-MM')

  const gastosMes = gastos.filter(g => g.data.startsWith(mesAtual))
  const totalGastos = gastosMes.reduce((s, g) => s + Number(g.valor), 0)
  const totalReceitas = salarios.filter(s => s.data.startsWith(mesAtual)).reduce((s, x) => s + Number(x.valor), 0)
  const saldo = totalReceitas - totalGastos

  const treinosMes = treinos.filter(t => t.data.startsWith(mesAtual))
  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente')
  const urgentes = tarefasPendentes.filter(t => t.prioridade === 'urgente')

  // Gráfico últimos 7 dias
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(hoje, 6 - i)
    const str = format(d, 'yyyy-MM-dd')
    const total = gastos.filter(g => g.data === str).reduce((s, g) => s + Number(g.valor), 0)
    return { dia: format(d, 'EEE', { locale: ptBR }), total }
  })

  // PieChart por categoria (mês atual)
  const porCategoria = Object.entries(
    gastosMes.reduce((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + Number(g.valor)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)

  // Últimos gastos
  const ultimosGastos = [...gastos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4)
  const ultimosTreinos = [...treinos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3)

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100dvh', padding: '52px 16px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[180, 120, 80, 80].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 20 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <p style={{ color: '#8e8e93', fontSize: 13, margin: '0 0 2px', textTransform: 'capitalize' }}>
          {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>Minha Rotina</h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Card saldo */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius: 24, padding: 24, border: '1px solid rgba(99,102,241,0.3)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 4px' }}>Saldo do mês</p>
          <p style={{ color: saldo >= 0 ? '#30d158' : '#ff453a', fontSize: 36, fontWeight: 700, margin: '0 0 20px', letterSpacing: -1 }}>
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Receitas</p>
              <p style={{ color: '#30d158', fontSize: 20, fontWeight: 600, margin: 0 }}>
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gastos</p>
              <p style={{ color: '#ff453a', fontSize: 20, fontWeight: 600, margin: 0 }}>
                R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { icon: '💪', label: 'Treinos', val: treinosMes.length, color: '#3b82f6', href: '/treinos' },
            { icon: '⏳', label: 'Pendentes', val: tarefasPendentes.length, color: '#8b5cf6', href: '/obrigacoes' },
            { icon: '🔴', label: 'Urgentes', val: urgentes.length, color: '#ff453a', href: '/obrigacoes' },
          ].map(s => (
            <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.val}</div>
                <div style={{ color: '#8e8e93', fontSize: 11 }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Urgentes se houver */}
        {urgentes.length > 0 && (
          <Link href="/obrigacoes" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ff453a15', border: '1px solid #ff453a40', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🔴</span>
              <div>
                <p style={{ color: '#ff453a', fontWeight: 600, fontSize: 14, margin: 0 }}>{urgentes.length} tarefa{urgentes.length > 1 ? 's' : ''} urgente{urgentes.length > 1 ? 's' : ''}</p>
                <p style={{ color: '#8e8e93', fontSize: 12, margin: '2px 0 0' }}>{urgentes[0].titulo}</p>
              </div>
              <span style={{ marginLeft: 'auto', color: '#8e8e93', fontSize: 18 }}>›</span>
            </div>
          </Link>
        )}

        {/* Gráfico 7 dias */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px 12px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0, paddingLeft: 8 }}>Últimos 7 dias</p>
            <Link href="/relatorios" style={{ color: '#6366f1', fontSize: 12, textDecoration: 'none', paddingRight: 8 }}>Ver mais →</Link>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={ultimos7} barSize={24}>
              <XAxis dataKey="dia" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }}
                formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, 'Gasto']}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PieChart categorias */}
        {porCategoria.length > 0 && (
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px 16px' }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: '0 0 16px' }}>Por categoria</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <PieChart width={120} height={120}>
                <Pie data={porCategoria} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {porCategoria.map((entry) => (
                    <Cell key={entry.name} fill={CAT_CORES[entry.name] ?? '#636366'} />
                  ))}
                </Pie>
              </PieChart>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {porCategoria.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_CORES[c.name] ?? '#636366', flexShrink: 0 }} />
                      <span style={{ color: '#8e8e93', fontSize: 12 }}>{c.name}</span>
                    </div>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>R$ {c.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Últimos gastos */}
        {ultimosGastos.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Últimos gastos</p>
              <Link href="/gastos" style={{ color: '#6366f1', fontSize: 12, textDecoration: 'none' }}>Ver todos →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ultimosGastos.map(g => (
                <div key={g.id} className="list-item" style={{ gap: 12 }}>
                  <div className="icon-circle" style={{ background: (CAT_CORES[g.categoria] ?? '#636366') + '20', fontSize: 18 }}>
                    {g.categoria === 'Alimentação' ? '🍔' : g.categoria === 'Transporte' ? '🚗' : g.categoria === 'Saúde' ? '💊' : '💼'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descricao}</p>
                    <p style={{ color: '#8e8e93', fontSize: 12, margin: '2px 0 0' }}>{format(new Date(g.data + 'T12:00:00'), 'dd/MM')} · {g.categoria}</p>
                  </div>
                  <span style={{ color: '#ff453a', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>- R$ {Number(g.valor).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Últimos treinos */}
        {ultimosTreinos.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Treinos recentes</p>
              <Link href="/treinos" style={{ color: '#6366f1', fontSize: 12, textDecoration: 'none' }}>Ver todos →</Link>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }} className="no-scroll-bar">
              {ultimosTreinos.map(t => (
                <div key={t.id} style={{ flexShrink: 0, background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', minWidth: 130 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>💪</div>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, margin: '0 0 2px' }}>{t.tipo}</p>
                  <p style={{ color: '#8e8e93', fontSize: 11, margin: 0 }}>{format(new Date(t.data + 'T12:00:00'), 'dd/MM')}</p>
                  {t.grupos_musculares && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {t.grupos_musculares.split(',').filter(Boolean).slice(0, 2).map(g => (
                        <span key={g} style={{ background: '#3b82f620', color: '#60a5fa', fontSize: 10, padding: '2px 6px', borderRadius: 8 }}>{g}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
