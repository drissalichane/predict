'use client'

import { useState } from 'react'

export default function SignOutButton({ signOutAction }: { signOutAction: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <button 
        className="btn btn-outline" 
        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
        onClick={() => setShowConfirm(true)}
      >
        Sign Out
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
            <h3 style={{ color: 'var(--color-wimbledon-lime)', marginBottom: '1rem' }}>Sign Out?</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Are you sure you want to sign out? You will need to log back in to access your dashboard and predictions.
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
              <form action={signOutAction}>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
