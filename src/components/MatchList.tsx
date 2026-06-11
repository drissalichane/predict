'use client'

import { useState, useEffect } from 'react'
import { submitPrediction } from '@/app/room/[id]/actions'

type Match = { id: number, kickoff_time: string, odds_home: number, odds_draw: number, odds_away: number, home_team: string, away_team: string }
type Prediction = { match_id: number, predicted_home_score: number, predicted_away_score: number, points_earned: number }

export default function MatchList({ matches, initialPredictions, roomId }: { matches: Match[], initialPredictions: Prediction[], roomId: string }) {
  const [filterMode, setFilterMode] = useState<'day' | 'round' | 'all'>('day')
  
  const getStage = (dateString: string) => {
    // Subtract 6 hours to convert UTC to approx US ET so late matches fall on the correct day
    const d = new Date(new Date(dateString).getTime() - 6 * 60 * 60 * 1000)
    const month = d.getMonth() + 1
    const day = d.getDate()
    
    if (month === 6 && day <= 27) return 'Group Stage'
    if ((month === 6 && day >= 28) || (month === 7 && day <= 3)) return 'Round of 32'
    if (month === 7 && day >= 4 && day <= 7) return 'Round of 16'
    if (month === 7 && day >= 9 && day <= 11) return 'Quarterfinals'
    if (month === 7 && day >= 14 && day <= 15) return 'Semifinals'
    if (month === 7 && day === 18) return 'Third-Place Match'
    if (month === 7 && day >= 19) return 'Final'
    return 'Group Stage'
  }

  // Compute unique days and rounds using the adjusted date for stability
  const formatDay = (dateString: string) => {
    const d = new Date(new Date(dateString).getTime() - 6 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  }

  const days = Array.from(new Set(matches.map(m => formatDay(m.kickoff_time)))).sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
  const rounds = Array.from(new Set(matches.map(m => getStage(m.kickoff_time)))).sort()
  
  const [selectedDay, setSelectedDay] = useState(days[0] || '')
  const [selectedRound, setSelectedRound] = useState(rounds[0] || '')

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'all') return true
    if (filterMode === 'day') return formatDay(m.kickoff_time) === selectedDay
    if (filterMode === 'round') return getStage(m.kickoff_time) === selectedRound
    return true
  })

  // State to track if a match prediction is in edit mode
  // key: match.id, value: boolean
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})

  // prediction map
  const predMap: Record<string, Prediction> = {}
  initialPredictions.forEach(p => { predMap[p.match_id] = p })

  // Current time state to avoid impure Date.now() during render
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  useEffect(() => {
    setCurrentTime(Date.now())
  }, [])

  return (
    <div className="bg-surface" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: 0 }}>Matches & Predictions</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className={`btn ${filterMode === 'day' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('day')}>By Day</button>
          <button type="button" className={`btn ${filterMode === 'round' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('round')}>By Round</button>
          <button type="button" className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('all')}>All</button>
        </div>
      </div>

      {filterMode === 'day' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-background)', color: 'white', border: '1px solid var(--color-border)' }}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {filterMode === 'round' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-background)', color: 'white', border: '1px solid var(--color-border)' }}>
            {rounds.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}
      
      {!filteredMatches || filteredMatches.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No matches found for this filter.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMatches.map((match: Match) => {
            const prediction = predMap[match.id]
            const hasStarted = currentTime !== null ? new Date(match.kickoff_time).getTime() <= currentTime : false
            const isEditing = editMode[match.id] || !prediction
            
            return (
              <div key={match.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span>
                    {formatDay(match.kickoff_time)} - {getStage(match.kickoff_time)} • {new Date(match.kickoff_time).toLocaleTimeString('en-US', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' })} (Morocco Time)
                  </span>
                  <span>Odds: {match.odds_home} (H) | {match.odds_draw} (D) | {match.odds_away} (A)</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{match.home_team}</span>
                  <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>vs</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 'bold' }}>{match.away_team}</span>
                </div>

                <form 
                  action={async (formData) => {
                    await submitPrediction(formData)
                    setEditMode(prev => ({ ...prev, [match.id]: false }))
                  }} 
                  style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}
                >
                  <input type="hidden" name="matchId" value={match.id} />
                  <input type="hidden" name="roomId" value={roomId} />
                  
                  <input 
                    type="number" 
                    name="homeScore" 
                    defaultValue={prediction?.predicted_home_score ?? ''}
                    disabled={hasStarted || !isEditing}
                    min="0"
                    style={{ width: '60px', padding: '0.5rem', textAlign: 'center', background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'white', borderRadius: 'var(--radius-md)' }} 
                  />
                  <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                  <input 
                    type="number" 
                    name="awayScore" 
                    defaultValue={prediction?.predicted_away_score ?? ''}
                    disabled={hasStarted || !isEditing}
                    min="0"
                    style={{ width: '60px', padding: '0.5rem', textAlign: 'center', background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'white', borderRadius: 'var(--radius-md)' }} 
                  />
                  
                  {!hasStarted ? (
                    isEditing ? (
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        {prediction ? 'Save' : 'Predict'}
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => setEditMode(prev => ({ ...prev, [match.id]: true }))}
                      >
                        Update
                      </button>
                    )
                  ) : (
                    <span style={{ color: 'var(--color-wimbledon-lime)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      +{prediction?.points_earned || 0} pts
                    </span>
                  )}
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
