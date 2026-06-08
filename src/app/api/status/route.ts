import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const vars = {
    NEXT_PUBLIC_SUPABASE_URL:      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:     !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY:             !!process.env.ANTHROPIC_API_KEY,
    ZAPI_INSTANCE_ID:              !!process.env.ZAPI_INSTANCE_ID,
    ZAPI_TOKEN:                    !!process.env.ZAPI_TOKEN,
    ZAPI_CLIENT_TOKEN:             !!process.env.ZAPI_CLIENT_TOKEN,
    WHATSAPP_NUMBER:               process.env.WHATSAPP_NUMBER ?? 'não configurado',
  }

  // Testa conexão com Supabase
  let supabaseOk = false
  let supabaseError = ''
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data, error } = await sb.auth.admin.listUsers({ perPage: 1 })
    supabaseOk = !error && Array.isArray(data?.users)
    if (error) supabaseError = error.message
  } catch (e) {
    supabaseError = String(e)
  }

  const allVarsSet = Object.values(vars).every(v => v !== false && v !== 'não configurado')

  return NextResponse.json({
    ok: allVarsSet && supabaseOk,
    vars,
    supabase: supabaseOk ? 'conectado' : `erro: ${supabaseError}`,
    ts: new Date().toISOString(),
  })
}
