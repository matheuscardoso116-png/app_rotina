'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useBodyLock } from '@/hooks/useBodyLock'

const mainTabs = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/gastos', label: 'Finanças', icon: '💰' },
  null, // FAB center
  { href: '/obrigacoes', label: 'Tarefas', icon: '✅' },
  { href: '/timeline', label: 'Timeline', icon: '⏱️' },
]

const quickAdd = [
  { label: 'Gasto', icon: '💸', href: '/gastos', color: '#ef4444' },
  { label: 'Receita', icon: '💰', href: '/gastos', color: '#22c55e' },
  { label: 'Treino', icon: '💪', href: '/treinos', color: '#3b82f6' },
  { label: 'Tarefa', icon: '✅', href: '/obrigacoes', color: '#8b5cf6' },
  { label: 'Atividade', icon: '📍', href: '/timeline', color: '#f59e0b' },
]

const moreTabs = [
  { href: '/treinos', label: 'Treinos', icon: '💪' },
  { href: '/calendario', label: 'Calendário', icon: '📅' },
  { href: '/chat', label: 'Chat IA', icon: '🤖' },
  { href: '/relatorios', label: 'Relatórios', icon: '📊' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [showFab, setShowFab] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const isMoreActive = moreTabs.some(t => pathname === t.href)
  useBodyLock(showFab || showMore)

  return (
    <>
      {/* FAB overlay */}
      {showFab && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowFab(false)}>
          <div className="absolute bottom-24 left-0 right-0 px-6"
            onClick={e => e.stopPropagation()}>
            <div className="rounded-3xl p-4 fade-up" style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-center mb-4" style={{ color: '#8e8e93' }}>O que deseja registrar?</p>
              <div className="grid grid-cols-5 gap-2">
                {quickAdd.map(item => (
                  <Link key={item.label} href={item.href}
                    onClick={() => setShowFab(false)}
                    className="flex flex-col items-center gap-2 py-3 rounded-2xl"
                    style={{ background: item.color + '18' }}>
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium" style={{ color: item.color, fontSize: '11px' }}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mais overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowMore(false)}>
          <div className="absolute bottom-24 left-4 right-4 rounded-3xl p-5 fade-up"
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-xs mb-4" style={{ color: '#8e8e93' }}>MAIS OPÇÕES</p>
            <div className="grid grid-cols-4 gap-3">
              {moreTabs.map(tab => (
                <Link key={tab.href} href={tab.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl"
                  style={{ background: pathname === tab.href ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="text-xs font-medium" style={{ color: '#e5e5ea', fontSize: '11px' }}>{tab.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        }}>
        <div className="flex items-end justify-around px-2 pt-2 pb-1">
          {mainTabs.map((tab, i) => {
            if (!tab) {
              // FAB central
              return (
                <button key="fab" onClick={() => { setShowFab(v => !v); setShowMore(false) }}
                  className="flex flex-col items-center -mt-5"
                  style={{ flex: 1 }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: showFab ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <span className="text-white text-2xl font-light" style={{ lineHeight: 1 }}>
                      {showFab ? '×' : '+'}
                    </span>
                  </div>
                  <span className="text-xs mt-1 font-medium" style={{ color: '#8e8e93', fontSize: '10px' }}>Adicionar</span>
                </button>
              )
            }
            const active = pathname === tab.href
            return (
              <Link key={tab.href} href={tab.href}
                className="flex flex-col items-center py-1 relative"
                style={{ flex: 1 }}
                onClick={() => { setShowFab(false); setShowMore(false) }}>
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: '#6366f1' }} />
                )}
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs mt-0.5 font-medium"
                  style={{ color: active ? '#818cf8' : '#8e8e93', fontSize: '10px' }}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
          {/* Mais */}
          <button onClick={() => { setShowMore(v => !v); setShowFab(false) }}
            className="flex flex-col items-center py-1 relative"
            style={{ flex: 1 }}>
            {isMoreActive && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ background: '#6366f1' }} />
            )}
            <span className="text-xl">{showMore ? '✕' : '☰'}</span>
            <span className="text-xs mt-0.5 font-medium"
              style={{ color: isMoreActive || showMore ? '#818cf8' : '#8e8e93', fontSize: '10px' }}>
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
