'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBodyLock } from '@/hooks/useBodyLock'

interface Obrigacao {
  id: string; titulo: string; descricao?: string; status: 'pendente' | 'concluido';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'; prazo?: string; categoria: string
}

const PRIORIDADES = {
  urgente: { label: 'Urgente', color: '#ff453a', bg: '#ff453a20' },
  alta:    { label: 'Alta',    color: '#ff9f0a', bg: '#ff9f0a20' },
  media:   { label: 'Média',   color: '#6366f1', bg: '#6366f120' },
  baixa:   { label: 'Baixa',   color: '#636366', bg: '#63636620' },
}

const CATS_TAREFAS = ['Pessoal', 'Empresa', 'Financeiro', 'Saúde', 'Compras', 'Casa', 'Outro']

export default function ObrigacoesPage() {
  const [items, setItems] = useState<Obrigacao[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'concluido'>('todos')
  const [form, setForm] = useState({
    titulo: '', descricao: '', prioridade: 'media', categoria: 'Pessoal',
    prazo: '', status: 'pendente',
  })

  useBodyLock(open)

  async function load() {
    const r = await fetch('/api/obrigacoes')
    setItems(await r.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/obrigacoes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({ titulo: '', descricao: '', prioridade: 'media', categoria: 'Pessoal', prazo: '', status: 'pendente' })
    await load(); setSaving(false)
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
  const urgentes = items.filter(x => x.prioridade === 'urgente' && x.status === 'pendente').length

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#0a0a0a', padding: '52px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Tarefas ✅</h1>
            <p style={{ color: '#8e8e93', fontSize: 13, margin: '2px 0 0' }}>
              {pendentes} pendente{pendentes !== 1 ? 's' : ''}{urgentes > 0 ? ` · ${urgentes} urgente${urgentes !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button onClick={() => setOpen(true)}
            style={{ padding: '9px 18px', background: '#8b5cf6', borderRadius: 12, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            + Nova
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([['todos', 'Todas'], ['pendente', '⏳ Pendentes'], ['concluido', '✅ Concluídas']] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setFiltro(val)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: filtro === val ? '#8b5cf6' : '#1c1c1e', color: filtro === val ? '#fff' : '#8e8e93',
              }}>
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
            <p style={{ color: '#8e8e93' }}>{filtro === 'todos' ? 'Nenhuma tarefa' : filtro === 'concluido' ? 'Nenhuma tarefa concluída' : 'Sem pendências!'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtrados.map(item => {
              const p = PRIORIDADES[item.prioridade]
              return (
                <div key={item.id} className="list-item"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, opacity: item.status === 'concluido' ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                    <button onClick={() => toggleStatus(item.id, item.status)}
                      style={{
                        width: 24, height: 24, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                        background: item.status === 'concluido' ? '#30d158' : 'transparent',
                        border: `2px solid ${item.status === 'concluido' ? '#30d158' : '#48484a'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {item.status === 'concluido' && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: '#fff', fontWeight: 500, fontSize: 15, margin: 0,
                        textDecoration: item.status === 'concluido' ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{item.titulo}</p>
                    </div>

                    <button onClick={() => excluir(item.id)}
                      style={{ color: '#636366', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>×</button>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 32 }}>
                    <span style={{ background: p.bg, color: p.color, fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.label}</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e93', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{item.categoria}</span>
                    {item.prazo && (
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e93', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>
                        📅 {format(new Date(item.prazo + 'T12:00:00'), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  {item.descricao && (
                    <p style={{ color: '#8e8e93', fontSize: 13, margin: 0, paddingLeft: 32 }}>{item.descricao}</p>
                  )}
                </div>
              )
            })}
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
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Nova Tarefa</h2>
                <button onClick={() => setOpen(false)}
                  style={{ background: '#2c2c2e', border: 'none', borderRadius: 20, width: 30, height: 30, color: '#8e8e93', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>

              <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input className="input" type="text" placeholder="Título da tarefa" required
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />

                <textarea className="input" placeholder="Descrição (opcional)" rows={2}
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  style={{ resize: 'none', fontSize: 16 }} />

                {/* Prioridade */}
                <div>
                  <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prioridade</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(Object.entries(PRIORIDADES) as [string, typeof PRIORIDADES['baixa']][]).map(([key, p]) => (
                      <button type="button" key={key} onClick={() => setForm(f => ({ ...f, prioridade: key }))}
                        style={{
                          flex: 1, padding: '9px 4px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: form.prioridade === key ? p.bg : 'rgba(255,255,255,0.05)',
                          border: `1.5px solid ${form.prioridade === key ? p.color : 'transparent'}`,
                          color: form.prioridade === key ? p.color : '#8e8e93',
                        }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {CATS_TAREFAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input className="input" type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
                </div>

                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Criar tarefa'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
