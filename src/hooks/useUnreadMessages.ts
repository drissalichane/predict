'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

// Create a global event emitter for sync between hooks across the app
// This is a simple way to sync state without React Context if we use the hook in multiple places
const UNREAD_STATE_EVENT = 'unread_state_changed'

let globalUnreadCount = 0;
let globalLastReadAt = 0;
let isInitialized = false;

// Initialize once
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('chat_last_read_at')
  if (stored) {
    globalLastReadAt = parseInt(stored, 10)
  } else {
    globalLastReadAt = Date.now()
    localStorage.setItem('chat_last_read_at', globalLastReadAt.toString())
  }
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UNREAD_STATE_EVENT, { detail: globalUnreadCount }))
  }
}

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const supabase = createClient()
  const pathname = usePathname()

  // Track if chat is currently considered "open"
  // For the sake of this hook, if we are on /chat, it's always open.
  // The drawer open state will be handled by calling markAsRead() manually from the drawer.
  const isChatPage = pathname === '/chat'

  useEffect(() => {
    const handleSync = (e: any) => {
      setUnreadCount(e.detail)
    }
    window.addEventListener(UNREAD_STATE_EVENT, handleSync)
    return () => window.removeEventListener(UNREAD_STATE_EVENT, handleSync)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user.id)

      if (!isInitialized) {
        isInitialized = true
        
        // 1. Initial fetch of missed messages since lastReadAt
        const lastReadIso = new Date(globalLastReadAt).toISOString()
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', user.id)
          .gt('created_at', lastReadIso)
        
        if (count && count > 0) {
          globalUnreadCount = count
          emitChange()
        }

        // 2. Subscribe to new messages
        const channelName = `chat_unread_${Math.random().toString(36).substring(7)}`
        const channel = supabase.channel(channelName)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
            if (payload.new.sender_id !== user.id) {
              // Note: We don't automatically mark as read here if they are on /chat, 
              // because if they are on /chat, we let the chat component call markAsRead()
              // But actually, if they are on /chat, we should probably just not increment it?
              // Let's rely on markAsRead being called frequently or when opened.
              globalUnreadCount += 1
              emitChange()
            }
          })
          .subscribe()
      }
    }

    init()
  }, [])

  // If we are on the chat page, continuously mark as read
  useEffect(() => {
    if (isChatPage) {
      markAsRead()
    }
  }, [isChatPage, unreadCount]) // Dependency on unreadCount ensures it keeps marking as read if new msgs arrive

  const markAsRead = () => {
    globalUnreadCount = 0
    globalLastReadAt = Date.now()
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_last_read_at', globalLastReadAt.toString())
    }
    emitChange()
  }

  return { unreadCount, markAsRead }
}
