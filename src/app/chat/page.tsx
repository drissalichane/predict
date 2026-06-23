import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChatContainer from '@/components/chat/ChatContainer'

export const metadata = {
  title: 'Discussion | World Cup 2026 Predictions',
}

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{ dm?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const dmUserId = resolvedSearchParams.dm;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/chat${dmUserId ? `?dm=${dmUserId}` : ''}`)
  }

  return (
    <main className="container main-content" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex' }}>
        <ChatContainer initialDmUserId={dmUserId} />
      </div>
    </main>
  )
}
