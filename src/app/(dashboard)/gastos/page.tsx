'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Gasto {
  id: string
  descricao: string
  valor: number
  categoria: string
  tipo: 'pessoal' | 'empresa'
  data: string
}

const categorias = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Fornecedor', 'Funcionário', 'Marketing', 'Outros']

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: 'Alimentação', tipo: 'pessoal', data: format(new Date(), 'yyyy-MM-dd') })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'pessoal' | 'empresa'>('todos')

  async function load() {
    const res = await fetch('/api/gastos')
    setGastos(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, valor: parseFloat(form.valor) }),
    })
    setOpen(false)
    setForm({ descricao: '', valor: '', categoria: 'Alimentação', tipo: 'pessoal', data: format(new Date(), 'yyyy-MM-dd') })
    await load()
    setSaving(false)
  }

  async function excluir(id: string) {
    await fetch('/api/gastos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setGastos(g => g.filter(x => x.id !== id))
  }

  const filtrados = gastos.filter(g => filtro === 'todos' || g.tipo === filtro)
  const total = filtrados.reduce((s, g) => s + Number(g.valor), 0)

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Gastos 💸</h1>
        <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>
          + Novo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['todos', 'pessoal', 'empresa'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors"
            style={{ background: filtro === f ? '#3b82f6' : '#1e293b', color: filtro === f ? '#fff' : '#94a3b8' }}>
            {f === 'todos' ? 'Todos' : f === 'pessoal' ? 'Pessoal' : 'Empresa'}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: '#1e293b' }}>
        <div className="text-slate-400 text-xs">Total ({filtro})</div>
        <div className="text-2xl font-bold text-red-400">R$ {total.toFixed(2)}</div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 mt-10">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">Nenhum gasto registrado</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(g => (
            <div key={g.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#1e293b' }}>
              <div>
                <div className="text-white font-medium">{g.descricao}</div>
                <div className="text-xs text-slate-400 mt-0.5">{g.categoria} · {g.tipo} · {g.data}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-400">R$ {Number(g.valor).toFixed(2)}</span>
                <button onClick={() => excluir(g.id)} className="text-slate-600 hover:text-red-400 text-lg">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6" style={{ background: '#1e293b' }}>
            <h2 className="text-lg font-bold text-white mb-4">Novo Gasto</h2>
            <form onSubmit={salvar} className="space-y-3">
              <input type="text" placeholder="Descrição" required value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none" style={{ background: '#0f172a' }} />
              <input type="number" step="0.01" placeholder="Valor (R$)" required value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none" style={{ background: '#0f172a' }} />
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }}>
                <option value="pessoal">Pessoal</option>
                <option value="empresa">Empresa</option>
              </select>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }} />
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: '#3b82f6' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
