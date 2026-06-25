'use server'

import { createClient } from '@/utils/supabase/server'

export async function getOtherPredictions(matchId: number, roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('predictions')
    .select('*, users(display_name)')
    .eq('match_id', matchId)
    .eq('room_id', roomId)

  if (error) {
    console.error('Error fetching other predictions:', error)
    return { error: 'Failed to load predictions.' }
  }

  return { predictions: data }
}
