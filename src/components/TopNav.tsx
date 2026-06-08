'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const NAV = [
  { href: '/',           label: 'Início',     icon: '🏠' },
  { href: '/gastos',     label: 'Finanças',   icon: '💰' },
  { href: '/treinos',    label: 'Treinos',    icon: '💪' },
  { href: '/obrigacoes', label: 'Tarefas',    icon: '✅' },
  { href: '/timeline',   label: 'Timeline',   icon: '⏱️' },
  { href: '/calendario', label: 'Calendário', icon: '📅' },
  { href: '/chat',       label: 'Chat IA',    icon: '🤖' },
  { href: '/relatorios', label: 'Relatórios', icon: '📊' },
]

export default function TopNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const current = NAV.find(x => x.href === pathname)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Top bar fixo */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54, padding: '0 16px' }}>
          {/* Hamburger */}
          <button onClick={() => setOpen(true)}
            style={{ width: 42, height: 42, borderRadius: 12, background: '#1c1c1e', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 2, background: '#aeaeb2', borderRadius: 1 }} />
            <div style={{ width: 18, height: 2, background: '#aeaeb2', borderRadius: 1 }} />
            <div style={{ width: 12, height: 2, background: '#aeaeb2', borderRadius: 1 }} />
          </button>

          {/* Página atual */}
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
            {current ? `${current.icon}  ${current.label}` : 'Minha Rotina'}
          </span>

          {/* Perfil */}
          <Link href="/perfil" onClick={() => setOpen(false)}
            style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, textDecoration: 'none' }}>
            👤
          </Link>
        </div>
      </header>

      {/* Sidebar overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />

          {/* Drawer */}
          <div ref={drawerRef}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 280,
              background: '#111111', borderRight: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              overflowY: 'auto',
            }}>
            {/* Cabeçalho do drawer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Minha Rotina</p>
                <p style={{ color: '#48484a', fontSize: 12, margin: '3px 0 0' }}>seu app pessoal</p>
              </div>
              <button onClick={() => setOpen(false)}
                style={{ background: '#2c2c2e', border: 'none', borderRadius: 10, width: 32, height: 32, color: '#8e8e93', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Itens de navegação */}
            <nav style={{ flex: 1, padding: '12px 12px' }}>
              {NAV.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px',
                      borderRadius: 14, marginBottom: 2, textDecoration: 'none',
                      background: active ? 'rgba(99,102,241,0.14)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    }}>
                    <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ color: active ? '#818cf8' : '#e5e5ea', fontSize: 15, fontWeight: active ? 600 : 400 }}>
                      {item.label}
                    </span>
                    {active && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>›</span>}
                  </Link>
                )
              })}
            </nav>

            {/* Perfil no rodapé do drawer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px 0' }}>
              <Link href="/perfil" onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px',
                  borderRadius: 14, textDecoration: 'none',
                  background: pathname === '/perfil' ? 'rgba(99,102,241,0.14)' : 'transparent',
                  border: `1px solid ${pathname === '/perfil' ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                }}>
                <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>👤</span>
                <span style={{ color: pathname === '/perfil' ? '#818cf8' : '#e5e5ea', fontSize: 15, fontWeight: 400 }}>Perfil</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
