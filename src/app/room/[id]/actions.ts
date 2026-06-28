'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPrediction(formData: FormData) {
  const supabase = await createClient()

  const matchId = parseInt(formData.get('matchId') as string, 10)
  const roomId = formData.get('roomId') as string
  const homeScore = parseInt(formData.get('homeScore') as string, 10)
  const awayScore = parseInt(formData.get('awayScore') as string, 10)

  const etHomeScoreStr = formData.get('etHomeScore') as string
  const etAwayScoreStr = formData.get('etAwayScore') as string
  const psHomeScoreStr = formData.get('psHomeScore') as string
  const psAwayScoreStr = formData.get('psAwayScore') as string

  const etHomeScore = etHomeScoreStr ? parseInt(etHomeScoreStr, 10) : null
  const etAwayScore = etAwayScoreStr ? parseInt(etAwayScoreStr, 10) : null
  const psHomeScore = psHomeScoreStr ? parseInt(psHomeScoreStr, 10) : null
  const psAwayScore = psAwayScoreStr ? parseInt(psAwayScoreStr, 10) : null

  if (isNaN(matchId) || !roomId || isNaN(homeScore) || isNaN(awayScore)) {
    return { error: 'Invalid input' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Security: Check if user is actually a member of this room
  const { data: membership } = await supabase
    .from('room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied: not a member of this room' }
  }

  // Check if match has already started
  const { data: match } = await supabase
    .from('matches')
    .select('kickoff_time')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Match not found' }
  
  const kickoffTime = new Date(match.kickoff_time).getTime()
  if (Date.now() >= kickoffTime) {
    return { error: 'Match has already started' }
  }

  // Upsert prediction
  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      match_id: matchId,
      room_id: roomId,
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      predicted_et_home_score: etHomeScore,
      predicted_et_away_score: etAwayScore,
      predicted_ps_home_score: psHomeScore,
      predicted_ps_away_score: psAwayScore
    }, {
      onConflict: 'user_id,match_id,room_id'
    })

  if (error) {
    console.error('Error saving prediction', error)
    return { error: 'Could not save prediction' }
  }

  revalidatePath(`/room/${roomId}`)
  return { success: true }
}
