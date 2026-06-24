'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function FeatureDiscoveryModal() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Only show the modal if the user is actually inside a room
    if (!pathname || !pathname.startsWith('/room/')) return

    // Read the view count from localStorage
    const viewCountStr = localStorage.getItem('featureDiscoveryViewCount')
    const viewCount = viewCountStr ? parseInt(viewCountStr, 10) : 0

    if (viewCount < 3) {
      // Small delay so it doesn't pop up instantly before the page loads
      const timer = setTimeout(() => {
        setIsOpen(true)
        // Increment the count precisely when it pops up
        localStorage.setItem('featureDiscoveryViewCount', (viewCount + 1).toString())
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [pathname])

  const handleDismiss = () => {
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 16, 0.8)', zIndex: 60,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '1rem', backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
        <button 
          onClick={handleDismiss}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
          aria-label="Close"
        >
          &times;
        </button>
        
        <h2 style={{ color: 'var(--color-wimbledon-lime)', marginBottom: '1rem', marginTop: '0.5rem' }}>✨ New Features!</h2>
        
        <p style={{ color: 'var(--color-text-primary)', marginBottom: '1rem', fontSize: '1.05rem' }}>
          Did you know? You can now interact with more elements on the page:
        </p>
        
        <ul style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6', paddingLeft: '1.5rem', fontSize: '0.95rem' }}>
          <li><strong>Team Info:</strong> Click on any team name or flag in the matches list to view their match history.</li>
          <li><strong>Player Profiles:</strong> Click on any player's name in the leaderboard to see their prediction history and performance!</li>
        </ul>
        
        <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <video 
            src="/demo.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            style={{ width: '100%', height: 'auto', display: 'block' }} 
            onError={(e) => { 
              // If video fails to load, just hide it
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.style.display = 'none';
              }
            }} 
          />
        </div>

        <button onClick={handleDismiss} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}>
          Got it, thanks!
        </button>
      </div>
    </div>
  )
}
