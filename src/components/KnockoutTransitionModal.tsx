'use client'

import { useState, useEffect, useRef } from 'react'
import { triggerConfetti } from '@/utils/confetti'

export default function KnockoutTransitionModal({ leaderboard }: { leaderboard: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [podiumDismissed, setPodiumDismissed] = useState(false)
  const [globalPodiumVisible, setGlobalPodiumVisible] = useState(false)

  // Use a ref to access the latest isOpen state inside the event listener
  const isOpenRef = useRef(isOpen)
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    const handleConfetti = () => {
      if (isOpenRef.current) {
        setPodiumDismissed(true)
      } else {
        setGlobalPodiumVisible(true)
        setTimeout(() => {
          setGlobalPodiumVisible(false)
        }, 4000)
      }
    }
    window.addEventListener('confetti-triggered', handleConfetti as any)
    return () => window.removeEventListener('confetti-triggered', handleConfetti as any)
  }, [])

  useEffect(() => {
    setMounted(true)
    const viewCountStr = localStorage.getItem('knockoutTransitionViewCount')
    const viewCount = viewCountStr ? parseInt(viewCountStr, 10) : 0

    if (viewCount < 2) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        localStorage.setItem('knockoutTransitionViewCount', (viewCount + 1).toString())
        
        triggerConfetti(false)

      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!mounted) return null
  if (!leaderboard || leaderboard.length === 0) return null

  const firstPlace = leaderboard[0]
  const secondPlace = leaderboard.length > 1 ? leaderboard[1] : null
  const thirdPlace = leaderboard.length > 2 ? leaderboard[2] : null
  const restOfLeaderboard = leaderboard.slice(3)

  const podiumContent = (
    <>
      {/* 2nd Place */}
      {secondPlace && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', minWidth: '80px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: 'var(--color-text-primary)' }}>
            {secondPlace.display_name}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {secondPlace.points} pts
          </div>
          <div style={{
            width: '100%', height: '80px',
            background: 'linear-gradient(to top, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.8))',
            borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', borderTop: '2px solid silver'
          }}>2</div>
        </div>
      )}

      {/* 1st Place */}
      {firstPlace && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', minWidth: '100px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-wimbledon-lime)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
            👑 {firstPlace.display_name}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            {firstPlace.points} pts
          </div>
          <div style={{
            width: '100%', height: '120px',
            background: 'linear-gradient(to top, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.8))',
            borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: '#fff', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', borderTop: '2px solid gold'
          }}>1</div>
        </div>
      )}

      {/* 3rd Place */}
      {thirdPlace && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', minWidth: '80px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: 'var(--color-text-primary)' }}>
            {thirdPlace.display_name}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {thirdPlace.points} pts
          </div>
          <div style={{
            width: '100%', height: '60px',
            background: 'linear-gradient(to top, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.8))',
            borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '2px solid #CD7F32'
          }}>3</div>
        </div>
      )}
    </>
  )

  return (
    <>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 16, 0.95)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '1rem', backdropFilter: 'blur(8px)', overflowY: 'auto'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '700px',
            position: 'relative',
            maxHeight: '95vh',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
            transform: 'scale(0.9)'
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
              aria-label="Close"
            >
              &times;
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem', flexShrink: 0 }}>
              <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>🎉Group Stage Complete!🎉</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
                The group stage has ended. Here are the top performers!
              </p>
            </div>

            {/* Modal Podium */}
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              height: '180px', marginBottom: '2rem', gap: '0.5rem', flexShrink: 0,
              transition: 'transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 1s ease',
              transform: podiumDismissed ? 'translateY(-100px)' : 'translateY(0)',
              opacity: podiumDismissed ? 0 : 1,
              pointerEvents: podiumDismissed ? 'none' : 'auto'
            }}>
              {podiumContent}
            </div>

            {/* Scrollable Leaderboard */}
            {restOfLeaderboard.length > 0 && (
              <div style={{
                flex: 1, minHeight: '180px', overflowY: 'auto', marginBottom: '1.5rem',
                background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '0.5rem'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {restOfLeaderboard.map((member: any, idx: number) => (
                      <tr key={member.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', width: '40px' }}>
                          #{idx + 4}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)' }}>{member.display_name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>
                          {member.points} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rules Section */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)',
              padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-wimbledon-lime)', flexShrink: 0
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>Welcome to the Knockout Stage! ⚔️</h3>
              <ul style={{ color: 'var(--color-text-secondary)', margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>Points Reset:</strong> All points have been reset to 0 for a fresh start! Group stage points are preserved on the Group Stage Leaderboard.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>90-Min Predictions:</strong> Your score predictions are for the regular 90 minutes.</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>No Draws:</strong> If you predict a draw, you'll have to complete the prediction by picking who will advance.</li>
                <li><strong>Extra Bonuses:</strong> There is a bonus if you get the progression method and advancing team right!</li>
              </ul>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', fontWeight: 'bold', flexShrink: 0 }}
            >
              Let's Go!
            </button>
          </div>
        </div>
      )}

      {/* Global Floating Podium */}
      <div style={{
        position: 'fixed',
        bottom: globalPodiumVisible ? '20%' : '-300px',
        left: '50%',
        transform: `translateX(-50%) ${globalPodiumVisible ? 'scale(1.2)' : 'scale(0.5)'}`,
        transition: 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: globalPodiumVisible ? 1 : 0,
        zIndex: 9998,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        pointerEvents: 'none',
        background: 'rgba(5, 5, 16, 0.95)',
        padding: '1.5rem 2.5rem 2rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: 'var(--color-wimbledon-lime)', 
          textTransform: 'uppercase', 
          letterSpacing: '2px', 
          fontSize: '1.2rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          Group Stage Podium
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', height: '180px' }}>
          {podiumContent}
        </div>
      </div>
    </>
  )
}
