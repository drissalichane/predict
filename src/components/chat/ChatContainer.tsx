'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatRealtime, ChatMessage as ChatMessageType, ChatChannel } from '@/hooks/useChatRealtime'
import { createChannel, sendMessage, getUsers } from '@/app/chat/actions'
import ChatMessage from './ChatMessage'

export default function ChatContainer({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels')
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessageType | null>(null)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [users, setUsers] = useState<{ id: string, display_name: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, channels, isLoading, currentUser } = useChatRealtime(activeChannelId, activeRecipientId)

  // Fetch users for DMs
  useEffect(() => {
    async function fetchUsers() {
      const res = await getUsers()
      if (res.users) setUsers(res.users)
    }
    fetchUsers()
  }, [])

  // Set default channel to "General" if none selected
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId && !activeRecipientId && activeTab === 'channels') {
      const general = channels.find(c => c.name.toLowerCase() === 'general')
      if (general) setActiveChannelId(general.id)
      else setActiveChannelId(channels[0].id)
    }
  }, [channels, activeChannelId, activeRecipientId, activeTab])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const formData = new FormData()
    formData.append('content', messageInput)
    if (activeChannelId) formData.append('channelId', activeChannelId)
    if (activeRecipientId) formData.append('recipientId', activeRecipientId)
    if (replyTo) formData.append('replyToId', replyTo.id)

    setMessageInput('')
    setReplyTo(null)
    
    await sendMessage(formData)
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return
    const formData = new FormData()
    formData.append('name', newChannelName)
    const res = await createChannel(formData)
    if (res.success && res.channel) {
      setIsCreatingChannel(false)
      setNewChannelName('')
      setActiveChannelId(res.channel.id)
    }
  }

  return (
    <div className="chat-container">
      {/* Sidebar / List Area */}
      <div className="chat-sidebar">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Discussions</h2>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
          )}
        </div>
        
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          <button 
            onClick={() => { setActiveTab('channels'); setActiveRecipientId(null); }}
            style={{ 
              flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === 'channels' ? 'var(--color-wimbledon-lime)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'channels' ? '2px solid var(--color-wimbledon-lime)' : '2px solid transparent'
            }}
          >
            Rooms
          </button>
          <button 
            onClick={() => { setActiveTab('dms'); setActiveChannelId(null); }}
            style={{ 
              flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === 'dms' ? 'var(--color-wimbledon-lime)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'dms' ? '2px solid var(--color-wimbledon-lime)' : '2px solid transparent'
            }}
          >
            DMs
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {activeTab === 'channels' && (
            <>
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem',
                    background: activeChannelId === channel.id ? 'rgba(163, 193, 56, 0.1)' : 'transparent',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    color: activeChannelId === channel.id ? 'var(--color-wimbledon-lime)' : 'var(--color-text-primary)',
                    marginBottom: '0.25rem'
                  }}
                >
                  # {channel.name}
                </button>
              ))}
              <div style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
                {isCreatingChannel ? (
                  <form onSubmit={handleCreateChannel} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <input 
                      type="text" 
                      value={newChannelName} 
                      onChange={e => setNewChannelName(e.target.value)} 
                      placeholder="Room name..." 
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Create</button>
                      <button type="button" onClick={() => setIsCreatingChannel(false)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsCreatingChannel(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>+</span> Create Room
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === 'dms' && (
            <>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setActiveRecipientId(user.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem',
                    background: activeRecipientId === user.id ? 'rgba(163, 193, 56, 0.1)' : 'transparent',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    color: activeRecipientId === user.id ? 'var(--color-wimbledon-lime)' : 'var(--color-text-primary)',
                    marginBottom: '0.25rem'
                  }}
                >
                  @ {user.display_name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <h3 style={{ margin: 0, color: 'var(--color-wimbledon-lime)' }}>
            {activeTab === 'channels' 
              ? `# ${channels.find(c => c.id === activeChannelId)?.name || 'Select a room'}`
              : `@ ${users.find(u => u.id === activeRecipientId)?.display_name || 'Select a user'}`
            }
          </h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '2rem' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '2rem' }}>No messages yet. Start the conversation!</div>
          ) : (
            messages.map(msg => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                repliedMessage={msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null}
                currentUserId={currentUser} 
                onReply={(m) => setReplyTo(m)} 
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          {replyTo && (
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem',
              borderLeft: '3px solid var(--color-wimbledon-lime)'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Replying to {replyTo.users?.display_name || 'User'}: {replyTo.content}
              </span>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>&times;</button>
            </div>
          )}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder={(activeChannelId || activeRecipientId) ? "Type a message..." : "Select a room or user first"}
              disabled={!activeChannelId && !activeRecipientId}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white'
              }}
            />
            <button 
              type="submit" 
              disabled={!messageInput.trim() || (!activeChannelId && !activeRecipientId)}
              className="btn btn-primary"
              style={{ padding: '0 1.5rem', borderRadius: 'var(--radius-md)' }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
