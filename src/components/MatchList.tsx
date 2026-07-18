'use client'

import { useState, useEffect } from 'react'
import { submitPrediction } from '@/app/room/[id]/actions'
import { getOtherPredictions } from '@/app/profile/actions'
import TeamModal from './TeamModal'
import OverallStandingsModal from './OverallStandingsModal'
import KnockoutBracketModal from './KnockoutBracketModal'

type Match = { id: number, kickoff_time: string, odds_home: number, odds_draw: number, odds_away: number, home_team: string, away_team: string, status?: string, home_score?: number | null, away_score?: number | null, duration?: string, et_home_score?: number | null, et_away_score?: number | null, ps_home_score?: number | null, ps_away_score?: number | null }
type Prediction = { 
  match_id: number, 
  predicted_home_score: number, 
  predicted_away_score: number, 
  predicted_et_home_score?: number | null,
  predicted_et_away_score?: number | null,
  predicted_ps_home_score?: number | null,
  predicted_ps_away_score?: number | null,
  points_earned: number 
}

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
  'Paraguay': 'py', 'Venezuela': 've', 'Bolivia': 'bo', 'Iraq': 'iq',
  'Congo DR': 'cd', 'Cape Verde Islands': 'cv', 'Bosnia': 'ba', 'Bosnia-Herzegovina': 'ba',
  'Curaçao': 'cw', 'Curacao': 'cw', 'Haiti': 'ht'
}

const getFlag = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={`https://flagcdn.com/24x18/${code}.png`} width="24" height="18" alt={team} style={{ display: 'inline-block', verticalAlign: 'middle', border: '2px solid #000', borderRadius: '4px', marginLeft: '0.5rem', marginRight: '0.5rem' }} />
}

