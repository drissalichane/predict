import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabaseServer = await createClient()
    await supabaseServer.auth.signOut()
    redirect('/login')
  }

  return (
    <nav style={{ padding: '1rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
        <span className="text-solid">WC</span> Predictions
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/dashboard" style={{ fontSize: '0.9rem' }}>Dashboard</Link>
            <form action={signOut}>
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Sign Out</button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Sign In</Link>
        )}
      </div>
    </nav>
  )
}
