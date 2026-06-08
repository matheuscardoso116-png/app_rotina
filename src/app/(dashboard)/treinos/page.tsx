'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Treino {
  id: string
  tipo: string
  duracao_min: number | null
  observacoes: string | null
  grupos_musculares: string
  data: string
}

const GRUPOS = [
  { id: 'Peito', icon: '🫀' }, { id: 'Costas', icon: '🏋️' },
  { id: 'Bíceps', icon: '💪' }, { id: 'Tríceps', icon: '🦾' },
  { id: 'Ombros', icon: '🤸' }, { id: 'Pernas', icon: '🦵' },
  { id: 'Glúteo', icon: '⬛' }, { id: 'Abdômen', icon: '⚡' },
  { id: 'Cardio', icon: '🏃' }, { id: 'Funcional', icon: '🔥' },
]

const TIPOS = ['Musculação', 'Corrida', 'Ciclismo', 'Natação', 'Crossfit', 'Yoga', 'Caminhada', 'Futebol', 'Outro']

const GRUPOS_CORES: Record<string, string> = {
  Peito: '#ef4444', Costas: '#3b82f6', Bíceps: '#f59e0b', Tríceps: '#8b5cf6',
  Ombros: '#06b6d4', Pernas: '#10b981', Glúteo: '#ec4899', Abdômen: '#f97316',
  Cardio: '#22c55e', Funcional: '#6366f1',
}

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: 'Musculação', duracao_min: '', observacoes: '',
    grupos_musculares: [] as string[], data: format(new Date(), 'yyyy-MM-dd'),
  })

  async function load() {
    const res = await fetch('/api/treinos')
    setTreinos(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function toggleGrupo(g: string) {
    setForm(f => ({
      ...f,
      grupos_musculares: f.grupos_musculares.includes(g)
        ? f.grupos_musculares.filter(x => x !== g)
        : [...f.grupos_musculares, g],
    }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/treinos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        duracao_min: parseInt(form.duracao_min) || null,
        grupos_musculares: form.grupos_musculares.join(','),
      }),
    })
    setOpen(false)
    setForm({ tipo: 'Musculação', duracao_min: '', observacoes: '', grupos_musculares: [], data: format(new Date(), 'yyyy-MM-dd') })
    await load()
    setSaving(false)
  }

  async function excluir(id: string) {
    await fetch('/api/treinos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setTreinos(t => t.filter(x => x.id !== id))
  }

  return (
    <div className="pb-24" style={{ background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: '#111827', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Treinos 💪</h1>
            <p className="text-slate-400 text-sm mt-0.5">{treinos.length} registros</p>
          </div>
          <button onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#3b82f6' }}>
            + Novo
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-3">
        {loading ? (
          <div className="text-center text-slate-500 mt-20">Carregando...</div>
        ) : treinos.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-slate-400">Nenhum treino registrado</p>
          </div>
        ) : (
          treinos.map(t => {
            const grupos = t.grupos_musculares ? t.grupos_musculares.split(',').filter(Boolean) : []
            return (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: '#111827', border: '1px solid #1e293b' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{t.tipo}</span>
                      {t.duracao_min && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-blue-300" style={{ background: '#1e3a5f' }}>
                          {t.duracao_min} min
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{format(new Date(t.data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</p>

                    {grupos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {grupos.map(g => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: (GRUPOS_CORES[g] ?? '#475569') + '22', color: GRUPOS_CORES[g] ?? '#94a3b8' }}>
                            {GRUPOS.find(x => x.id === g)?.icon} {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {t.observacoes && <p className="text-sm text-slate-400 mt-2">{t.observacoes}</p>}
                  </div>
                  <button onClick={() => excluir(t.id)} className="text-slate-600 hover:text-red-400 text-xl flex-shrink-0">×</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 overflow-y-auto" style={{ background: '#111827', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Novo Treino</h2>
              <button onClick={() => setOpen(false)} className="text-slate-500 text-2xl">×</button>
            </div>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">Tipo de treino</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#1e293b' }}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">Grupos musculares trabalhados</label>
                <div className="grid grid-cols-5 gap-2">
                  {GRUPOS.map(g => {
                    const sel = form.grupos_musculares.includes(g.id)
                    return (
                      <button type="button" key={g.id} onClick={() => toggleGrupo(g.id)}
                        className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                        style={{
                          background: sel ? (GRUPOS_CORES[g.id] ?? '#6366f1') + '33' : '#1e293b',
                          border: `1px solid ${sel ? (GRUPOS_CORES[g.id] ?? '#6366f1') : 'transparent'}`,
                        }}>
                        <span className="text-lg">{g.icon}</span>
                        <span className="text-xs text-slate-300" style={{ fontSize: '10px' }}>{g.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 block">Duração (min)</label>
                  <input type="number" placeholder="60" value={form.duracao_min}
                    onChange={e => setForm(f => ({ ...f, duracao_min: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 outline-none" style={{ background: '#1e293b' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 block">Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#1e293b' }} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">Observações</label>
                <textarea placeholder="Ex: Fiz 4 séries de supino, PR novo..." value={form.observacoes ?? ''}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 outline-none resize-none" style={{ background: '#1e293b' }} />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{ background: '#3b82f6' }}>
                {saving ? 'Salvando...' : 'Salvar treino'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
