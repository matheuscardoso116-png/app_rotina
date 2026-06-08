'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, AuthResponse } from '@supabase/supabase-js'

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then((res: { data: { user: User | null }; error: unknown }) => {
      const user = res.data.user
      if (!user) { router.push('/login'); return }
      setUser(user)
      setNome((user.user_metadata?.nome as string) ?? '')
      setWhatsapp((user.user_metadata?.whatsapp as string) ?? '')
      setEmpresa((user.user_metadata?.empresa as string) ?? '')
    })
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.auth.updateUser({ data: { nome, whatsapp, empresa } })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
    </div>
  )

  const inicial = (nome || user.email || '?')[0].toUpperCase()

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 40 }}>
      {/* Avatar hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          width: 86, height: 86, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 14,
          boxShadow: '0 0 0 4px rgba(99,102,241,0.2)',
        }}>
          {inicial}
        </div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, margin: 0 }}>{nome || 'Sem nome'}</p>
        <p style={{ color: '#636366', fontSize: 13, margin: '4px 0 0' }}>{user.email}</p>
      </div>

      {/* Formulário */}
      <div style={{ padding: '24px 20px' }}>
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Nome completo
            </label>
            <input className="input" type="text" placeholder="Seu nome"
              value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Email
            </label>
            <input className="input" type="email" value={user.email ?? ''} disabled
              style={{ opacity: 0.45, cursor: 'not-allowed' }} />
          </div>

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              WhatsApp
            </label>
            <input className="input" type="tel" inputMode="numeric" placeholder="5562982590727"
              value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            <p style={{ color: '#48484a', fontSize: 11, margin: '6px 0 0' }}>
              Com código do país, sem espaços ou traços
            </p>
          </div>

          <div>
            <label style={{ color: '#8e8e93', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Nome da empresa (opcional)
            </label>
            <input className="input" type="text" placeholder="Ex: Empresa XYZ Ltda"
              value={empresa} onChange={e => setEmpresa(e.target.value)} />
          </div>

          <button className="btn-primary" type="submit" disabled={saving}
            style={{ background: saved ? '#30d158' : undefined, transition: 'background 0.3s' }}>
            {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '28px 0' }} />

        {/* Info do app */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px' }}>
          <p style={{ color: '#8e8e93', fontSize: 12, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Sobre o app</p>
          {[
            { label: 'Versão', val: '1.0.0' },
            { label: 'Plataforma', val: 'PWA · Next.js' },
            { label: 'Conta criada', val: user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—' },
          ].map(x => (
            <div key={x.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#8e8e93', fontSize: 13 }}>{x.label}</span>
              <span style={{ color: '#fff', fontSize: 13 }}>{x.val}</span>
            </div>
          ))}
        </div>

        {/* Sair */}
        <button onClick={sair}
          style={{ width: '100%', marginTop: 20, padding: '16px', background: 'transparent', border: '1px solid rgba(255,69,58,0.35)', borderRadius: 14, color: '#ff453a', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          Sair da conta
        </button>
      </div>
    </div>
  )
}
