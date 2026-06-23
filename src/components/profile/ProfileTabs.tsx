'use client'

import { useState } from 'react'

type Room = { id: string, name: string, total_points: number, exact_scores: number }
type Prediction = {
  id: string,
  room_id: string,
  predicted_home_score: number,
  predicted_away_score: number,
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

export default function ProfileTabs({ rooms, predictions }: { rooms: Room[], predictions: Prediction[] }) {
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || '')

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
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Points</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>{activeRoom.total_points}</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Exact Scores</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeRoom.exact_scores}</div>
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
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Prediction</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isExactScore ? 'var(--color-wimbledon-lime)' : 'white' }}>
                      {pred.predicted_home_score} - {pred.predicted_away_score}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
