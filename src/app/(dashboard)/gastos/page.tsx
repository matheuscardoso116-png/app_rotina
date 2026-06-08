'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import BottomSheet from '@/components/BottomSheet'

interface Gasto {
  id: string; descricao: string; valor: number; categoria: string; tipo: 'pessoal' | 'empresa'; data: string
}

const CATS = [
  { label: 'Alimentação', icon: '🍔', color: '#f59e0b' },
  { label: 'Transporte',  icon: '🚗', color: '#3b82f6' },
  { label: 'Moradia',     icon: '🏠', color: '#8b5cf6' },
  { label: 'Saúde',       icon: '💊', color: '#10b981' },
  { label: 'Lazer',       icon: '🎮', color: '#ec4899' },
  { label: 'Educação',    icon: '📚', color: '#06b6d4' },
  { label: 'Fornecedor',  icon: '📦', color: '#f97316' },
  { label: 'Funcionário', icon: '👤', color: '#6366f1' },
  { label: 'Marketing',   icon: '📣', color: '#84cc16' },
  { label: 'Outros',      icon: '💼', color: '#64748b' },
]
const getC = (l: string) => CATS.find(c => c.label === l) ?? CATS[9]

function downloadCSV(g: Gasto[]) {
  const csv = ['Descrição,Valor,Categoria,Tipo,Data', ...g.map(x => `"${x.descricao}",${x.valor},"${x.categoria}","${x.tipo}","${x.data}"`)].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
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
  const [form, setForm] = useState({
    descricao: '', valor: '', categoria: 'Alimentação', tipo: 'pessoal',
    data: format(new Date(), 'yyyy-MM-dd'),
  })

  async function load() {
    try {
      const r = await fetch('/api/gastos')
      if (!r.ok) { console.error('gastos load', r.status); setLoading(false); return }
      const data = await r.json()
      if (Array.isArray(data)) setGastos(data)
    } catch (e) { console.error('gastos load err', e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/gastos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor) }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        alert('Erro ao salvar: ' + (err.error ?? `status ${r.status}`))
        return
      }
      setOpen(false)
      setForm({ descricao: '', valor: '', categoria: 'Alimentação', tipo: 'pessoal', data: format(new Date(), 'yyyy-MM-dd') })
      await load()
    } catch (e) {
      alert('Erro de rede: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  async function excluir(id: string) {
    await fetch('/api/gastos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setGastos(g => g.filter(x => x.id !== id))
  }

  const filtrados = gastos.filter(g => filtro === 'todos' || g.tipo === filtro).filter(g => !catFiltro || g.categoria === catFiltro)
  const total    = filtrados.reduce((s, g) => s + Number(g.valor), 0)
  const pessoal  = gastos.filter(g => g.tipo === 'pessoal').reduce((s, g) => s + Number(g.valor), 0)
  const empresa  = gastos.filter(g => g.tipo === 'empresa').reduce((s, g) => s + Number(g.valor), 0)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Finanças</h1>
            <p style={{ color: '#8e8e93', fontSize: 13, margin: '2px 0 0' }}>
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => downloadCSV(filtrados)}
              style={{ padding: '8px 12px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#8e8e93', fontSize: 13, cursor: 'pointer' }}>
              ⬇️ CSV
            </button>
            <button onClick={() => setOpen(true)}
              style={{ padding: '8px 16px', background: '#6366f1', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              + Novo
            </button>
          </div>
        </div>

        {/* Totais */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Total',   val: total,   color: '#ff453a' },
            { label: 'Pessoal', val: pessoal, color: '#ff9f0a' },
            { label: 'Empresa', val: empresa, color: '#bf5af2' },
          ].map(x => (
            <div key={x.label} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ color: '#8e8e93', fontSize: 11 }}>{x.label}</div>
              <div style={{ color: x.color, fontWeight: 700, fontSize: 16, marginTop: 2 }}>R$ {x.val.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Filtro tipo */}
        <div className="no-scroll-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
          {(['todos', 'pessoal', 'empresa'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: filtro === f ? '#6366f1' : '#1c1c1e', color: filtro === f ? '#fff' : '#8e8e93' }}>
              {f === 'todos' ? 'Todos' : f === 'pessoal' ? '👤 Pessoal' : '🏢 Empresa'}
            </button>
          ))}
        </div>

        {/* Filtro categoria */}
        <div className="no-scroll-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          <button onClick={() => setCatFiltro('')}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: !catFiltro ? 'rgba(99,102,241,0.2)' : '#141414', color: !catFiltro ? '#818cf8' : '#8e8e93' }}>
            Todas
          </button>
          {CATS.map(c => (
            <button key={c.label} onClick={() => setCatFiltro(catFiltro === c.label ? '' : c.label)}
              style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', background: catFiltro === c.label ? c.color + '22' : '#141414', border: `1px solid ${catFiltro === c.label ? c.color : 'rgba(255,255,255,0.07)'}`, color: catFiltro === c.label ? c.color : '#8e8e93' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
            <p style={{ color: '#8e8e93' }}>Nenhum gasto encontrado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtrados.map(g => {
              const cat = getC(g.categoria)
              return (
                <div key={g.id} className="list-item" style={{ gap: 12 }}>
                  <div className="icon-circle" style={{ background: cat.color + '20', fontSize: 22 }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontWeight: 500, fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descricao}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{ background: cat.color + '20', color: cat.color, fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{g.categoria}</span>
                      <span style={{ color: '#8e8e93', fontSize: 11 }}>{format(new Date(g.data + 'T12:00:00'), 'dd/MM')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 8 }}>
                    <span style={{ color: '#ff453a', fontWeight: 700, fontSize: 15 }}>- R$ {Number(g.valor).toFixed(2)}</span>
                    <button onClick={() => excluir(g.id)} style={{ color: '#636366', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Novo Gasto">
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="input" type="text" placeholder="Ex: Almoço no restaurante" required
            value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />

          <input className="input" type="number" inputMode="decimal" placeholder="Valor (R$)" required
            value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Categoria</label>
            <div className="no-scroll-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {CATS.map(c => (
                <button type="button" key={c.label} onClick={() => setForm(f => ({ ...f, categoria: c.label }))}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: form.categoria === c.label ? c.color + '30' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${form.categoria === c.label ? c.color : 'transparent'}`, color: form.categoria === c.label ? c.color : '#8e8e93' }}>
                  <span>{c.icon}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="pessoal">👤 Pessoal</option>
              <option value="empresa">🏢 Empresa</option>
            </select>
            <input className="input" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>

          <button className="btn-primary" type="submit" disabled={saving} style={{ marginBottom: 8 }}>
            {saving ? 'Salvando...' : 'Salvar gasto'}
          </button>
        </form>
      </BottomSheet>
    </div>
  )
}
