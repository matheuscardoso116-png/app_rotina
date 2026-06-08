'use client'

import { useEffect, useRef, useState } from 'react'

interface Mensagem { id: string; role: 'user' | 'assistant'; conteudo: string; created_at: string }

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/chat').then(r => r.json()).then(d => { setMensagens(d); setLoading(false) })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || enviando) return
    const texto = input.trim()
    setInput('')
    setEnviando(true)

    const tempUser: Mensagem = { id: 'tmp-u', role: 'user', conteudo: texto, created_at: new Date().toISOString() }
    const tempBot: Mensagem = { id: 'tmp-b', role: 'assistant', conteudo: '...', created_at: new Date().toISOString() }
    setMensagens(m => [...m, tempUser, tempBot])

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: texto }),
    })
    const { resposta } = await res.json()

    setMensagens(m => m.filter(x => x.id !== 'tmp-b' && x.id !== 'tmp-u'))
    await fetch('/api/chat').then(r => r.json()).then(setMensagens)
    setEnviando(false)
  }

  async function limparChat() {
    if (!confirm('Limpar todo o histórico?')) return
    await fetch('/api/chat', { method: 'DELETE' })
    setMensagens([])
  }

  const sugestoes = [
    'Como estão meus gastos este mês?',
    'Que tarefas tenho urgentes?',
    'Dicas para melhorar minha produtividade',
    'Resumo dos meus treinos',
  ]

  return (
    <div className="flex flex-col pb-20" style={{ background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex-shrink-0" style={{ background: '#111827', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              🤖
            </div>
            <div>
              <p className="text-white font-semibold">Assistente IA</p>
              <p className="text-xs text-green-400">● Online · Claude Opus</p>
            </div>
          </div>
          <button onClick={limparChat} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg" style={{ background: '#1e293b' }}>
            Limpar
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 mt-20">Carregando...</div>
        ) : mensagens.length === 0 ? (
          <div className="flex flex-col items-center mt-10 px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              🤖
            </div>
            <p className="text-white font-semibold text-center">Olá, Matheus!</p>
            <p className="text-slate-400 text-sm text-center mt-2">Seu assistente pessoal. Tenho acesso a seus gastos, tarefas e treinos. Como posso ajudar?</p>
            <div className="mt-6 w-full space-y-2">
              {sugestoes.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-slate-300 transition-colors"
                  style={{ background: '#111827', border: '1px solid #1e293b' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((msg, i) => (
            <div key={msg.id + i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  🤖
                </div>
              )}
              <div
                className="max-w-xs rounded-2xl px-4 py-3 text-sm"
                style={{
                  background: msg.role === 'user' ? '#4f46e5' : '#111827',
                  color: '#fff',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  border: msg.role === 'assistant' ? '1px solid #1e293b' : 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.conteudo === '...' ? (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : msg.conteudo}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2" style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #1e293b' }}>
        <form onSubmit={enviar} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte algo ao seu assistente..."
            disabled={enviando}
            className="flex-1 px-4 py-3 rounded-xl text-white placeholder-slate-600 outline-none text-sm disabled:opacity-50"
            style={{ background: '#1e293b' }}
          />
          <button type="submit" disabled={enviando || !input.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: '#4f46e5' }}>
            <span className="text-lg">↑</span>
          </button>
        </form>
      </div>
    </div>
  )
}
