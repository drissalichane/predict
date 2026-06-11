'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRoom(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Insert room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ name, owner_id: user.id })
    .select()
    .single()

  if (roomError) {
    console.error('Error creating room', roomError)
    return { error: 'Failed to create room' }
  }

  // Insert owner as a room member
  const { error: memberError } = await supabase
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id })

  if (memberError) {
    console.error('Error adding owner to room members', memberError)
  }

  revalidatePath('/dashboard')
  redirect(`/room/${room.id}`)
}

export async function joinRoom(formData: FormData) {
  const supabase = await createClient()
  const inviteCode = formData.get('inviteCode') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Find room by invite code
  const { data: room, error: findError } = await supabase
    .from('rooms')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (findError || !room) {
    return { error: 'Invalid invite code' }
  }

  // Add user to room members
  const { error: joinError } = await supabase
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id })

  // Ignore error if already a member (unique constraint violation)
  if (joinError && joinError.code !== '23505') {
    return { error: 'Failed to join room' }
  }

  revalidatePath('/dashboard')
  redirect(`/room/${room.id}`)
}
