'use client'

import { useState } from 'react'
import { leaveRoom } from '@/app/dashboard/actions'

export default function LeaveRoomButton({ roomId, iconOnly = false }: { roomId: string, iconOnly?: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <button 
        type="button" 
        className={iconOnly ? "" : "btn btn-danger"} 
        style={iconOnly ? { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' } : { padding: '0.5rem 1.5rem' }}
        onClick={() => setShowConfirm(true)}
        title="Leave Room"
        onMouseOver={(e) => iconOnly && (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => iconOnly && (e.currentTarget.style.transform = 'scale(1)')}
      >
        {iconOnly ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
          </svg>
        ) : "Leave"}
      </button>

      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-panel" style={{
            padding: '2.5rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)'
          }}>
            <h3 style={{ color: 'var(--color-wimbledon-lime)', marginBottom: '1rem' }}>Leave Room?</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Are you sure you want to leave this room? Your predictions will be preserved but you will lose access to the leaderboard until you are invited back.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowConfirm(false)}
                style={{ padding: '0.5rem 1.5rem' }}
              >
                Cancel
              </button>
              <form action={leaveRoom as any}>
                <input type="hidden" name="roomId" value={roomId} />
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  Confirm
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
