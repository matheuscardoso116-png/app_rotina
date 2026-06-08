import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedEvent {
  tipo: 'atividade' | 'gasto' | 'treino' | 'tarefa' | 'salario' | 'outro'
  descricao: string
  hora_evento?: string // HH:MM
  valor?: number
}

export async function parseMensagem(mensagem: string): Promise<ParsedEvent> {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 300,
    thinking: { type: 'adaptive' },
    system: `Você é um assistente que extrai informações estruturadas de mensagens em linguagem natural do usuário sobre sua rotina diária.
Responda APENAS com JSON válido, sem texto extra.
Categorias possíveis:
- "atividade": qualquer atividade ou evento do dia (ex: "reunião iniciada", "trabalho começado")
- "gasto": compra ou despesa (ex: "gastei R$50 no mercado")
- "treino": exercício físico (ex: "fiz 30 min de corrida")
- "tarefa": obrigação ou tarefa (ex: "terminei o relatório")
- "salario": recebimento de dinheiro (ex: "recebi meu salário de 5000")
- "outro": qualquer coisa que não se encaixa acima

Formato da resposta:
{
  "tipo": "...",
  "descricao": "descrição curta e clara",
  "hora_evento": "HH:MM ou null",
  "valor": número ou null
}`,
    messages: [{ role: 'user', content: mensagem }],
  })

  const text = msg.content.find(b => b.type === 'text')?.text ?? '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { tipo: 'outro', descricao: mensagem }
  }
}

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
    system: `Você é um assistente pessoal inteligente que analisa dados de rotina, finanças e produtividade.
Gere relatórios em português brasileiro, diretos, com insights reais e dicas práticas.
Use emojis e formatação para WhatsApp (*negrito*, _itálico_).`,
    messages: [
      {
        role: 'user',
        content: `Analise meus dados do ${dados.periodo} e gere um relatório completo com:
1. Resumo financeiro (entradas, gastos, saldo)
2. Análise de desperdícios (gastos que poderiam ser evitados)
3. Resumo de rotina e produtividade
4. 3 dicas práticas personalizadas para melhorar

Dados:
${JSON.stringify(dados, null, 2)}`,
      },
    ],
  })

  const final = await stream.finalMessage()
  return final.content.find(b => b.type === 'text')?.text ?? 'Relatório não disponível.'
}

export async function responderIA(mensagem: string, contexto: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    thinking: { type: 'adaptive' },
    system: `Você é o assistente pessoal do Matheus, um empresário brasileiro.
Responda de forma curta, direta e útil em português brasileiro.
Use linguagem informal mas profissional.
Contexto do usuário: ${contexto}`,
    messages: [{ role: 'user', content: mensagem }],
  })

  return msg.content.find(b => b.type === 'text')?.text ?? 'Entendido!'
}
