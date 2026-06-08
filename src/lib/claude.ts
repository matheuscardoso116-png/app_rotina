import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ParsedEvent {
  tipo: 'atividade' | 'gasto' | 'treino' | 'tarefa' | 'salario' | 'outro'
  descricao: string
  hora_evento?: string
  valor?: number
}

export interface RespostaWA {
  acao: 'gasto' | 'treino' | 'tarefa' | 'salario' | 'atividade' | 'consulta' | 'relatorio' | 'nenhuma'
  dados: {
    descricao?: string
    valor?: number
    categoria?: string
    tipo?: string
    grupos_musculares?: string
    prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  }
  resposta: string // mensagem formatada para WhatsApp
}

export interface ContextoUsuario {
  totalGastosMes: number
  totalReceitasMes: number
  saldo: number
  gastosPorCategoria: Record<string, number>
  qtTreinosMes: number
  diasTreinados: string[]
  tarefasPendentes: Array<{ titulo: string; prioridade: string }>
  ultimosGastos: Array<{ descricao: string; valor: number; categoria: string; data: string }>
  ultimosTreinos: Array<{ tipo: string; data: string }>
  hoje: string
  mesNome: string
}

// ─── Assistente WhatsApp (função principal) ───────────────────────────────────

export async function assistenteWhatsApp(
  mensagem: string,
  ctx: ContextoUsuario
): Promise<RespostaWA> {
  const sistema = `Você é o assistente pessoal do Matheus no WhatsApp. Você gerencia finanças, treinos e tarefas dele.

DADOS ATUAIS (${ctx.mesNome}):
- Gastos: R$ ${ctx.totalGastosMes.toFixed(2)}
- Receitas: R$ ${ctx.totalReceitasMes.toFixed(2)}
- Saldo: R$ ${ctx.saldo.toFixed(2)}
- Por categoria: ${JSON.stringify(ctx.gastosPorCategoria)}
- Treinos no mês: ${ctx.qtTreinosMes}x (${ctx.diasTreinados.slice(-5).join(', ')})
- Tarefas pendentes (${ctx.tarefasPendentes.length}): ${ctx.tarefasPendentes.slice(0, 5).map(t => `"${t.titulo}" [${t.prioridade}]`).join(', ')}
- Últimos gastos: ${ctx.ultimosGastos.slice(0, 5).map(g => `${g.descricao} R$${g.valor} (${g.categoria})`).join(' | ')}
- Últimos treinos: ${ctx.ultimosTreinos.slice(0, 3).map(t => `${t.tipo} em ${t.data}`).join(' | ')}
- Hoje: ${ctx.hoje}

REGRAS:
1. Responda em português informal, use emojis, formate para WhatsApp (*negrito*, _itálico_)
2. Se o usuário pede REGISTRAR algo → acao: gasto/treino/tarefa/salario/atividade + confirme na resposta
3. Se o usuário CONSULTA dados → acao: consulta + responda com dados reais
4. Se pede RELATÓRIO/RESUMO → acao: relatorio + gere relatório completo formatado para WhatsApp
5. Conversa normal → acao: nenhuma
6. Para gastos, detecte categoria: Alimentação/Transporte/Moradia/Saúde/Lazer/Educação/Fornecedor/Funcionário/Marketing/Outros
7. Para treinos, detecte grupos musculares se mencionados: Peito/Costas/Bíceps/Tríceps/Ombros/Pernas/Glúteo/Abdômen/Cardio/Funcional
8. Para tarefas, detecte prioridade: urgente/alta/media/baixa

Responda APENAS com JSON válido:
{
  "acao": "gasto|treino|tarefa|salario|atividade|consulta|relatorio|nenhuma",
  "dados": {
    "descricao": "texto descritivo",
    "valor": 0,
    "categoria": "Alimentação",
    "tipo": "Musculação",
    "grupos_musculares": "Peito,Bíceps",
    "prioridade": "media"
  },
  "resposta": "mensagem formatada para WhatsApp"
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      system: sistema,
      messages: [{ role: 'user', content: mensagem }],
    })

    const text = msg.content.find(b => b.type === 'text')?.text ?? '{}'
    // extrai JSON mesmo se vier dentro de ```json ... ```
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no json')
    return JSON.parse(jsonMatch[0]) as RespostaWA
  } catch (err) {
    console.error('[claude] erro ao parsear resposta:', err)
    return {
      acao: 'nenhuma',
      dados: {},
      resposta: '🤔 Não entendi bem. Pode repetir de outra forma?\n\nExemplos:\n• "Gastei R$50 no mercado"\n• "Fiz treino de peito"\n• "Me lembra de ligar pro contador"\n• "Manda meu relatório do mês"',
    }
  }
}

// ─── Parser simples (mantido para compatibilidade) ────────────────────────────

export async function parseMensagem(mensagem: string): Promise<ParsedEvent> {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 300,
    thinking: { type: 'adaptive' },
    system: `Extraia informações de mensagens de rotina. Responda APENAS com JSON:
{"tipo":"gasto|treino|tarefa|salario|atividade|outro","descricao":"texto","hora_evento":"HH:MM|null","valor":null}`,
    messages: [{ role: 'user', content: mensagem }],
  })
  const text = msg.content.find(b => b.type === 'text')?.text ?? '{}'
  try {
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
  } catch {
    return { tipo: 'outro', descricao: mensagem }
  }
}

// ─── Relatório e Chat IA ──────────────────────────────────────────────────────

export async function gerarRelatorioIA(dados: {
  timeline: Array<{ tipo: string; descricao: string; hora_evento: string | null; valor: number | null; created_at: string }>
  gastos: Array<{ descricao: string; valor: number; tipo: string; data: string }>
  treinos: Array<{ atividade: string; duracao_min: number; data: string }>
  salarios: Array<{ descricao: string; valor: number; data: string }>
  periodo: string
}): Promise<string> {
  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    thinking: { type: 'adaptive' },
    system: `Você é um assistente pessoal que analisa dados de rotina, finanças e produtividade.
Gere relatórios em português brasileiro, diretos, com insights reais e dicas práticas.
Use emojis e formatação para WhatsApp (*negrito*, _itálico_).`,
    messages: [{
      role: 'user',
      content: `Analise meus dados do ${dados.periodo} e gere um relatório completo:\n${JSON.stringify(dados, null, 2)}`,
    }],
  })
  const final = await stream.finalMessage()
  return final.content.find(b => b.type === 'text')?.text ?? 'Relatório indisponível.'
}

export async function responderIA(mensagem: string, contexto: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    thinking: { type: 'adaptive' },
    system: `Você é o assistente pessoal do Matheus, empresário brasileiro.
Responda curto, direto e útil em português informal.
Contexto: ${contexto}`,
    messages: [{ role: 'user', content: mensagem }],
  })
  return msg.content.find(b => b.type === 'text')?.text ?? 'Entendido!'
}
