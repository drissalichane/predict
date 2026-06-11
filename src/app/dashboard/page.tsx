import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createRoom, joinRoom } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's rooms
  const { data: memberships } = await supabase
    .from('room_members')
    .select('rooms(id, name, invite_code), total_points')
    .eq('user_id', user.id)

  return (
    <main className="container" style={{ padding: '4rem 2rem' }}>
      <h1 className="text-solid" style={{ marginBottom: '2rem' }}>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Rooms List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-wimbledon-lime)' }}>My Rooms</h2>
          
          {!memberships || memberships.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>You haven&apos;t joined any rooms yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {memberships.map((rm: any) => (
                <li key={rm.rooms?.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-wimbledon-lime)' }}>{rm.rooms?.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Invite Code: <span style={{ letterSpacing: '1px', color: 'white' }}>{rm.rooms?.invite_code}</span></p>
                    </div>
                    <Link href={`/room/${rm.rooms?.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', textDecoration: 'none' }}>
                      Enter
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Create Room */}
          <div className="bg-surface" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create a New Room</h3>
            <form action={createRoom as any} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                name="name" 
                type="text" 
                placeholder="Room Name (e.g. Office Pool)" 
                required 
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }} 
              />
              <button className="btn btn-primary">Create Room</button>
            </form>
          </div>

          {/* Join Room */}
          <div className="bg-surface" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Join a Room</h3>
            <form action={joinRoom as any} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                name="inviteCode" 
                type="text" 
                placeholder="Enter Invite Code" 
                required 
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }} 
              />
              <button className="btn btn-purple">Join Room</button>
            </form>
          </div>

        </div>
      </div>
    </main>
  )
}
