'use client'

import { useState, useEffect, useRef } from 'react'
import { triggerConfetti } from '@/utils/confetti'

export default function TournamentWinnersModal({ leaderboard }: { leaderboard: any[] }) {
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
    
    // Always show since the tournament is over!
    const timer = setTimeout(() => {
      setIsOpen(true)
      triggerConfetti(false) // Trigger confetti without dismissing the modal podium immediately
    }, 1200)
    
    return () => clearTimeout(timer)
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', minWidth: '80px', animation: 'slideUp 1s ease-out 0.3s backwards' }}>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: '#E0E0E0', textShadow: '0 0 10px rgba(192,192,192,0.5)' }}>
            {secondPlace.users?.display_name || secondPlace.display_name || 'Anonymous'}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {secondPlace.knockout_points ?? secondPlace.points} pts
          </div>
          <div style={{
            width: '100%', height: '100px',
            background: 'linear-gradient(to top, rgba(192, 192, 192, 0.4), rgba(192, 192, 192, 1))',
            borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: '#fff', fontSize: '2rem', fontWeight: '900', borderTop: '3px solid #E0E0E0',
            boxShadow: '0 -5px 20px rgba(192, 192, 192, 0.4)'
          }}>2</div>
        </div>
      )}

      {/* 1st Place */}
      {firstPlace && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', minWidth: '100px', zIndex: 10, animation: 'slideUp 1s ease-out backwards' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '-10px', 
            filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))',
            animation: 'bounce 2s infinite' 
          }}>
            👑
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '0.5rem', color: '#FFD700', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }}>
            {firstPlace.users?.display_name || firstPlace.display_name || 'Anonymous'}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {firstPlace.knockout_points ?? firstPlace.points} pts
          </div>
          <div style={{
            width: '100%', height: '150px',
            background: 'linear-gradient(to top, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 1))',
            borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: '#fff', fontSize: '3rem', fontWeight: '900', textShadow: '0 4px 8px rgba(0,0,0,0.4)', borderTop: '4px solid #FFF8DC',
            boxShadow: '0 -10px 30px rgba(255, 215, 0, 0.6)'
          }}>1</div>
        </div>
      )}

      {/* 3rd Place */}
      {thirdPlace && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', minWidth: '80px', animation: 'slideUp 1s ease-out 0.6s backwards' }}>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: '#CD7F32', textShadow: '0 0 10px rgba(205,127,50,0.5)' }}>
            {thirdPlace.users?.display_name || thirdPlace.display_name || 'Anonymous'}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {thirdPlace.knockout_points ?? thirdPlace.points} pts
          </div>
          <div style={{
            width: '100%', height: '70px',
            background: 'linear-gradient(to top, rgba(205, 127, 50, 0.4), rgba(205, 127, 50, 1))',
            borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: '#fff', fontSize: '1.8rem', fontWeight: '900', borderTop: '3px solid #F4A460',
            boxShadow: '0 -5px 20px rgba(205, 127, 50, 0.4)'
          }}>3</div>
        </div>
      )}
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
          100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
        }
      `}} />
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at center, rgba(30,30,50,0.95) 0%, rgba(5,5,16,0.98) 100%)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '1rem', backdropFilter: 'blur(12px)', overflowY: 'auto',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '750px',
            position: 'relative',
            maxHeight: '95vh',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.4))',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            animation: 'pulseGlow 3s infinite',
            borderRadius: '24px'
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
              aria-label="Close"
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
            >
              &times;
            </button>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem', flexShrink: 0 }}>
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'slideUp 0.8s ease-out' }}>🏆</div>
              <h2 style={{ 
                color: 'rgb(255, 251, 67)',
                margin: '0 0 0.5rem 0', fontSize: '2.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900',
                textShadow: '0 4px 10px var(--color-wimbledon-lime)',
                filter: 'drop-shadow(0 2px 4px var(--color-wimbledon-lime))'
              }}>Knockout Stage Champions!</h2>
              <p style={{ color: '#E0E0E0', fontSize: '1.2rem', margin: 0, fontWeight: '500', letterSpacing: '1px' }}>
                The Knockout Stage has concluded. All hail the victors!
              </p>
            </div>

            {/* Modal Podium */}
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              height: '220px', marginBottom: '3rem', gap: '0.8rem', flexShrink: 0,
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
                flex: 1, minHeight: '180px', overflowY: 'auto', marginBottom: '2rem',
                background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '1rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {restOfLeaderboard.map((member: any, idx: number) => (
                      <tr key={member.user_id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', width: '50px', fontSize: '1.1rem' }}>
                          #{idx + 4}
                        </td>
                        <td style={{ padding: '1rem', color: '#fff', fontSize: '1.1rem', fontWeight: '500' }}>
                          {member.users?.display_name || member.display_name || 'Anonymous'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)', fontSize: '1.1rem' }}>
                          {member.knockout_points ?? member.points} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="btn"
              style={{ 
                width: '100%', padding: '1.2rem', fontSize: '1.2rem', borderRadius: '16px', fontWeight: 'bold', flexShrink: 0,
                background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728)', color: '#000',
                border: 'none', boxShadow: '0 5px 15px rgba(191, 149, 63, 0.4)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(191, 149, 63, 0.6)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(191, 149, 63, 0.4)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Global Floating Podium */}
      <div style={{
        position: 'fixed',
        bottom: globalPodiumVisible ? '20%' : '-400px',
        left: '50%',
        transform: `translateX(-50%) ${globalPodiumVisible ? 'scale(1.3)' : 'scale(0.5)'}`,
        transition: 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: globalPodiumVisible ? 1 : 0,
        zIndex: 9998,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        pointerEvents: 'none',
        background: 'radial-gradient(circle at top, rgba(30,30,50,0.98), rgba(5,5,16,0.98))',
        padding: '2rem 3rem 2.5rem 3rem',
        borderRadius: '24px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.9), 0 0 30px rgba(255, 215, 0, 0.2)',
        border: '1px solid rgba(255,215,0,0.3)'
      }}>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase', 
          letterSpacing: '3px', 
          fontSize: '1.5rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          textAlign: 'center',
          fontWeight: '900'
        }}>
          Knockout Stage Podium
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.2rem', height: '220px' }}>
          {podiumContent}
        </div>
      </div>
    </>
  )
}
