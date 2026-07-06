'use client'

import Link from 'next/link'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

export default function NavbarMessagesButton() {
  const { unreadCount } = useUnreadMessages()

  return (
    <Link href="/chat" className="btn btn-outline" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Messages</span>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          background: '#ff2a2a',
          color: 'white',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          borderRadius: '50%',
          minWidth: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
