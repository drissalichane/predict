'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ChatContainer from './ChatContainer'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { unreadCount, markAsRead } = useUnreadMessages()

  const handleToggle = () => {
    if (!isOpen) {
      markAsRead()
    }
    setIsOpen(!isOpen)
  }

  // Auto-close if we navigate to the actual chat page
  useEffect(() => {
    if (pathname === '/chat' && isOpen) {
      setIsOpen(false)
    }
  }, [pathname, isOpen])

  // Don't show the floating button on the chat page itself
  if (pathname === '/chat') return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#fff',
          color: '#000',
          border: '3px solid #000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          zIndex: 1000,
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-12px',
              background: '#ff2a2a',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* Slide-out Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '650px',
        maxWidth: '90vw',
        height: '100vh',
        background: 'var(--color-background)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
      }}>
        {/* Header Bar for Sidebar */}
        <div style={{ 
          background: '#000', 
          padding: '1rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>Discussion</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => { setIsOpen(false); router.push('/chat'); }} 
              title="Enlarge to full page"
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', color: 'white', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              ⤢ Expand
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              title="Close"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ChatContainer />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  )
}
