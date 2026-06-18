'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export type ChatChannel = {
  id: string
  name: string
  created_at: string
}

export type ChatMessage = {
  id: string
  channel_id: string | null
  sender_id: string
  recipient_id: string | null
  content: string
  reply_to_id: string | null
  created_at: string
  users?: { display_name: string } // sender info
  message_reactions?: MessageReaction[]
}

export type MessageReaction = {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

export function useChatRealtime(activeChannelId: string | null, activeRecipientId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUser(user.id)
    }
    fetchUser()
  }, [])

  // Initial fetch for channels
  useEffect(() => {
    const fetchChannels = async () => {
      const { data } = await supabase.from('chat_channels').select('*').order('created_at', { ascending: true })
      if (data) setChannels(data)
    }
    fetchChannels()
  }, [])

  // Initial fetch for messages when active context changes
  useEffect(() => {
    if (!currentUser) return;

    const fetchMessages = async () => {
      setIsLoading(true)
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          message_reactions(*)
        `)
        .order('created_at', { ascending: true })

      if (activeChannelId) {
        query = query.eq('channel_id', activeChannelId)
      } else if (activeRecipientId) {
        // Fetch DMs between current user and recipient
        query = query.is('channel_id', null).or(`and(sender_id.eq.${currentUser},recipient_id.eq.${activeRecipientId}),and(sender_id.eq.${activeRecipientId},recipient_id.eq.${currentUser})`)
      } else {
        setMessages([])
        setIsLoading(false)
        return
      }

      const { data, error } = await query
      if (data) {
        // Fetch all unique users for these messages
        const userIds = [...new Set(data.map((m: any) => m.sender_id))]
        const { data: usersData } = await supabase.from('users').select('id, display_name').in('id', userIds)
        
        const messagesWithUsers = data.map((msg: any) => ({
          ...msg,
          users: usersData?.find((u: any) => u.id === msg.sender_id)
        }))
        setMessages(messagesWithUsers as any)
      } else {
        console.error('Fetch messages error:', error)
      }
      setIsLoading(false)
    }

    fetchMessages()
  }, [activeChannelId, activeRecipientId, currentUser])

  // Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const channelName = `chat_realtime_${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel(channelName)

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_channels' }, (payload) => {
        setChannels((prev) => [...prev, payload.new as ChatChannel])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        // Fetch sender info for the new message
        const { data: senderData } = await supabase.from('users').select('display_name').eq('id', payload.new.sender_id).single()
        const newMsg = { ...payload.new, users: senderData, message_reactions: [] } as ChatMessage
        
        setMessages((prev) => {
          // Only add if it belongs to current view
          if (activeChannelId && newMsg.channel_id === activeChannelId) return [...prev, newMsg]
          if (activeRecipientId && !newMsg.channel_id && 
             ((newMsg.sender_id === currentUser && newMsg.recipient_id === activeRecipientId) || 
              (newMsg.sender_id === activeRecipientId && newMsg.recipient_id === currentUser))) {
            return [...prev, newMsg]
          }
          return prev
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => prev.map(msg => {
            if (msg.id === payload.new.message_id) {
              return { ...msg, message_reactions: [...(msg.message_reactions || []), payload.new as MessageReaction] }
            }
            return msg
          }))
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.map(msg => {
            if (msg.id === payload.old.message_id) {
              return { ...msg, message_reactions: (msg.message_reactions || []).filter(r => r.id !== payload.old.id) }
            }
            return msg
          }))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannelId, activeRecipientId, currentUser])

  return { messages, channels, isLoading, currentUser }
}
