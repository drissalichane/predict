'use client'

import { useState, useEffect } from 'react'
import { submitPrediction } from '@/app/room/[id]/actions'

type Match = { id: number, kickoff_time: string, odds_home: number, odds_draw: number, odds_away: number, home_team: string, away_team: string, status?: string, home_score?: number | null, away_score?: number | null }
type Prediction = { match_id: number, predicted_home_score: number, predicted_away_score: number, points_earned: number }

const countryToCode: Record<string, string> = {
  'Argentina': 'ar', 'France': 'fr', 'Brazil': 'br', 'England': 'gb-eng',
  'Spain': 'es', 'Portugal': 'pt', 'Netherlands': 'nl', 'Germany': 'de',
  'Italy': 'it', 'Croatia': 'hr', 'Morocco': 'ma', 'USA': 'us',
  'United States': 'us', 'Mexico': 'mx', 'Canada': 'ca', 'Japan': 'jp',
  'Senegal': 'sn', 'Uruguay': 'uy', 'Switzerland': 'ch', 'Colombia': 'co',
  'Belgium': 'be', 'Ecuador': 'ec', 'Peru': 'pe', 'Chile': 'cl',
  'Saudi Arabia': 'sa', 'South Korea': 'kr', 'Australia': 'au', 'Iran': 'ir',
  'Costa Rica': 'cr', 'Wales': 'gb-wls', 'Poland': 'pl', 'Denmark': 'dk',
  'Serbia': 'rs', 'Cameroon': 'cm', 'Ghana': 'gh', 'Tunisia': 'tn',
  'Qatar': 'qa', 'Algeria': 'dz', 'Egypt': 'eg', 'Nigeria': 'ng',
  'Ivory Coast': 'ci', 'Mali': 'ml', 'Burkina Faso': 'bf', 'South Africa': 'za',
  'Panama': 'pa', 'Jamaica': 'jm', 'Honduras': 'hn', 'El Salvador': 'sv',
  'New Zealand': 'nz', 'Sweden': 'se', 'Norway': 'no', 'Austria': 'at',
  'Hungary': 'hu', 'Czech Republic': 'cz', 'Scotland': 'gb-sct', 'Ireland': 'ie',
  'Greece': 'gr', 'Turkey': 'tr', 'Ukraine': 'ua', 'Romania': 'ro',
  'Paraguay': 'py', 'Venezuela': 've', 'Bolivia': 'bo', 'Iraq': 'iq'
}

const getFlag = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={`https://flagcdn.com/24x18/${code}.png`} width="24" height="18" alt={team} style={{ display: 'inline-block', verticalAlign: 'middle', border: '2px solid #000', borderRadius: '4px', marginLeft: '0.5rem', marginRight: '0.5rem' }} />
}

