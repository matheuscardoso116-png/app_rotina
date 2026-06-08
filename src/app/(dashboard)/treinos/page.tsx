'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import BottomSheet from '@/components/BottomSheet'

interface Treino {
  id: string; tipo: string; duracao_min: number | null; observacoes: string | null; grupos_musculares: string; data: string
}

const GRUPOS = [
  { id: 'Peito',    icon: '🫀', color: '#ef4444' },
  { id: 'Costas',   icon: '🏋️', color: '#3b82f6' },
  { id: 'Bíceps',   icon: '💪', color: '#f59e0b' },
  { id: 'Tríceps',  icon: '🦾', color: '#8b5cf6' },
  { id: 'Ombros',   icon: '🤸', color: '#06b6d4' },
  { id: 'Pernas',   icon: '🦵', color: '#10b981' },
  { id: 'Glúteo',   icon: '⬛', color: '#ec4899' },
  { id: 'Abdômen',  icon: '⚡', color: '#f97316' },
  { id: 'Cardio',   icon: '🏃', color: '#22c55e' },
  { id: 'Funcional',icon: '🔥', color: '#6366f1' },
]

const TIPOS = ['Musculação', 'Corrida', 'Ciclismo', 'Natação', 'Crossfit', 'Yoga', 'Caminhada', 'Futebol', 'Outro']

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: 'Musculação', duracao_min: '', observacoes: '',
    grupos: [] as string[], data: format(new Date(), 'yyyy-MM-dd'),
  })

  async function load() {
    const r = await fetch('/api/treinos')
    setTreinos(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleGrupo(g: string) {
    setForm(f => ({ ...f, grupos: f.grupos.includes(g) ? f.grupos.filter(x => x !== g) : [...f.grupos, g] }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/treinos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, duracao_min: parseInt(form.duracao_min) || null, grupos_musculares: form.grupos.join(',') }),
    })
    setOpen(false)
    setForm({ tipo: 'Musculação', duracao_min: '', observacoes: '', grupos: [], data: format(new Date(), 'yyyy-MM-dd') })
    await load(); setSaving(false)
  }

  async function excluir(id: string) {
    await fetch('/api/treinos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setTreinos(t => t.filter(x => x.id !== id))
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 40 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Treinos 💪</h1>
          <p style={{ color: '#8e8e93', fontSize: 13, margin: '2px 0 0' }}>{treinos.length} registros</p>
        </div>
        <button onClick={() => setOpen(true)}
          style={{ padding: '9px 18px', background: '#3b82f6', borderRadius: 12, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          + Novo
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
          </div>
        ) : treinos.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
            <p style={{ color: '#8e8e93' }}>Nenhum treino registrado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {treinos.map(t => {
              const grupos = t.grupos_musculares?.split(',').filter(Boolean) ?? []
              return (
                <div key={t.id} className="list-item" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-circle" style={{ background: 'rgba(59,130,246,0.2)', fontSize: 20 }}>💪</div>
                      <div>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>{t.tipo}</p>
                        <p style={{ color: '#8e8e93', fontSize: 12, margin: '2px 0 0' }}>
                          {format(new Date(t.data + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
                          {t.duracao_min ? ` · ${t.duracao_min} min` : ''}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => excluir(t.id)} style={{ color: '#636366', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>×</button>
                  </div>
                  {grupos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {grupos.map(g => {
                        const gr = GRUPOS.find(x => x.id === g)
                        return (
                          <span key={g} style={{ background: (gr?.color ?? '#64748b') + '22', color: gr?.color ?? '#94a3b8', fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
                            {gr?.icon} {g}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {t.observacoes && <p style={{ color: '#8e8e93', fontSize: 13, margin: 0 }}>{t.observacoes}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Novo Treino">
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Grupos musculares</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GRUPOS.map(g => {
                const sel = form.grupos.includes(g.id)
                return (
                  <button type="button" key={g.id} onClick={() => toggleGrupo(g.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: sel ? g.color + '30' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${sel ? g.color : 'transparent'}`, color: sel ? g.color : '#8e8e93' }}>
                    {g.icon} {g.id}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input" type="number" inputMode="numeric" placeholder="Duração (min)"
              value={form.duracao_min} onChange={e => setForm(f => ({ ...f, duracao_min: e.target.value }))} />
            <input className="input" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>

          <textarea className="input" placeholder="Observações (ex: supino 80kg 4x10)" rows={2}
            value={form.observacoes ?? ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            style={{ resize: 'none', fontSize: 16 }} />

          <button className="btn-primary" type="submit" disabled={saving} style={{ marginBottom: 8 }}>
            {saving ? 'Salvando...' : 'Salvar treino'}
          </button>
        </form>
      </BottomSheet>
    </div>
  )
}
