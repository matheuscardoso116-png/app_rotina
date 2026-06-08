import axios from 'axios'

const ZAPI_BASE = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`

export async function sendWhatsApp(phone: string, message: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.ZAPI_CLIENT_TOKEN) {
    headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN
  }
  const res = await axios.post(
    `${ZAPI_BASE}/send-text`,
    { phone, message },
    { headers }
  )
  return res.data
}

export function buildRelatorio(data: {
  gastosPessoal: number
  gastosEmpresa: number
  treinos: number
  pendentes: number
  concluidas: number
}) {
  const hoje = new Date().toLocaleDateString('pt-BR')
  return `📊 *Relatório Diário — ${hoje}*

💸 *Gastos Pessoais:* R$ ${data.gastosPessoal.toFixed(2)}
🏢 *Gastos Empresa:* R$ ${data.gastosEmpresa.toFixed(2)}
💪 *Treinos hoje:* ${data.treinos}

✅ *Obrigações:*
  • Pendentes: ${data.pendentes}
  • Concluídas: ${data.concluidas}

Acesse seu app para ver detalhes.`
}
