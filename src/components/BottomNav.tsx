'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/timeline', label: 'Timeline', icon: '⏱️' },
  { href: '/gastos', label: 'Gastos', icon: '💸' },
  { href: '/treinos', label: 'Treinos', icon: '💪' },
  { href: '/obrigacoes', label: 'Tarefas', icon: '✅' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t" style={{ background: '#1e293b', borderColor: '#334155' }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center py-3 gap-1 transition-colors"
            style={{ color: active ? '#3b82f6' : '#64748b' }}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
