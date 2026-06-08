export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import BottomNav from '@/components/BottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0f172a' }}>
      {children}
      <BottomNav />
    </div>
  )
}
