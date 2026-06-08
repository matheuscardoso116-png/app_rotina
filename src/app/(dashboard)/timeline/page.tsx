'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimelineItem {
  id: string; titulo: string; descricao?: string; tipo: string; hora: string
}

const TIPOS_TL = [
  { id: 'trabalho',  icon: '💼', color: '#6366f1', label: 'Trabalho' },
  { id: 'reuniao',   icon: '🤝', color: '#3b82f6', label: 'Reunião' },
  { id: 'refeicao',  icon: '🍽️', color: '#f59e0b', label: 'Refeição' },
  { id: 'exercicio', icon: '🏃', color: '#10b981', label: 'Exercício' },
  { id: 'lazer',    icon: '🎮', color: '#ec4899', label: 'Lazer' },
  { id: 'saude',    icon: '💊', color: '#06b6d4', label: 'Saúde' },
  { id: 'outro',    icon: '📍', color: '#8e8e93', label: 'Outro' },
]
const getTipo = (t: string) => TIPOS_TL.find(x => x.id === t) ?? TIPOS_TL[6]

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '', descricao: '', tipo: 'trabalho',
    hora: format(new Date(), 'HH:mm'),
  })

  async function load() {
    const r = await fetch('/api/timeline')
    setItems(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/timeline', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({ titulo: '', descricao: '', tipo: 'trabalho', hora: format(new Date(), 'HH:mm') })
    await load(); setSaving(false)
  }

  async function excluir(id: string) {
    await fetch('/api/timeline', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#0a0a0a', padding: '52px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Timeline ⏱️</h1>
            <p style={{ color: '#8e8e93', fontSize: 13, margin: '2px 0 0' }}>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button onClick={() => setOpen(true)}
            style={{ padding: '9px 18px', background: '#f59e0b', borderRadius: 12, color: '#000', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            + Registrar
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
            <p style={{ color: '#8e8e93' }}>Nenhuma atividade hoje</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 27, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)', zIndex: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {items.map((item) => {
                const tipo = getTipo(item.tipo)
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 16, position: 'relative' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                      background: tipo.color + '20', border: `2px solid ${tipo.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{tipo.icon}</div>

                    <div style={{ flex: 1, background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ color: '#fff', fontWeight: 500, fontSize: 15, margin: 0 }}>{item.titulo}</p>
                          <p style={{ color: tipo.color, fontSize: 12, margin: '2px 0 0', fontWeight: 500 }}>
                            {item.hora?.substring(0, 5)} · {tipo.label}
                          </p>
                        </div>
                        <button onClick={() => excluir(item.id)}
                          style={{ color: '#636366', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>×</button>
                      </div>
                      {item.descricao && <p style={{ color: '#8e8e93', fontSize: 13, margin: '6px 0 0' }}>{item.descricao}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet" style={{ width: '100%' }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '12px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Registrar Atividade</h2>
                <button onClick={() => setOpen(false)}
                  style={{ background: '#2c2c2e', border: 'none', borderRadius: 20, width: 30, height: 30, color: '#8e8e93', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>

              <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input className="input" type="text" placeholder="O que fez?" required
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />

                <div>
                  <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tipo</label>
                  <div className="no-scroll-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {TIPOS_TL.map(t => (
                      <button type="button" key={t.id} onClick={() => setForm(f => ({ ...f, tipo: t.id }))}
                        style={{
                          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                          padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                          background: form.tipo === t.id ? t.color + '30' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${form.tipo === t.id ? t.color : 'transparent'}`,
                          color: form.tipo === t.id ? t.color : '#8e8e93',
                        }}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input className="input" type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
                  <textarea className="input" placeholder="Obs (opcional)" rows={1}
                    value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    style={{ resize: 'none', fontSize: 16 }} />
                </div>

                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Registrar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