export default function MatchList({ matches, initialPredictions, roomId }: { matches: Match[], initialPredictions: Prediction[], roomId: string }) {
  const [filterMode, setFilterMode] = useState<'day' | 'round' | 'all'>('all')

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

  const days = Array.from(new Set(matches.map(m => formatDay(m.kickoff_time)))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const roundOrder = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Third-Place Match', 'Final']
  const rounds = Array.from(new Set(matches.map(m => getStage(m.kickoff_time))))
    .sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b))

  const [selectedDay, setSelectedDay] = useState(days[0] || '')
  const [selectedRound, setSelectedRound] = useState(rounds.includes('Third-Place Match') ? 'Third-Place Match' : rounds.includes('Semifinals') ? 'Semifinals' : rounds.includes('Round of 16') ? 'Round of 16' : rounds[0] || '')
  const [showPrevious, setShowPrevious] = useState(false)

  const filteredMatches = matches.filter(m => {
    const isFinished = m.status === 'FINISHED'
    if (showPrevious && !isFinished) return false
    if (!showPrevious && isFinished) return false

    if (filterMode === 'all') return true
    if (filterMode === 'day') return formatDay(m.kickoff_time) === selectedDay
    if (filterMode === 'round') return getStage(m.kickoff_time) === selectedRound
    return true
  }).sort((a, b) => {
    if (showPrevious) {
      return new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime()
    }
    return new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
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
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showOverallStandings, setShowOverallStandings] = useState(false)
  const [showBracketModal, setShowBracketModal] = useState(false)

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [otherPredictions, setOtherPredictions] = useState<any[]>([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [knockoutDrawMatch, setKnockoutDrawMatch] = useState<{ match: Match, h: number, a: number } | null>(null)
  const [editKnockoutMatch, setEditKnockoutMatch] = useState<{ match: Match, prediction: Prediction | null } | null>(null)

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
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: '0 0 1rem 0' }}>Matches & Predictions</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className={`btn ${filterMode === 'day' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('day')}>By Day</button>
            <button type="button" className={`btn ${filterMode === 'round' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('round')}>By Round</button>
            <button type="button" className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setFilterMode('all')}>All</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button type="button" className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setShowBracketModal(true)}>Bracket</button>
            <button type="button" className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setShowOverallStandings(true)}>Standings</button>
          </div>
        </div>
        <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-wimbledon-lime)' }}>Note:</strong> All primary score predictions are for the <strong>90-minute regulation time</strong>. If you predict a draw for a Knockout Stage match, you will be prompted to predict the Extra Time and Penalty scores.
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
            const isExactET = prediction && match.status === 'FINISHED' && (match.duration === 'EXTRA_TIME' || match.duration === 'PENALTY_SHOOTOUT') && match.et_home_score !== null && match.et_away_score !== null && prediction.predicted_et_home_score === match.et_home_score && prediction.predicted_et_away_score === match.et_away_score;
            const isExactPens = prediction && match.status === 'FINISHED' && match.duration === 'PENALTY_SHOOTOUT' && match.ps_home_score !== null && match.ps_away_score !== null && prediction.predicted_ps_home_score === match.ps_home_score && prediction.predicted_ps_away_score === match.ps_away_score;

            return (
              <div key={match.id} style={{ position: 'relative', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '10px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                  {isExactScore && (
                    <div style={{ background: 'var(--color-wimbledon-lime)', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ★ Exact Score
                    </div>
                  )}
                  {isExactET && (
                    <div style={{ background: '#FFD700', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ★ Exact ET
                    </div>
                  )}
                  {isExactPens && (
                    <div style={{ background: '#FF8C00', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ★ Exact PENs
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span>
                    {formatDay(match.kickoff_time)} - {getStage(match.kickoff_time)} • {new Date(match.kickoff_time).toLocaleTimeString('en-US', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' })} (Morocco Time)
                  </span>
                  <span>Odds: {match.odds_home} (H) | {match.odds_draw} (D) | {match.odds_away} (A)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" className="team-name-hover" onClick={() => setSelectedTeam(match.home_team)} style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'inherit', fontSize: 'inherit' }}>
                    {match.home_team} {getFlag(match.home_team)}
                  </button>
                  <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>vs</span>
                  <button type="button" className="team-name-hover" onClick={() => setSelectedTeam(match.away_team)} style={{ flex: 1, textAlign: 'left', fontWeight: 'bold', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontFamily: 'inherit', fontSize: 'inherit' }}>
                    {getFlag(match.away_team)} {match.away_team}
                  </button>
                </div>

                {match.status === 'FINISHED' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', width: '100%', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      Final Score: {match.home_score ?? '-'} - {match.away_score ?? '-'}
                    </div>
                    {(match.duration === 'EXTRA_TIME' || match.duration === 'PENALTY_SHOOTOUT') && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-wimbledon-lime)', fontWeight: 'bold' }}>
                        ET: {match.et_home_score ?? '-'} - {match.et_away_score ?? '-'}
                        {match.et_home_score != null && match.et_away_score != null && ` (a.e.t. ${(match.home_score ?? 0) + match.et_home_score}-${(match.away_score ?? 0) + match.et_away_score})`}
                        {match.duration === 'PENALTY_SHOOTOUT' && ` | Pens: ${match.ps_home_score ?? '-'} - ${match.ps_away_score ?? '-'}`}
                      </div>
                    )}
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                      Your Prediction: {prediction ? `${prediction.predicted_home_score} - ${prediction.predicted_away_score}` : 'None'}
                      {prediction?.predicted_et_home_score != null && (
                         <div style={{ marginTop: '0.25rem' }}>
                            ET: {prediction.predicted_et_home_score} - {prediction.predicted_et_away_score}
                            {` (a.e.t. ${prediction.predicted_home_score + prediction.predicted_et_home_score}-${prediction.predicted_away_score + prediction.predicted_et_away_score!})`}
                            {prediction?.predicted_ps_home_score != null && ` | Pens: ${prediction.predicted_ps_home_score} - ${prediction.predicted_ps_away_score}`}
                         </div>
                      )}
                    </div>
                    <div style={{ color: 'var(--color-wimbledon-lime)', fontWeight: 'bold' }}>
                      +{prediction?.points_earned || 0} pts
                    </div>
                    
                    <button
                      onClick={async () => {
                        setSelectedMatch(match)
                        setIsLoadingPredictions(true)
                        const res = await getOtherPredictions(match.id, roomId)
                        if (res?.predictions) {
                          setOtherPredictions(res.predictions)
                        }
                        setIsLoadingPredictions(false)
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        marginTop: '0.5rem',
                        width: '100%',
                        maxWidth: '200px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--color-wimbledon-lime)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    >
                      View Other Predictions
                    </button>
                  </div>
                ) : (
                  <form
                    action={async (formData) => {
                      const hStr = formData.get('homeScore') as string;
                      const aStr = formData.get('awayScore') as string;
                      if (hStr && aStr) {
                        const h = parseInt(hStr, 10);
                        const a = parseInt(aStr, 10);
                        if (getStage(match.kickoff_time) !== 'Group Stage' && h === a && !formData.get('etHomeScore')) {
                          setKnockoutDrawMatch({ match, h, a });
                          return;
                        }
                      }
                      await submitPrediction(formData)
                      setEditMode(prev => ({ ...prev, [match.id]: false }))
                    }}
                    style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="roomId" value={roomId} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          name="homeScore"
                          defaultValue={prediction?.predicted_home_score ?? ''}
                          disabled={hasStarted || !isEditing}
                          min="0"
                          style={{ width: '80px', textAlign: 'center' }}
                        />
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: '1.2rem', margin: '0 0.5rem' }}>-</span>
                        <input
                          type="number"
                          name="awayScore"
                          defaultValue={prediction?.predicted_away_score ?? ''}
                          disabled={hasStarted || !isEditing}
                          min="0"
                          style={{ width: '80px', textAlign: 'center' }}
                        />
                      </div>
                      {!isEditing && prediction?.predicted_et_home_score != null && (
                         <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                            ET: {prediction.predicted_et_home_score} - {prediction.predicted_et_away_score}
                            {` (a.e.t. ${prediction.predicted_home_score + prediction.predicted_et_home_score}-${prediction.predicted_away_score + prediction.predicted_et_away_score!})`}
                            {prediction?.predicted_ps_home_score != null && ` | Pens: ${prediction.predicted_ps_home_score} - ${prediction.predicted_ps_away_score}`}
                         </div>
                      )}
                    </div>

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
                            if (getStage(match.kickoff_time) !== 'Group Stage') {
                              setEditKnockoutMatch({ match, prediction: prediction || null });
                            } else {
                              setEditMode(prev => ({ ...prev, [match.id]: true }))
                            }
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
                      <button type="button" className="team-name-hover" onClick={() => setSelectedTeam(match.home_team)} style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'inherit', fontSize: 'inherit' }}>
                        {match.home_team} {getFlag(match.home_team)}
                      </button>
                      <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>vs</span>
                      <button type="button" className="team-name-hover" onClick={() => setSelectedTeam(match.away_team)} style={{ flex: 1, textAlign: 'left', fontWeight: 'bold', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontFamily: 'inherit', fontSize: 'inherit' }}>
                        {getFlag(match.away_team)} {match.away_team}
                      </button>
                    </div>

                    <form
                      action={async (formData) => {
                        const hStr = formData.get('homeScore') as string;
                        const aStr = formData.get('awayScore') as string;
                        if (hStr && aStr) {
                          const h = parseInt(hStr, 10);
                          const a = parseInt(aStr, 10);
                          if (getStage(match.kickoff_time) !== 'Group Stage' && h === a && !formData.get('etHomeScore')) {
                            setKnockoutDrawMatch({ match, h, a });
                            setShowDailyPopup(false);
                            return;
                          }
                        }
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

      {selectedTeam && (
        <TeamModal teamName={selectedTeam} matches={matches} onClose={() => setSelectedTeam(null)} />
      )}

      {knockoutDrawMatch && (
        <KnockoutEditModal
          match={knockoutDrawMatch.match}
          initialH={knockoutDrawMatch.h}
          initialA={knockoutDrawMatch.a}
          roomId={roomId}
          onClose={() => setKnockoutDrawMatch(null)}
          onSuccess={() => {
            setEditMode(prev => ({ ...prev, [knockoutDrawMatch.match.id]: false }))
            setKnockoutDrawMatch(null)
          }}
        />
      )}

      {editKnockoutMatch && (
        <KnockoutEditModal
          match={editKnockoutMatch.match}
          prediction={editKnockoutMatch.prediction}
          roomId={roomId}
          onClose={() => setEditKnockoutMatch(null)}
          onSuccess={() => {
            setEditMode(prev => ({ ...prev, [editKnockoutMatch.match.id]: false }))
            setEditKnockoutMatch(null)
          }}
        />
      )}

      {showOverallStandings && (
        <OverallStandingsModal matches={matches} onClose={() => setShowOverallStandings(false)} />
      )}

      {showBracketModal && (
        <KnockoutBracketModal matches={matches} onClose={() => setShowBracketModal(false)} />
      )}

      {/* Modal for other predictions */}
      {selectedMatch && (
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
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--color-wimbledon-lime)', margin: 0 }}>
                {selectedMatch.home_team} vs {selectedMatch.away_team}
              </h3>
              <button 
                onClick={() => setSelectedMatch(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {isLoadingPredictions ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading predictions...</div>
              ) : otherPredictions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>No other predictions found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {otherPredictions.map(p => {
                    const isExactScore = selectedMatch.home_score !== null && selectedMatch.away_score !== null && 
                                         p.predicted_home_score === selectedMatch.home_score && 
                                         p.predicted_away_score === selectedMatch.away_score;
                                         
                    const isCorrectOutcome = !isExactScore && typeof selectedMatch.home_score === 'number' && typeof selectedMatch.away_score === 'number' &&
                                             Math.sign(p.predicted_home_score - p.predicted_away_score) === Math.sign(selectedMatch.home_score - selectedMatch.away_score);
                                             
                    const scoreColor = (isExactScore || isCorrectOutcome) ? '#81C784' : 'white';
                    
                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{p.users?.display_name || 'Unknown'}</div>
                          {isExactScore && (
                            <span style={{ background: '#81C784', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 'bold' }}>★ EXACT</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: scoreColor }}>
                            {p.predicted_home_score} - {p.predicted_away_score}
                          </div>
                          <div style={{ color: scoreColor, fontSize: '0.9rem', width: '50px', textAlign: 'right', fontWeight: 'bold' }}>
                            +{p.points_earned} pts
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const KnockoutEditModal = ({ 
  match, 
  initialH, 
  initialA, 
  prediction, 
  roomId, 
  onClose, 
  onSuccess 
}: { 
  match: Match, 
  initialH?: number, 
  initialA?: number, 
  prediction?: Prediction | null, 
  roomId: string, 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [h, setH] = useState<string>(initialH !== undefined ? initialH.toString() : (prediction?.predicted_home_score?.toString() ?? ''));
  const [a, setA] = useState<string>(initialA !== undefined ? initialA.toString() : (prediction?.predicted_away_score?.toString() ?? ''));
  
  const [etH, setEtH] = useState<string>(prediction?.predicted_et_home_score?.toString() ?? '');
  const [etA, setEtA] = useState<string>(prediction?.predicted_et_away_score?.toString() ?? '');
  
  const [psH, setPsH] = useState<string>(prediction?.predicted_ps_home_score?.toString() ?? '');
  const [psA, setPsA] = useState<string>(prediction?.predicted_ps_away_score?.toString() ?? '');

  const is90MinDraw = h !== '' && a !== '' && h === a;
  const isEtDraw = is90MinDraw && etH !== '' && etA !== '' && etH === etA;
  const isPsDraw = isEtDraw && psH !== '' && psA !== '' && psH === psA;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 16, 0.9)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--color-wimbledon-lime)', margin: 0 }}>Predict Match Scores</h2>
          <button onClick={onClose} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Cancel</button>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Fill out your predictions below. For knockout matches, you must predict Extra Time and Penalties if the previous stage is a draw.
        </p>
        <form action={async (formData) => {
          if (!is90MinDraw) {
            formData.delete('etHomeScore');
            formData.delete('etAwayScore');
            formData.delete('psHomeScore');
            formData.delete('psAwayScore');
          } else if (!isEtDraw) {
            formData.delete('psHomeScore');
            formData.delete('psAwayScore');
          }
          await submitPrediction(formData);
          onSuccess();
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="hidden" name="matchId" value={match.id} />
          <input type="hidden" name="roomId" value={roomId} />

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
             <h4 style={{ margin: '0 0 1rem 0' }}>90 Minute Score</h4>
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
               <div style={{ flex: 1, textAlign: 'right' }}>{match.home_team}</div>
               <input type="number" name="homeScore" value={h} onChange={e => setH(e.target.value)} required min="0" style={{ width: '80px', textAlign: 'center' }} />
               <span>-</span>
               <input type="number" name="awayScore" value={a} onChange={e => setA(e.target.value)} required min="0" style={{ width: '80px', textAlign: 'center' }} />
               <div style={{ flex: 1, textAlign: 'left' }}>{match.away_team}</div>
             </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-border)', 
            opacity: is90MinDraw ? 1 : 0.5,
            pointerEvents: is90MinDraw ? 'auto' : 'none',
            transition: 'opacity 0.3s ease'
          }}>
             <h4 style={{ margin: '0 0 1rem 0' }}>Extra Time Score</h4>
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
               <div style={{ flex: 1, textAlign: 'right' }}>{match.home_team}</div>
               <input type="number" name="etHomeScore" value={etH} onChange={e => setEtH(e.target.value)} required={is90MinDraw} min="0" style={{ width: '80px', textAlign: 'center' }} disabled={!is90MinDraw} />
               <span>-</span>
               <input type="number" name="etAwayScore" value={etA} onChange={e => setEtA(e.target.value)} required={is90MinDraw} min="0" style={{ width: '80px', textAlign: 'center' }} disabled={!is90MinDraw} />
               <div style={{ flex: 1, textAlign: 'left' }}>{match.away_team}</div>
             </div>
             {is90MinDraw && (
               <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                 Score a.e.t. (After Extra Time): <strong style={{ color: 'var(--color-wimbledon-lime)' }}>{parseInt(h || '0', 10) + parseInt(etH || '0', 10)} - {parseInt(a || '0', 10) + parseInt(etA || '0', 10)}</strong>
               </div>
             )}
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-border)', 
            opacity: isEtDraw ? 1 : 0.5,
            pointerEvents: isEtDraw ? 'auto' : 'none',
            transition: 'opacity 0.3s ease'
          }}>
             <h4 style={{ margin: '0 0 1rem 0' }}>Penalty Shootout Score</h4>
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
               <div style={{ flex: 1, textAlign: 'right' }}>{match.home_team}</div>
               <input type="number" name="psHomeScore" value={psH} onChange={e => setPsH(e.target.value)} required={isEtDraw} min="0" style={{ width: '80px', textAlign: 'center' }} disabled={!isEtDraw} />
               <span>-</span>
               <input type="number" name="psAwayScore" value={psA} onChange={e => setPsA(e.target.value)} required={isEtDraw} min="0" style={{ width: '80px', textAlign: 'center' }} disabled={!isEtDraw} />
               <div style={{ flex: 1, textAlign: 'left' }}>{match.away_team}</div>
             </div>
          </div>

          <button className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem', marginTop: '1rem', opacity: isPsDraw ? 0.5 : 1 }} disabled={isPsDraw}>Save Complete Prediction</button>
          {isPsDraw && (
            <div style={{ color: '#ff4d4f', textAlign: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Penalty shootout cannot end in a draw. Please choose a winner.
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
