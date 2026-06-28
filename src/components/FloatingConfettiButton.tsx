'use client'

import { triggerConfetti } from '@/utils/confetti'

export default function FloatingConfettiButton() {
  return (
    <button
      onClick={() => triggerConfetti(true)}
      className="hover-lift"
      style={{
        position: 'fixed',
        bottom: '6.5rem',
        left: '2rem',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'var(--color-wimbledon-lime)',
        color: '#000',
        border: '3px solid #000',
        boxShadow: '4px 4px 0px #000',
        fontSize: '1.8rem',
        cursor: 'pointer',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      title="Celebrate!"
    >
      🎉
    </button>
  )
}
