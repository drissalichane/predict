import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChatContainer from '@/components/chat/ChatContainer'

export const metadata = {
  title: 'Discussion | World Cup 2026 Predictions',
}

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/chat')
  }

  return (
    <main className="container main-content" style={{ height: 'calc(100vh - 80px)', padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-solid">Discussion</h1>
        </div>
      </div>
      
      <div className="glass-panel" style={{ height: 'calc(100% - 80px)', padding: 0, overflow: 'hidden', display: 'flex' }}>
        <ChatContainer />
      </div>
    </main>
  )
}
