import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MatchList from '@/components/MatchList'

export default async function RoomPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const roomId = resolvedParams.id;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch room details
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    return <div className="container" style={{ padding: '4rem 2rem' }}>Room not found.</div>
  }

  // Fetch leaderboard
  const { data: members } = await supabase
    .from('room_members')
    .select('total_points, users(display_name)')
    .eq('room_id', roomId)
    .order('total_points', { ascending: false })

  // Fetch matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  // Fetch user's predictions for this room
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .eq('room_id', roomId)

  return (
    <main className="container" style={{ padding: '4rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-solid">{room.name}</h1>
        </div>
        
        <div className="bg-surface" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Invite Code</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--color-wimbledon-lime)' }}>{room.invite_code}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Leaderboard */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-wimbledon-lime)' }}>Leaderboard</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Rank</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Player</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500', textAlign: 'right' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>#{idx + 1}</td>
                  <td style={{ padding: '1rem 0' }}>{member.users?.display_name || 'Anonymous'}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>
                    {member.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Predictions */}
        <MatchList matches={matches || []} initialPredictions={predictions || []} roomId={roomId} />

      </div>
    </main>
  )
}
