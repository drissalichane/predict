'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChannel(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'Channel name is required' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('chat_channels')
    .insert({
      name: name.trim(),
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating channel', error)
    return { error: 'Could not create channel' }
  }

  revalidatePath('/chat')
  return { success: true, channel: data }
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const channelId = formData.get('channelId') as string | null
  const recipientId = formData.get('recipientId') as string | null
  const replyToId = formData.get('replyToId') as string | null

  if (!content || content.trim() === '') {
    return { error: 'Message content is required' }
  }

  if (!channelId && !recipientId) {
    return { error: 'Message must have a target (channel or user)' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const payload: any = {
    content: content.trim(),
    sender_id: user.id,
  }

  if (channelId) payload.channel_id = channelId
  if (recipientId) payload.recipient_id = recipientId
  if (replyToId) payload.reply_to_id = replyToId

  const { error } = await supabase
    .from('chat_messages')
    .insert(payload)

  if (error) {
    console.error('Error sending message', error)
    return { error: 'Could not send message' }
  }

  return { success: true }
}

export async function toggleReaction(messageId: string, emoji: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if reaction exists
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existing) {
    // Remove reaction
    await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id)
  } else {
    // Add reaction
    await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      })
  }

  return { success: true }
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if user owns the message
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('sender_id')
    .eq('id', messageId)
    .single()

  if (!msg || msg.sender_id !== user.id) {
    return { error: 'Not authorized to delete this message' }
  }

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)

  if (error) return { error: 'Could not delete message' }
  return { success: true }
}

export async function getUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: usersData, error } = await supabase
    .from('users')
    .select('id, display_name')
    .neq('id', user.id)

  if (error) return { error: 'Could not fetch users' }

  // Fetch all DMs involving the current user to find the latest activity
  const { data: dms } = await supabase
    .from('chat_messages')
    .select('sender_id, recipient_id, created_at')
    .is('channel_id', null)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

  // Map user ID to latest message timestamp
  const latestMessageMap: Record<string, number> = {}

  if (dms) {
    for (const msg of dms) {
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!otherUserId) continue;
      
      const time = new Date(msg.created_at).getTime()
      if (!latestMessageMap[otherUserId] || time > latestMessageMap[otherUserId]) {
        latestMessageMap[otherUserId] = time
      }
    }
  }

  // Sort users: those with messages first (sorted by latest), then others alphabetically
  const sortedUsers = (usersData || []).sort((a, b) => {
    const timeA = latestMessageMap[a.id] || 0
    const timeB = latestMessageMap[b.id] || 0
    
    if (timeA !== timeB) {
      return timeB - timeA // descending order (latest first)
    }
    
    // Fallback to alphabetical if both have no messages or same timestamp
    return (a.display_name || '').localeCompare(b.display_name || '')
  })

  return { users: sortedUsers }
}

export async function getChannels() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { error: 'Could not fetch channels' }
  return { channels: data }
}
