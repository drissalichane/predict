'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function OverallRankingModal({ leaderboard }: { leaderboard: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <button 
        className="btn btn-outline" 
        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap', width: '100%' }}
        onClick={() => setIsOpen(true)}
      >
        View Overall Ranking
      </button>

      {isOpen && mounted && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 16, 0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: 0 }}>Overall Leaderboard</h2>
              <button onClick={() => setIsOpen(false)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Close</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Rank</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Player</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500', textAlign: 'center' }}>Exact</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: '500', textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((member, idx) => (
                  <tr key={member.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>#{idx + 1}</td>
                    <td style={{ padding: '1rem 0' }}>{member.display_name}</td>
                    <td style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{member.exact}</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>{member.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
