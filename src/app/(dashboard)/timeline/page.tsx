'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Evento {
  id: string
  tipo: string
  descricao: string
  hora_evento: string | null
  valor: number | null
  created_at: string
  mensagem_original: string
}

const TIPO_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  atividade: { icon: '📍', color: '#3b82f6', label: 'Atividade' },
  gasto:     { icon: '💸', color: '#ef4444', label: 'Gasto' },
  treino:    { icon: '💪', color: '#10b981', label: 'Treino' },
  tarefa:    { icon: '✅', color: '#22c55e', label: 'Tarefa' },
  salario:   { icon: '💰', color: '#f59e0b', label: 'Entrada' },
  outro:     { icon: '📝', color: '#64748b', label: 'Outro' },
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5562982590727'

export default function TimelinePage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)
  const [relatorio, setRelatorio] = useState('')
  const [periodo, setPeriodo] = useState<'hoje' | 'mes'>('hoje')
  const supabase = createClient()

  useEffect(() => {
    loadEventos()
  }, [periodo])

  async function loadEventos() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const hoje = format(new Date(), 'yyyy-MM-dd')
    const inicioMes = hoje.substring(0, 7) + '-01'
    const dataInicio = periodo === 'mes' ? inicioMes : hoje

    const { data } = await supabase
      .from('timeline')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dataInicio + 'T00:00:00')
      .order('created_at', { ascending: false })

    setEventos(data ?? [])
    setLoading(false)
  }

  async function gerarRelatorio() {
    setGerandoRelatorio(true)
    setRelatorio('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch(`/api/relatorio?userId=${user.id}&periodo=${periodo}`)
      const json = await res.json()
      setRelatorio(json.relatorio ?? 'Erro ao gerar relatório.')
    } catch {
      setRelatorio('Erro ao gerar relatório. Verifique sua API Key.')
    } finally {
      setGerandoRelatorio(false)
    }
  }

  async function deletarEvento(id: string) {
    await supabase.from('timeline').delete().eq('id', id)
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=`
  const mensagemPre = encodeURIComponent('Olá! Registre: ')

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Linha do Tempo</h1>
        <p className="text-slate-400 text-sm capitalize mt-1">{hoje}</p>
      </div>

      {/* Botão WhatsApp */}
      <a
        href={whatsappUrl + mensagemPre}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-2xl py-4 px-5 mb-5 text-center font-semibold text-white"
        style={{ background: '#25D366' }}
      >
        <span className="text-xl mr-2">📲</span>
        Registrar via WhatsApp
      </a>

      {/* Seletor de período + botão relatório */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setPeriodo('hoje')}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: periodo === 'hoje' ? '#3b82f6' : '#1e293b', color: '#fff' }}
        >
          Hoje
        </button>
        <button
          onClick={() => setPeriodo('mes')}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: periodo === 'mes' ? '#3b82f6' : '#1e293b', color: '#fff' }}
        >
          Este mês
        </button>
        <button
          onClick={gerarRelatorio}
          disabled={gerandoRelatorio}
          className="flex-1 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#8b5cf6', color: '#fff', opacity: gerandoRelatorio ? 0.6 : 1 }}
        >
          {gerandoRelatorio ? '...' : '🤖 IA'}
        </button>
      </div>

      {/* Relatório IA */}
      {relatorio && (
        <div className="rounded-2xl p-4 mb-5 text-sm text-slate-200 whitespace-pre-wrap" style={{ background: '#1e293b', borderLeft: '3px solid #8b5cf6' }}>
          <div className="text-xs text-purple-400 font-semibold mb-2">RELATÓRIO INTELIGENTE</div>
          {relatorio}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="text-center text-slate-500 mt-10">Carregando...</div>
      ) : eventos.length === 0 ? (
        <div className="text-center mt-10">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-400 text-sm">Nenhum evento registrado.</p>
          <p className="text-slate-500 text-xs mt-1">Use o botão acima para registrar via WhatsApp.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((ev, i) => {
            const cfg = TIPO_CONFIG[ev.tipo] ?? TIPO_CONFIG.outro
            const hora = ev.hora_evento
              ? ev.hora_evento.substring(0, 5)
              : format(new Date(ev.created_at), 'HH:mm')
            return (
              <div key={ev.id} className="flex gap-3">
                {/* Linha do tempo */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: cfg.color + '22', color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  {i < eventos.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: '#334155', minHeight: '16px' }} />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 rounded-xl p-3 mb-1" style={{ background: '#1e293b' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-xs text-slate-500 ml-2">{hora}</span>
                      <p className="text-sm text-white mt-1">{ev.descricao}</p>
                      {ev.valor && (
                        <p className="text-sm font-semibold mt-1" style={{ color: ev.tipo === 'salario' ? '#22c55e' : '#ef4444' }}>
                          {ev.tipo === 'salario' ? '+' : '-'}R$ {Number(ev.valor).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deletarEvento(ev.id)}
                      className="text-slate-600 hover:text-red-400 text-xs mt-1 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
