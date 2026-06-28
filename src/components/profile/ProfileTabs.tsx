'use client'

import { useState } from 'react'
import { getOtherPredictions } from '@/app/profile/actions'

type Room = { id: string, name: string, total_points: number, exact_scores: number }
type Prediction = {
  id: string,
  room_id: string,
  predicted_home_score: number,
  predicted_away_score: number,
  predicted_et_home_score?: number | null,
  predicted_et_away_score?: number | null,
  predicted_ps_home_score?: number | null,
  predicted_ps_away_score?: number | null,
  points_earned: number,
  matches: {
    id: number,
    home_team: string,
    away_team: string,
    home_score: number | null,
    away_score: number | null,
    kickoff_time: string,
    status: string
  }
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
  'Paraguay': 'py', 'Venezuela': 've', 'Bolivia': 'bo', 'Iraq': 'iq'
}

const getFlag = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={`https://flagcdn.com/24x18/${code}.png`} width="24" height="18" alt={team} style={{ display: 'inline-block', verticalAlign: 'middle', border: '2px solid #000', borderRadius: '4px', marginLeft: '0.5rem', marginRight: '0.5rem' }} />
}

function StatRow({ label, value, tooltip, color }: { label: string, value: string | number, tooltip: string, color?: string }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {label}
        <div 
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span style={{ fontSize: '0.7rem', opacity: 0.5, cursor: 'pointer', padding: '2px' }}>ⓘ</span>
          
          {isHovered && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '4px',
              background: 'var(--color-surface, #1e1e1e)',
              border: '1px solid var(--color-border, #333)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: 'var(--color-text-primary, #fff)',
              width: 'max-content',
              maxWidth: '220px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 50,
              pointerEvents: 'none',
              lineHeight: '1.4'
            }}>
              {tooltip}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color || 'white' }}>{value}</div>
    </div>
  )
}

export default function ProfileTabs({ rooms, predictions }: { rooms: Room[], predictions: Prediction[] }) {
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || '')
  const [selectedMatch, setSelectedMatch] = useState<{ id: number, home_team: string, away_team: string, home_score: number | null, away_score: number | null } | null>(null)
  const [otherPredictions, setOtherPredictions] = useState<any[]>([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)

  if (rooms.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          You have no common rooms with this user. Predictions are private.
        </p>
      </div>
    )
  }

  const activePredictions = predictions.filter(p => p.room_id === activeRoomId).sort((a, b) => new Date(b.matches.kickoff_time).getTime() - new Date(a.matches.kickoff_time).getTime())

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0]

  const totalMatchesGuessed = activePredictions.length;
  const correctOutcomes = activePredictions.filter(p => {
    if (p.matches.home_score === null || p.matches.away_score === null) return false;
    const actualDiff = p.matches.home_score - p.matches.away_score;
    const predictedDiff = p.predicted_home_score - p.predicted_away_score;
    return (actualDiff > 0 && predictedDiff > 0) || (actualDiff < 0 && predictedDiff < 0) || (actualDiff === 0 && predictedDiff === 0);
  }).length;
  const predictionsOver20 = activePredictions.filter(p => p.points_earned >= 20).length;
  const predictionsOver30 = activePredictions.filter(p => p.points_earned >= 30).length;
  const avgPointsPerGame = totalMatchesGuessed > 0 ? (activeRoom.total_points / totalMatchesGuessed).toFixed(1) : '0';

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ color: 'var(--color-wimbledon-lime)', marginBottom: '1rem' }}>Past Predictions</h2>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => setActiveRoomId(room.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeRoomId === room.id ? 'var(--color-wimbledon-lime)' : 'transparent',
              color: activeRoomId === room.id ? '#000' : 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              cursor: 'pointer',
              fontWeight: activeRoomId === room.id ? 'bold' : 'normal',
              whiteSpace: 'nowrap'
            }}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Room Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Performance Group */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-wimbledon-lime)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <StatRow 
              label="Total Points" 
              value={activeRoom.total_points} 
              tooltip="The total number of points earned across all predictions in this room." 
              color="var(--color-wimbledon-lime)" 
            />
            <StatRow 
              label="Avg Points / Game" 
              value={avgPointsPerGame} 
              tooltip="The average number of points earned per prediction made." 
            />
          </div>
        </div>

        {/* Accuracy Group */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-wimbledon-lime)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Accuracy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <StatRow 
              label="Total Guessed" 
              value={totalMatchesGuessed} 
              tooltip="The total number of match predictions you have made in this room." 
            />
            <StatRow 
              label="Correct Outcomes" 
              value={correctOutcomes} 
              tooltip="The number of times you correctly predicted the winning team or a draw." 
            />
            <StatRow 
              label="Exact Scores" 
              value={activeRoom.exact_scores} 
              tooltip="The number of times you predicted the exact final score of a match." 
            />
          </div>
        </div>

        {/* High Scores Group */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-wimbledon-lime)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>High Scores</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <StatRow 
              label="20+ Pts" 
              value={predictionsOver20} 
              tooltip="The number of predictions where you earned 20 or more points." 
            />
            <StatRow 
              label="30+ Pts" 
              value={predictionsOver30} 
              tooltip="The number of predictions where you earned 30 or more points." 
            />
          </div>
        </div>

      </div>

      {/* Predictions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activePredictions.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>No past predictions in this room.</p>
        ) : (
          activePredictions.map(pred => {
            const isExactScore = pred.matches.home_score !== null && pred.matches.away_score !== null && 
                                 pred.predicted_home_score === pred.matches.home_score && 
                                 pred.predicted_away_score === pred.matches.away_score;
            
            return (
              <div key={pred.id} style={{ position: 'relative', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                {isExactScore && (
                  <div style={{ position: 'absolute', top: '-10px', right: '10px', background: 'var(--color-wimbledon-lime)', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ★ Exact Score
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span>{new Date(pred.matches.kickoff_time).toLocaleDateString()}</span>
                  <span style={{ color: 'var(--color-wimbledon-lime)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{pred.points_earned} pts</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{pred.matches.home_team} {getFlag(pred.matches.home_team)}</span>
                  <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>vs</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 'bold' }}>{getFlag(pred.matches.away_team)} {pred.matches.away_team}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Final Score</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{pred.matches.home_score ?? '-'} - {pred.matches.away_score ?? '-'}</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--color-border)' }}></div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Prediction</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isExactScore ? 'var(--color-wimbledon-lime)' : 'white' }}>
                      {pred.predicted_home_score} - {pred.predicted_away_score}
                    </div>
                    {pred.predicted_et_home_score != null && (
                       <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', textAlign: 'center' }}>
                          ET: {pred.predicted_et_home_score} - {pred.predicted_et_away_score}
                          {pred.predicted_ps_home_score != null && <br/>}
                          {pred.predicted_ps_home_score != null && `Pens: ${pred.predicted_ps_home_score} - ${pred.predicted_ps_away_score}`}
                       </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    onClick={async () => {
                      setSelectedMatch(pred.matches)
                      setIsLoadingPredictions(true)
                      const res = await getOtherPredictions(pred.matches.id, activeRoomId)
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
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--color-wimbledon-lime)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  >
                    View Other Predictions
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

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
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: scoreColor }}>
                              {p.predicted_home_score} - {p.predicted_away_score}
                            </div>
                            {p.predicted_et_home_score != null && (
                               <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                  ET: {p.predicted_et_home_score}-{p.predicted_et_away_score}
                                  {p.predicted_ps_home_score != null && ` | Pens: ${p.predicted_ps_home_score}-${p.predicted_ps_away_score}`}
                               </div>
                            )}
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
