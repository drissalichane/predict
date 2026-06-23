import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileTabs from '@/components/profile/ProfileTabs'

export default async function ProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const profileUserId = resolvedParams.id;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/profile/${profileUserId}`)
  }

  // Fetch profile user
  const { data: profileUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', profileUserId)
    .single()

  if (userError || !profileUser) {
    return <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>User not found.</div>
  }

  // Fetch stats for all rooms this user is in
  const { data: allRoomsStats } = await supabase
    .from('room_members')
    .select('room_id, total_points, exact_scores')
    .eq('user_id', profileUserId)

  const statsMap = new Map()
  if (allRoomsStats) {
    for (const stat of allRoomsStats) {
      statsMap.set(stat.room_id, {
        total_points: stat.total_points || 0,
        exact_scores: stat.exact_scores || 0
      })
    }
  }

  // Fetch rooms for current user
  const { data: myRooms } = await supabase
    .from('room_members')
    .select('room_id, rooms(name)')
    .eq('user_id', user.id)

  // Fetch rooms for profile user
  const { data: theirRooms } = await supabase
    .from('room_members')
    .select('room_id, rooms(name)')
    .eq('user_id', profileUserId)

  // Find common rooms
  const myRoomIds = myRooms?.map(r => r.room_id) || []
  const commonRoomsData = theirRooms?.filter(r => myRoomIds.includes(r.room_id)) || []
  
  const commonRooms = commonRoomsData.map(r => {
    const stats = statsMap.get(r.room_id) || { total_points: 0, exact_scores: 0 }
    return {
      id: r.room_id,
      name: (r.rooms as any)?.name || 'Unknown Room',
      total_points: stats.total_points,
      exact_scores: stats.exact_scores
    }
  })

  const commonRoomIds = commonRooms.map(r => r.id)

  // Fetch past predictions in common rooms
  let predictions: any[] = []
  if (commonRoomIds.length > 0) {
    const { data: preds } = await supabase
      .from('predictions')
      .select('*, matches(*)')
      .eq('user_id', profileUserId)
      .in('room_id', commonRoomIds)
    
    if (preds) {
      // Filter for finished matches only
      predictions = preds.filter(p => p.matches && p.matches.status === 'FINISHED')
    }
  }

  const isSelf = user.id === profileUserId

  return (
    <main className="container main-content" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
          {/* Avatar Placeholder */}
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--color-wimbledon-lime), #4ade80)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            color: '#000',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {profileUser.display_name?.charAt(0).toUpperCase() || '?'}
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <h1 className="text-solid" style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>
              {profileUser.display_name}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Joined Predictions
            </p>
          </div>

          {!isSelf && (
            <div style={{ flexShrink: 0, width: '100%', maxWidth: '200px' }}>
              <Link href={`/chat?dm=${profileUserId}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', width: '100%', borderRadius: 'var(--radius-md)' }}>
                <span>💬</span> Message
              </Link>
            </div>
          )}
        </div>

        <ProfileTabs rooms={commonRooms} predictions={predictions} />
      </div>
    </main>
  )
}