export default function MatchList({ matches, initialPredictions, roomId }: { matches: Match[], initialPredictions: Prediction[], roomId: string }) {
  const [filterMode, setFilterMode] = useState<'day' | 'round' | 'all'>('round')
  
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

  const formatDay = (dateString: string) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(new Date(dateString));
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }

  const days = Array.from(new Set(matches.map(m => formatDay(m.kickoff_time)))).sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
  const roundOrder = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Third-Place Match', 'Final']
  const rounds = Array.from(new Set(matches.map(m => getStage(m.kickoff_time))))
    .sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b))
  
  const [selectedDay, setSelectedDay] = useState(days[0] || '')
  const [selectedRound, setSelectedRound] = useState(rounds[0] || '')
  const [showPrevious, setShowPrevious] = useState(false)

  const filteredMatches = matches.filter(m => {
    const isFinished = m.status === 'FINISHED'
    if (showPrevious && !isFinished) return false
    if (!showPrevious && isFinished) return false

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

  // Track hydration to avoid Date mismatch during SSR
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const [showDailyPopup, setShowDailyPopup] = useState(false)

  // Use America/New_York time but shift everything back by 4 hours.
  // This creates a "Broadcast Day" where any match between midnight and 3:59 AM
  // is officially grouped with the previous day's evening matches!
  const getAmericaDay = (dateVal: string | number | Date) => {
    const d = new Date(dateVal);
    d.setHours(d.getHours() - 4);
    return d.toLocaleDateString('en-US', {
      timeZone: 'America/New_York'
    })
  }

  const todayAmericaString = getAmericaDay(new Date().toISOString())
  const missingToday = matches.filter(m => {
    const isToday = getAmericaDay(m.kickoff_time) === todayAmericaString;
    const hasStarted = isMounted ? new Date(m.kickoff_time).getTime() <= Date.now() : false;
    const hasPrediction = !!predMap[m.id];
    return isToday && !hasStarted && !hasPrediction;
  })

  useEffect(() => {
    if (!isMounted) return;
    if (missingToday.length === 0) {
      setShowDailyPopup(false);
      return;
    }

    const storageKey = `lastDailyPopup_${roomId}`;
    const lastSeenStr = localStorage.getItem(storageKey);
    const lastSeen = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
    const now = Date.now();
    const FIVE_HOURS = 5 * 60 * 60 * 1000;

    if (now - lastSeen >= FIVE_HOURS) {
      setShowDailyPopup(true);
      localStorage.setItem(storageKey, now.toString());
    }
  }, [isMounted, roomId, missingToday.length])

  return (
    <div className="bg-surface glass-panel-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: 0 }}>Matches & Predictions</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className={`btn ${filterMode === 'day' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('day')}>By Day</button>
          <button type="button" className={`btn ${filterMode === 'round' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('round')}>By Round</button>
          <button type="button" className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('all')}>All</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          {filterMode === 'day' && (
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ marginRight: '0.5rem' }}>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {filterMode === 'round' && (
            <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} style={{ marginRight: '0.5rem' }}>
              {rounds.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
        <button 
          type="button" 
          onClick={() => setShowPrevious(!showPrevious)} 
          className={`btn ${showPrevious ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
        >
          {showPrevious ? 'Upcoming Games' : 'Previous Games'}
        </button>
      </div>
      
      {!filteredMatches || filteredMatches.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No matches found for this filter.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMatches.map((match: Match) => {
            const prediction = predMap[match.id]
            const hasStarted = isMounted ? new Date(match.kickoff_time).getTime() <= Date.now() : false
            const isEditing = editMode[match.id] || !prediction
            const isExactScore = prediction && match.status === 'FINISHED' && match.home_score !== null && match.away_score !== null && prediction.predicted_home_score === match.home_score && prediction.predicted_away_score === match.away_score;
            
            return (
              <div key={match.id} style={{ position: 'relative', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                {isExactScore && (
                  <div style={{ position: 'absolute', top: '-10px', right: '10px', background: 'var(--color-wimbledon-lime)', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ★ Exact Score
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span>
                    {formatDay(match.kickoff_time)} - {getStage(match.kickoff_time)} • {new Date(match.kickoff_time).toLocaleTimeString('en-US', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' })} (Morocco Time)
                  </span>
                  <span>Odds: {match.odds_home} (H) | {match.odds_draw} (D) | {match.odds_away} (A)</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{match.home_team} {getFlag(match.home_team)}</span>
                  <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>vs</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 'bold' }}>{getFlag(match.away_team)} {match.away_team}</span>
                </div>

                {match.status === 'FINISHED' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', width: '100%', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      Final Score: {match.home_score ?? '-'} - {match.away_score ?? '-'}
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      Your Prediction: {prediction ? `${prediction.predicted_home_score} - ${prediction.predicted_away_score}` : 'None'}
                    </div>
                    <div style={{ color: 'var(--color-wimbledon-lime)', fontWeight: 'bold' }}>
                      +{prediction?.points_earned || 0} pts
                    </div>
                  </div>
                ) : (
                  <form 
                    action={async (formData) => {
                      await submitPrediction(formData)
                      setEditMode(prev => ({ ...prev, [match.id]: false }))
                    }} 
                    style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="roomId" value={roomId} />
                    
                    <input 
                      type="number" 
                      name="homeScore" 
                      defaultValue={prediction?.predicted_home_score ?? ''}
                      disabled={hasStarted || !isEditing}
                      min="0"
                      style={{ width: '80px', textAlign: 'center' }} 
                    />
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: '1.2rem' }}>-</span>
                    <input 
                      type="number" 
                      name="awayScore" 
                      defaultValue={prediction?.predicted_away_score ?? ''}
                      disabled={hasStarted || !isEditing}
                      min="0"
                      style={{ width: '80px', textAlign: 'center' }} 
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
                          onClick={(e) => {
                            e.preventDefault()
                            setEditMode(prev => ({ ...prev, [match.id]: true }))
                          }}
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
                )}
              </div>
            )
          })}
        </div>
      )}

      {showDailyPopup && missingToday.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 16, 0.9)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: 0 }}>Today's Predictions!</h2>
              <button onClick={() => setShowDailyPopup(false)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Close</button>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              You have <strong style={{ color: 'var(--color-wimbledon-lime)' }}>{missingToday.length}</strong> match{missingToday.length > 1 ? 'es' : ''} today that you haven't predicted yet. Lock them in before kickoff!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {missingToday.map((match: Match) => {
                return (
                  <div key={`popup-${match.id}`} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <span>{new Date(match.kickoff_time).toLocaleTimeString('en-US', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Odds: {match.odds_home} (H) | {match.odds_draw} (D) | {match.odds_away} (A)</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{match.home_team} {getFlag(match.home_team)}</span>
                      <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>vs</span>
                      <span style={{ flex: 1, textAlign: 'left', fontWeight: 'bold' }}>{getFlag(match.away_team)} {match.away_team}</span>
                    </div>

                    <form 
                      action={async (formData) => {
                        await submitPrediction(formData)
                      }} 
                      style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="roomId" value={roomId} />
                      
                      <input 
                        type="number" 
                        name="homeScore" 
                        required
                        min="0"
                        style={{ width: '80px', textAlign: 'center' }} 
                      />
                      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: '1.2rem' }}>-</span>
                      <input 
                        type="number" 
                        name="awayScore" 
                        required
                        min="0"
                        style={{ width: '80px', textAlign: 'center' }} 
                      />
                      
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Save
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
