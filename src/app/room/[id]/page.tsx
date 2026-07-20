import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MatchList from '@/components/MatchList'
import LeaveRoomButton from '@/components/LeaveRoomButton'
import GroupStageModal from '@/components/GroupStageModal'
import OverallRankingModal from '@/components/OverallRankingModal'
import TournamentWinnersModal from '@/components/TournamentWinnersModal'
import { joinRoomById } from '@/app/dashboard/actions'

export default async function RoomPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ welcome?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const roomId = resolvedParams.id;
  const supabase = await createClient()

  // Fetch room details first so we can display its name in the welcome screens
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    return <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>Room not found.</div>
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem' }} className="text-solid">You're Invited!</h2>
          <p style={{ color: 'var(--color-text-primary)', marginBottom: '2.5rem', fontSize: '1.2rem' }}>
            You've been invited to join the <strong>{room.name}</strong> prediction room.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <Link href={`/login?redirect=/room/${roomId}`} className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              Log in to my account
            </Link>
            <Link href={`/signup?redirect=/room/${roomId}`} className="btn btn-purple" style={{ width: '100%', maxWidth: '300px', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is a member of this room
  const { data: membership, error: membershipError } = await supabase
    .from('room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem' }} className="text-solid">Join Room</h2>
          <p style={{ color: 'var(--color-text-primary)', marginBottom: '2.5rem', fontSize: '1.2rem' }}>
            You're authenticated and ready! Click below to officially join <strong>{room.name}</strong> and make your predictions.
          </p>
          
          <form action={joinRoomById}>
            <input type="hidden" name="roomId" value={roomId} />
            <button type="submit" className="btn btn-purple" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)' }}>
              Join Room Now
            </button>
          </form>
        </div>
      </div>
    )
  }


  // Fetch leaderboard
  const { data: members } = await supabase
    .from('room_members')
    .select('user_id, total_points, exact_scores, knockout_points, knockout_exact_scores, previous_rank, knockout_previous_rank, users(display_name)')
    .eq('room_id', roomId)
    .order('knockout_points', { ascending: false })

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

  // Fetch all predictions for Group Stage calculation
  const { data: allPredictions } = await supabase
    .from('predictions')
    .select(`
      user_id,
      points_earned,
      predicted_home_score,
      predicted_away_score,
      matches!inner ( kickoff_time, home_score, away_score, status )
    `)
    .eq('room_id', roomId)

  const groupStageLeaderboard = members?.map((m: any) => {
    let groupPoints = 0;
    let groupExact = 0;

    const userPreds = allPredictions?.filter(p => p.user_id === m.user_id) || [];
    for (const p of userPreds) {
      const match = p.matches as any;
      if (!match) continue;

      const d = new Date(new Date(match.kickoff_time).getTime() - 6 * 60 * 60 * 1000)
      const month = d.getMonth() + 1
      const day = d.getDate()
      const isGroupStage = month === 6 && day <= 27
      
      if (isGroupStage) {
        groupPoints += p.points_earned || 0;
        if (match.status === 'FINISHED' || process.env.TEST_SCORING === 'true') {
           if (match.home_score !== null && match.away_score !== null) {
              if (p.predicted_home_score === match.home_score && p.predicted_away_score === match.away_score) {
                 groupExact += 1;
              }
           }
        }
      }
    }
    
    return {
      user_id: m.user_id,
      display_name: m.users?.display_name || 'Anonymous',
      points: parseFloat(groupPoints.toFixed(2)),
      exact: groupExact
    }
  }).sort((a, b) => b.points - a.points) || [];

  const overallLeaderboard = members?.map((m: any) => {
    const groupData = groupStageLeaderboard.find((g: any) => g.user_id === m.user_id)
    const groupPoints = groupData?.points || 0
    const groupExact = groupData?.exact || 0
    const knockoutPoints = m.knockout_points || 0
    const knockoutExact = m.knockout_exact_scores || 0
    
    return {
      user_id: m.user_id,
      display_name: m.users?.display_name || 'Anonymous',
      points: parseFloat((groupPoints + knockoutPoints).toFixed(2)),
      exact: groupExact + knockoutExact
    }
  }).sort((a, b) => b.points - a.points) || [];

  return (
    <main className="container main-content">
      <TournamentWinnersModal leaderboard={members || []} />
      {resolvedSearchParams?.welcome === 'true' && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(163, 193, 56, 0.1)', border: '1px solid var(--color-wimbledon-lime)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <div>
            <h3 style={{ color: 'var(--color-wimbledon-lime)', marginBottom: '0.25rem' }}>Welcome to {room.name}!</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>You've successfully joined the room. Submit your predictions before kickoff!</p>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-solid">{room.name}</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="bg-surface" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Invite Code</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--color-wimbledon-lime)' }}>{room.invite_code}</p>
          </div>
          <LeaveRoomButton roomId={roomId} />
        </div>
      </div>

      <div className="room-grid">
        
        {/* Leaderboard */}
        <div className="glass-panel glass-panel-sm sticky-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: 0, lineHeight: 1.1 }}>Knockout Leaderboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <GroupStageModal leaderboard={groupStageLeaderboard} />
              <OverallRankingModal leaderboard={overallLeaderboard} />
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Rank</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Player</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500', textAlign: 'center' }}>Exact</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500', textAlign: 'right' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member: any, idx: number) => {
                const currentRank = idx + 1;
                const previousRank = member.knockout_previous_rank;
                
                let rankChangeIndicator = <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>-</span>;
                
                if (previousRank) {
                  if (previousRank > currentRank) {
                     rankChangeIndicator = <span style={{ color: '#4ade80', fontSize: '0.8rem', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', fontWeight: 'normal' }} title={`Up from #${previousRank}`}>↑ {previousRank - currentRank}</span>;
                  } else if (previousRank < currentRank) {
                     rankChangeIndicator = <span style={{ color: '#f87171', fontSize: '0.8rem', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', fontWeight: 'normal' }} title={`Down from #${previousRank}`}>↓ {currentRank - previousRank}</span>;
                  }
                }

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>
                      #{currentRank}
                      {rankChangeIndicator}
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <Link href={`/profile/${member.user_id}`} style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }} className="hover-underline">
                        {member.users?.display_name || 'Anonymous'}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      {member.knockout_exact_scores || 0}
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>
                      {member.knockout_points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Predictions */}
        <MatchList matches={matches || []} initialPredictions={predictions || []} roomId={roomId} />

      </div>
    </main>
  )
}
