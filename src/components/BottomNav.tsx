'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const mainTabs = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/gastos', label: 'Finanças', icon: '💰' },
  { href: '/timeline', label: 'Timeline', icon: '⏱️' },
  { href: '/obrigacoes', label: 'Tarefas', icon: '✅' },
]

const moreTabs = [
  { href: '/treinos', label: 'Treinos', icon: '💪', color: '#3b82f6' },
  { href: '/calendario', label: 'Calendário', icon: '📅', color: '#8b5cf6' },
  { href: '/chat', label: 'Chat IA', icon: '🤖', color: '#6366f1' },
  { href: '/relatorios', label: 'Relatórios', icon: '📊', color: '#22c55e' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = moreTabs.some(t => pathname === t.href)

  return (
    <>
      {/* Overlay do menu "Mais" */}
      {showMore && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 rounded-3xl p-5"
            style={{ background: '#111827', border: '1px solid #1e293b' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-4 px-1">Mais opções</p>
            <div className="grid grid-cols-4 gap-3">
              {moreTabs.map(tab => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl transition-all"
                  style={{ background: pathname === tab.href ? tab.color + '22' : '#1e293b' }}
                >
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="text-xs font-medium text-slate-300">{tab.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center px-2 pb-safe"
        style={{
          background: 'rgba(10, 15, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: '6px',
        }}
      >
        {mainTabs.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 relative"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#6366f1' }}
                />
              )}
              <span className="text-xl leading-none">{tab.icon}</span>
              <span
                className="text-xs font-medium"
                style={{ color: active ? '#818cf8' : '#475569' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* Botão Mais */}
        <button
          onClick={() => setShowMore(v => !v)}
          className="flex-1 flex flex-col items-center gap-1 py-2 relative"
        >
          {isMoreActive && (
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
              style={{ background: '#6366f1' }}
            />
          )}
          <span className="text-xl leading-none">{showMore ? '✕' : '☰'}</span>
          <span
            className="text-xs font-medium"
            style={{ color: isMoreActive || showMore ? '#818cf8' : '#475569' }}
          >
            Mais
          </span>
        </button>
      </nav>
    </>
  )
}
