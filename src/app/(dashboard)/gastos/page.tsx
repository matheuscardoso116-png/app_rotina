'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Gasto {
  id: string; descricao: string; valor: number; categoria: string; tipo: 'pessoal' | 'empresa'; data: string
}

const CATEGORIAS = [
  { label: 'Alimentação', icon: '🍔', color: '#f59e0b' },
  { label: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { label: 'Moradia', icon: '🏠', color: '#8b5cf6' },
  { label: 'Saúde', icon: '💊', color: '#10b981' },
  { label: 'Lazer', icon: '🎮', color: '#ec4899' },
  { label: 'Educação', icon: '📚', color: '#06b6d4' },
  { label: 'Fornecedor', icon: '📦', color: '#f97316' },
  { label: 'Funcionário', icon: '👤', color: '#6366f1' },
  { label: 'Marketing', icon: '📣', color: '#84cc16' },
  { label: 'Outros', icon: '💼', color: '#64748b' },
]

const getCat = (label: string) => CATEGORIAS.find(c => c.label === label) ?? CATEGORIAS[9]

function downloadCSV(gastos: Gasto[]) {
  const header = 'Descrição,Valor,Categoria,Tipo,Data'
  const rows = gastos.map(g => `"${g.descricao}",${g.valor},"${g.categoria}","${g.tipo}","${g.data}"`)
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `gastos_${format(new Date(), 'yyyy-MM')}.csv`
  a.click()
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'pessoal' | 'empresa'>('todos')
  const [catFiltro, setCatFiltro] = useState('')
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: 'Alimentação', tipo: 'pessoal', data: format(new Date(), 'yyyy-MM-dd') })

  async function load() {
    const res = await fetch('/api/gastos')
    setGastos(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, valor: parseFloat(form.valor) }) })
    setOpen(false)
    setForm({ descricao: '', valor: '', categoria: 'Alimentação', tipo: 'pessoal', data: format(new Date(), 'yyyy-MM-dd') })
    await load(); setSaving(false)
  }

  async function excluir(id: string) {
    await fetch('/api/gastos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setGastos(g => g.filter(x => x.id !== id))
  }

  const filtrados = gastos
    .filter(g => filtro === 'todos' || g.tipo === filtro)
    .filter(g => !catFiltro || g.categoria === catFiltro)

  const total = filtrados.reduce((s, g) => s + Number(g.valor), 0)
  const pessoal = gastos.filter(g => g.tipo === 'pessoal').reduce((s, g) => s + Number(g.valor), 0)
  const empresa = gastos.filter(g => g.tipo === 'empresa').reduce((s, g) => s + Number(g.valor), 0)
  const mesLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="pb-24" style={{ background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: '#111827', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Finanças 💰</h1>
            <p className="text-slate-400 text-sm mt-0.5 capitalize">{mesLabel}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => downloadCSV(filtrados)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300"
              style={{ background: '#1e293b' }}>
              ⬇️ CSV
            </button>
            <button onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#6366f1' }}>
              + Novo
            </button>
          </div>
        </div>

        {/* Totais */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl p-3 text-center" style={{ background: '#0a0f1e' }}>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-base font-bold text-red-400">R$ {total.toFixed(0)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#0a0f1e' }}>
            <p className="text-xs text-slate-500">Pessoal</p>
            <p className="text-base font-bold text-orange-400">R$ {pessoal.toFixed(0)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#0a0f1e' }}>
            <p className="text-xs text-slate-500">Empresa</p>
            <p className="text-base font-bold text-purple-400">R$ {empresa.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Filtros tipo */}
        <div className="flex gap-2">
          {(['todos', 'pessoal', 'empresa'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
              style={{ background: filtro === f ? '#6366f1' : '#1e293b', color: filtro === f ? '#fff' : '#94a3b8' }}>
              {f === 'todos' ? 'Todos' : f === 'pessoal' ? '👤 Pessoal' : '🏢 Empresa'}
            </button>
          ))}
        </div>

        {/* Filtro por categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCatFiltro('')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: !catFiltro ? '#1e3a5f' : '#1e293b', color: !catFiltro ? '#60a5fa' : '#64748b' }}>
            Todas
          </button>
          {CATEGORIAS.map(c => (
            <button key={c.label} onClick={() => setCatFiltro(catFiltro === c.label ? '' : c.label)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1"
              style={{ background: catFiltro === c.label ? c.color + '22' : '#1e293b', color: catFiltro === c.label ? c.color : '#64748b' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center text-slate-500 mt-20">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-slate-400">Nenhum gasto encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(g => {
              const cat = getCat(g.categoria)
              return (
                <div key={g.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid #1e293b' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: cat.color + '22' }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{g.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs rounded-full px-2 py-0.5" style={{ background: cat.color + '22', color: cat.color }}>{g.categoria}</span>
                      <span className="text-xs text-slate-600">{g.tipo}</span>
                      <span className="text-xs text-slate-600">{format(new Date(g.data + 'T12:00:00'), 'dd/MM')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-red-400">R$ {Number(g.valor).toFixed(2)}</span>
                    <button onClick={() => excluir(g.id)} className="text-slate-700 hover:text-red-400 text-lg">×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 overflow-y-auto" style={{ background: '#111827', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Novo Gasto</h2>
              <button onClick={() => setOpen(false)} className="text-slate-500 text-2xl">×</button>
            </div>
            <form onSubmit={salvar} className="space-y-4">
              <input type="text" placeholder="Descrição" required value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 outline-none" style={{ background: '#1e293b' }} />
              <input type="number" step="0.01" placeholder="Valor (R$)" required value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 outline-none" style={{ background: '#1e293b' }} />

              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">Categoria</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIAS.map(c => (
                    <button type="button" key={c.label} onClick={() => setForm(f => ({ ...f, categoria: c.label }))}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                      style={{
                        background: form.categoria === c.label ? c.color + '33' : '#1e293b',
                        border: `1px solid ${form.categoria === c.label ? c.color : 'transparent'}`,
                      }}>
                      <span className="text-base">{c.icon}</span>
                      <span className="text-slate-300" style={{ fontSize: '9px' }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#1e293b' }}>
                  <option value="pessoal">👤 Pessoal</option>
                  <option value="empresa">🏢 Empresa</option>
                </select>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#1e293b' }} />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{ background: '#6366f1' }}>
                {saving ? 'Salvando...' : 'Salvar gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
