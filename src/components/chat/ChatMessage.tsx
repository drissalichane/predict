'use client'

import { useState } from 'react'
import { ChatMessage as ChatMessageType } from '@/hooks/useChatRealtime'
import { toggleReaction, deleteMessage } from '@/app/chat/actions'

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🔥', '👀']

// SVG Icons
const ReplyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"></polyline>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
  </svg>
)

const ReactIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
)

function getInitials(name: string) {
  if (!name) return '?'
  return name.substring(0, 2).toUpperCase()
}

export default function ChatMessage({
  message,
  repliedMessage,
  currentUserId,
  onReply
}: {
  message: ChatMessageType
  repliedMessage?: ChatMessageType | null
  currentUserId: string | null
  onReply: (msg: ChatMessageType) => void
}) {
  const isMine = message.sender_id === currentUserId
  const [showReactions, setShowReactions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Format reactions into counts
  const reactionCounts: Record<string, { count: number, users: string[] }> = {}
  if (message.message_reactions) {
    message.message_reactions.forEach(r => {
      if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, users: [] }
      reactionCounts[r.emoji].count += 1
      reactionCounts[r.emoji].users.push(r.user_id)
    })
  }

  const handleReaction = async (emoji: string) => {
    setShowReactions(false)
    await toggleReaction(message.id, emoji)
  }

  const handleDelete = () => {
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    setShowConfirmDelete(false)
    const res = await deleteMessage(message.id)
    if (res?.error) {
      alert(res.error)
    }
  }

  const senderName = isMine ? 'You' : (message.users?.display_name || 'Unknown')

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowReactions(false); }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: '1rem',
        position: 'relative',
        gap: '0.75rem',
        width: '100%'
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: isMine ? 'var(--color-wimbledon-purple)' : 'var(--color-surface-hover)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        flexShrink: 0
      }}>
        {getInitials(message.users?.display_name || (isMine ? 'You' : ''))}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: isMine ? 'var(--color-wimbledon-lime)' : 'var(--color-text-primary)' }}>
            {senderName}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            {new Date(message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div style={{
          position: 'relative',
          background: isMine ? 'rgba(79, 38, 131, 0.4)' : 'rgba(255,255,255,0.05)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          borderTopLeftRadius: 0,
          maxWidth: '100%'
        }}>
          {message.reply_to_id && (
            <div style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              color: 'var(--color-text-secondary)',
              borderLeft: '2px solid var(--color-wimbledon-lime)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {repliedMessage ? (
                <>
                  <span style={{ fontWeight: 'bold', marginRight: '4px' }}>
                    {repliedMessage.sender_id === currentUserId ? 'You' : repliedMessage.users?.display_name}:
                  </span>
                  {repliedMessage.content}
                </>
              ) : (
                'Replying to a deleted message...'
              )}
            </div>
          )}
          
          <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {message.content}
          </p>

          {/* Hover Action Toolbar */}
          {isHovered && (
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '10px',
              display: 'flex',
              gap: '4px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              zIndex: 20
            }}>
              <button 
                onClick={() => setShowReactions(!showReactions)}
                title="React"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                <ReactIcon />
              </button>
              <button 
                onClick={() => onReply(message)}
                title="Reply"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                <ReplyIcon />
              </button>
              {isMine && (
                <button 
                  onClick={handleDelete}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', color: '#ff4d4d', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <DeleteIcon />
                </button>
              )}
            </div>
          )}

          {showReactions && (
            <div style={{
              position: 'absolute',
              top: '-45px',
              right: '10px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
              display: 'flex',
              gap: '0.25rem',
              zIndex: 30,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              {EMOJI_OPTIONS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReaction(emoji)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem', borderRadius: '4px' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
            {Object.entries(reactionCounts).map(([emoji, data]) => {
              const hasReacted = data.users.includes(currentUserId || '')
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    background: hasReacted ? 'rgba(163, 193, 56, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: hasReacted ? '1px solid var(--color-wimbledon-lime)' : '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  {emoji} {data.count}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
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
            <h3 style={{ color: 'var(--color-wimbledon-lime)', marginBottom: '1rem' }}>Delete Message?</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowConfirmDelete(false)}
                style={{ padding: '0.5rem 1.5rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                style={{ padding: '0.5rem 1.5rem' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
