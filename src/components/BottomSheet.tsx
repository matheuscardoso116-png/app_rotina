'use client'

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const prevent = (e: TouchEvent) => {
      if (sheetRef.current?.contains(e.target as Node)) return
      e.preventDefault()
    }

    // non-passive listener blocks scroll-through on iOS
    document.addEventListener('touchmove', prevent, { passive: false })
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('touchmove', prevent)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={sheetRef}
        className="sheet fade-up"
        style={{ width: '100%' }}
      >
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, margin: '12px auto 20px' }} />
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h2>
            <button onClick={onClose}
              style={{ background: '#2c2c2e', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#8e8e93', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
