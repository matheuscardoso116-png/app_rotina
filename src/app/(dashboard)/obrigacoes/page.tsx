'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import BottomSheet from '@/components/BottomSheet'

interface Obrigacao {
  id: string; titulo: string; descricao?: string; status: 'pendente' | 'concluido';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'; prazo?: string; tipo: string
}

const PRIORIDADES = {
  urgente: { label: 'Urgente', color: '#ff453a', bg: '#ff453a20' },
  alta:    { label: 'Alta',    color: '#ff9f0a', bg: '#ff9f0a20' },
  media:   { label: 'Média',   color: '#6366f1', bg: '#6366f120' },
  baixa:   { label: 'Baixa',   color: '#636366', bg: '#63636620' },
}

const CATS_TAREFAS = [
  { label: 'Pessoal',    value: 'pessoal' },
  { label: 'Empresa',    value: 'empresa' },
  { label: 'Financeiro', value: 'empresa' },
  { label: 'Saúde',      value: 'pessoal' },
  { label: 'Compras',    value: 'pessoal' },
  { label: 'Casa',       value: 'pessoal' },
  { label: 'Outro',      value: 'pessoal' },
]

export default function ObrigacoesPage() {
  const [items, setItems] = useState<Obrigacao[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'concluido'>('todos')
  const [form, setForm] = useState({
    titulo: '', descricao: '', prioridade: 'media', tipo: 'pessoal', tipoLabel: 'Pessoal', prazo: '', status: 'pendente',
  })

  async function load() {
    try {
      const r = await fetch('/api/obrigacoes')
      if (!r.ok) { console.error('obrigacoes load', r.status); setLoading(false); return }
      const data = await r.json()
      if (Array.isArray(data)) setItems(data)
    } catch (e) { console.error('obrigacoes load err', e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/obrigacoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tipoLabel: undefined }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        alert('Erro ao salvar: ' + (err.error ?? `status ${r.status}`))
        return
      }
      setOpen(false)
      setForm({ titulo: '', descricao: '', prioridade: 'media', tipo: 'pessoal', tipoLabel: 'Pessoal', prazo: '', status: 'pendente' })
      await load()
    } catch (e) {
      alert('Erro de rede: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(id: string, status: string) {
    const novo = status === 'pendente' ? 'concluido' : 'pendente'
    await fetch('/api/obrigacoes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: novo }),
    })
    setItems(prev => prev.map(x => x.id === id ? { ...x, status: novo as 'pendente' | 'concluido' } : x))
  }

  async function excluir(id: string) {
    await fetch('/api/obrigacoes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(x => x.id !== id))
  }

  const filtrados = items.filter(x => filtro === 'todos' || x.status === filtro)
  const pendentes = items.filter(x => x.status === 'pendente').length
  const urgentes  = items.filter(x => x.prioridade === 'urgente' && x.status === 'pendente').length

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 40 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Tarefas ✅</h1>
            <p style={{ color: '#8e8e93', fontSize: 13, margin: '2px 0 0' }}>
              {pendentes} pendente{pendentes !== 1 ? 's' : ''}{urgentes > 0 ? ` · ${urgentes} urgente${urgentes !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button onClick={() => setOpen(true)}
            style={{ padding: '9px 18px', background: '#8b5cf6', borderRadius: 12, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            + Nova
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['todos', 'Todas'], ['pendente', '⏳ Pendentes'], ['concluido', '✅ Concluídas']] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setFiltro(val)}
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: filtro === val ? '#8b5cf6' : '#1c1c1e', color: filtro === val ? '#fff' : '#8e8e93' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 16 }} />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#8e8e93' }}>{filtro === 'concluido' ? 'Nenhuma concluída' : 'Sem pendências!'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtrados.map(item => {
              const p = PRIORIDADES[item.prioridade]
              return (
                <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, opacity: item.status === 'concluido' ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                    <button onClick={() => toggleStatus(item.id, item.status)}
                      style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, cursor: 'pointer', background: item.status === 'concluido' ? '#30d158' : 'transparent', border: `2px solid ${item.status === 'concluido' ? '#30d158' : '#48484a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.status === 'concluido' && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 500, fontSize: 15, margin: 0, textDecoration: item.status === 'concluido' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</p>
                    </div>
                    <button onClick={() => excluir(item.id)} style={{ color: '#636366', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 32 }}>
                    <span style={{ background: p.bg, color: p.color, fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.label}</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e93', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{item.tipo === 'pessoal' ? 'Pessoal' : 'Empresa'}</span>
                    {item.prazo && <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e93', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>📅 {format(new Date(item.prazo + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
                  </div>
                  {item.descricao && <p style={{ color: '#8e8e93', fontSize: 13, margin: 0, paddingLeft: 32 }}>{item.descricao}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nova Tarefa">
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="input" type="text" placeholder="Título da tarefa" required
            value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          <textarea className="input" placeholder="Descrição (opcional)" rows={2}
            value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            style={{ resize: 'none', fontSize: 16 }} />

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prioridade</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.entries(PRIORIDADES) as [string, typeof PRIORIDADES['baixa']][]).map(([key, p]) => (
                <button type="button" key={key} onClick={() => setForm(f => ({ ...f, prioridade: key }))}
                  style={{ flex: 1, padding: '9px 4px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: form.prioridade === key ? p.bg : 'rgba(255,255,255,0.05)', border: `1.5px solid ${form.prioridade === key ? p.color : 'transparent'}`, color: form.prioridade === key ? p.color : '#8e8e93' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select className="input" value={form.tipoLabel}
              onChange={e => {
                const found = CATS_TAREFAS.find(c => c.label === e.target.value)
                setForm(f => ({ ...f, tipoLabel: e.target.value, tipo: found?.value ?? 'pessoal' }))
              }}>
              {CATS_TAREFAS.map(c => <option key={c.value + c.label} value={c.label}>{c.label}</option>)}
            </select>
            <input className="input" type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
          </div>

          <button className="btn-primary" type="submit" disabled={saving} style={{ marginBottom: 8 }}>
            {saving ? 'Salvando...' : 'Criar tarefa'}
          </button>
        </form>
      </BottomSheet>
    </div>
  )
}
