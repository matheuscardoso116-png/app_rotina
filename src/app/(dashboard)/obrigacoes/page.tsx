'use client'

import { useEffect, useState } from 'react'

interface Obrigacao {
  id: string
  titulo: string
  descricao: string
  prazo: string
  prioridade: 'baixa' | 'media' | 'alta'
  tipo: 'pessoal' | 'empresa'
  status: 'pendente' | 'concluida'
}

const cores = { baixa: '#22c55e', media: '#f59e0b', alta: '#ef4444' }
const labelPrioridade = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

export default function ObrigacoesPage() {
  const [items, setItems] = useState<Obrigacao[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titulo: '', descricao: '', prazo: '', prioridade: 'media', tipo: 'pessoal' })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState<'pendente' | 'concluida'>('pendente')

  async function load() {
    const res = await fetch('/api/obrigacoes')
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/obrigacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({ titulo: '', descricao: '', prazo: '', prioridade: 'media', tipo: 'pessoal' })
    await load()
    setSaving(false)
  }

  async function toggleStatus(item: Obrigacao) {
    const novoStatus = item.status === 'pendente' ? 'concluida' : 'pendente'
    await fetch('/api/obrigacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: novoStatus }),
    })
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: novoStatus } : x))
  }

  async function excluir(id: string) {
    await fetch('/api/obrigacoes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(x => x.id !== id))
  }

  const filtrados = items.filter(x => x.status === filtro)
  const pendentes = items.filter(x => x.status === 'pendente').length
  const concluidas = items.filter(x => x.status === 'concluida').length

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Tarefas ✅</h1>
        <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#8b5cf6' }}>
          + Nova
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFiltro('pendente')}
          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
          style={{ background: filtro === 'pendente' ? '#f59e0b' : '#1e293b', color: filtro === 'pendente' ? '#fff' : '#94a3b8' }}>
          ⏳ Pendentes ({pendentes})
        </button>
        <button onClick={() => setFiltro('concluida')}
          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
          style={{ background: filtro === 'concluida' ? '#22c55e' : '#1e293b', color: filtro === 'concluida' ? '#fff' : '#94a3b8' }}>
          ✅ Concluídas ({concluidas})
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 mt-10">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">Nenhuma tarefa aqui</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(item => (
            <div key={item.id} className="rounded-2xl p-4" style={{ background: '#1e293b' }}>
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => toggleStatus(item)} className="mt-0.5 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: item.status === 'concluida' ? '#22c55e' : '#475569', background: item.status === 'concluida' ? '#22c55e' : 'transparent' }}>
                    {item.status === 'concluida' && <span className="text-white text-xs">✓</span>}
                  </div>
                </button>
                <div className="flex-1">
                  <div className="text-white font-medium" style={{ textDecoration: item.status === 'concluida' ? 'line-through' : 'none', opacity: item.status === 'concluida' ? 0.6 : 1 }}>
                    {item.titulo}
                  </div>
                  {item.descricao && <div className="text-sm text-slate-400 mt-0.5">{item.descricao}</div>}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cores[item.prioridade] + '22', color: cores[item.prioridade] }}>
                      {labelPrioridade[item.prioridade]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#334155', color: '#94a3b8' }}>
                      {item.tipo}
                    </span>
                    {item.prazo && <span className="text-xs text-slate-500">📅 {item.prazo}</span>}
                  </div>
                </div>
                <button onClick={() => excluir(item.id)} className="text-slate-600 hover:text-red-400 text-lg flex-shrink-0">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6" style={{ background: '#1e293b' }}>
            <h2 className="text-lg font-bold text-white mb-4">Nova Tarefa</h2>
            <form onSubmit={salvar} className="space-y-3">
              <input type="text" placeholder="Título" required value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none" style={{ background: '#0f172a' }} />
              <textarea placeholder="Descrição (opcional)" value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={2} className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none resize-none" style={{ background: '#0f172a' }} />
              <input type="date" placeholder="Prazo" value={form.prazo}
                onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }}>
                  <option value="baixa">Prioridade Baixa</option>
                  <option value="media">Prioridade Média</option>
                  <option value="alta">Prioridade Alta</option>
                </select>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }}>
                  <option value="pessoal">Pessoal</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: '#8b5cf6' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
