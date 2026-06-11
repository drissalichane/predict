'use client'

import { useState } from 'react'
import { joinRoom } from '@/app/dashboard/actions'

export default function JoinRoomForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleJoin = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    const result = await joinRoom(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          name="inviteCode" 
          placeholder="Enter room code" 
          required
          style={{
            flex: 1,
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
            fontSize: '1rem'
          }} 
        />
        <button type="submit" className="btn btn-purple" style={{ borderRadius: 'var(--radius-md)', padding: '0 1.5rem' }} disabled={loading}>
          {loading ? 'Joining...' : 'Join'}
        </button>
      </div>
      {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', textAlign: 'left', marginTop: '0.5rem' }}>{error}</p>}
    </form>
  )
}
