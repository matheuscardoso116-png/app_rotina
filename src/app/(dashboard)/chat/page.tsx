'use client'

import { useEffect, useRef, useState } from 'react'

interface Msg { id?: string; role: 'user' | 'assistant'; conteudo: string; criado_em?: string }

const SUGESTOES = [
  'Como estão meus gastos este mês?',
  'Qual minha frequência de treinos?',
  'Quanto gastei em alimentação?',
  'Faça um resumo da minha semana',
]

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function loadHistory() {
    const r = await fetch('/api/chat')
    setMsgs(await r.json())
    setLoading(false)
  }
  useEffect(() => { loadHistory() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)
    const userMsg: Msg = { role: 'user', conteudo: msg }
    setMsgs(prev => [...prev, userMsg])

    try {
      const r = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: msg }),
      })
      const data = await r.json()
      setMsgs(prev => [...prev, { role: 'assistant', conteudo: data.resposta }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', conteudo: 'Erro ao conectar com a IA. Tente novamente.' }])
    }
    setSending(false)
  }

  async function clearHistory() {
    await fetch('/api/chat', { method: 'DELETE' })
    setMsgs([])
  }

  return (
    <div style={{ background: '#0a0a0a', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header fixo */}
      <div style={{ background: '#0a0a0a', padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Chat IA 🤖</h1>
            <p style={{ color: '#8e8e93', fontSize: 13, margin: '2px 0 0' }}>Assistente com contexto dos seus dados</p>
          </div>
          {msgs.length > 0 && (
            <button onClick={clearHistory}
              style={{ padding: '7px 12px', background: '#2c2c2e', border: 'none', borderRadius: 10, color: '#ff453a', fontSize: 12, cursor: 'pointer' }}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="scroll-native no-scroll-bar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 16 }} />)}
          </div>
        ) : msgs.length === 0 ? (
          <div style={{ paddingTop: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🤖</div>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Olá! Sou sua IA</p>
              <p style={{ color: '#8e8e93', fontSize: 14 }}>Tenho acesso aos seus dados. Pergunte o que quiser!</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUGESTOES.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: '#141414', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, color: '#e5e5ea', fontSize: 14, cursor: 'pointer',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f120', border: '1.5px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? '#6366f1' : '#1c1c1e',
                  border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  color: '#fff', fontSize: 14, lineHeight: 1.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.conteudo}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f120', border: '1.5px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                <div style={{ padding: '12px 16px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#8e8e93', animation: `pulse 1.4s ${j * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input fixo na parte inferior */}
      <div style={{
        flexShrink: 0, padding: '12px 16px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="input no-scroll-bar"
            placeholder="Pergunte algo sobre seus dados..."
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            style={{ resize: 'none', flex: 1, fontSize: 16, minHeight: 50, maxHeight: 120, overflowY: 'auto' }}
          />
          <button onClick={() => send()}
            disabled={!input.trim() || sending}
            style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: !input.trim() || sending ? '#2c2c2e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              transition: 'all 0.2s', color: '#fff',
            }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
