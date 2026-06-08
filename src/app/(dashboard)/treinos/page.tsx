'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Treino {
  id: string
  tipo: string
  duracao_min: number
  observacoes: string
  data: string
}

const tiposTreino = ['Musculação', 'Corrida', 'Ciclismo', 'Natação', 'Futebol', 'Crossfit', 'Yoga', 'Caminhada', 'Outro']

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ tipo: 'Musculação', duracao_min: '', observacoes: '', data: format(new Date(), 'yyyy-MM-dd') })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/treinos')
    setTreinos(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/treinos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, duracao_min: parseInt(form.duracao_min) || null }),
    })
    setOpen(false)
    setForm({ tipo: 'Musculação', duracao_min: '', observacoes: '', data: format(new Date(), 'yyyy-MM-dd') })
    await load()
    setSaving(false)
  }

  async function excluir(id: string) {
    await fetch('/api/treinos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setTreinos(t => t.filter(x => x.id !== id))
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Treinos 💪</h1>
        <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#10b981' }}>
          + Novo
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 mt-10">Carregando...</div>
      ) : treinos.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">Nenhum treino registrado</div>
      ) : (
        <div className="space-y-3">
          {treinos.map(t => (
            <div key={t.id} className="rounded-2xl p-4" style={{ background: '#1e293b' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">💪 {t.tipo}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t.duracao_min ? `${t.duracao_min} min · ` : ''}{t.data}
                  </div>
                  {t.observacoes && <div className="text-sm text-slate-300 mt-1">{t.observacoes}</div>}
                </div>
                <button onClick={() => excluir(t.id)} className="text-slate-600 hover:text-red-400 text-lg ml-3">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6" style={{ background: '#1e293b' }}>
            <h2 className="text-lg font-bold text-white mb-4">Novo Treino</h2>
            <form onSubmit={salvar} className="space-y-3">
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }}>
                {tiposTreino.map(t => <option key={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Duração (min)" value={form.duracao_min}
                onChange={e => setForm(f => ({ ...f, duracao_min: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none" style={{ background: '#0f172a' }} />
              <textarea placeholder="Observações (opcional)" value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none resize-none" style={{ background: '#0f172a' }} />
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#0f172a' }} />
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: '#10b981' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
