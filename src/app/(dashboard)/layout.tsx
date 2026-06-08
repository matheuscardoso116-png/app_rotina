export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import TopNav from '@/components/TopNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100dvh' }}>
      <TopNav />
      {/* Empurra o conteúdo para baixo do TopNav */}
      <div style={{ paddingTop: 'calc(54px + env(safe-area-inset-top, 0px))' }}>
        {children}
      </div>
    </div>
  )
}
