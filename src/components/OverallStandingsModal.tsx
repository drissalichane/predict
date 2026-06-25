'use client'

import { useEffect, useState } from 'react'
import teamRankingsData from '../../world_cup_2026_teams_ranking.json'

type Match = { id: number, kickoff_time: string, odds_home: number, odds_draw: number, odds_away: number, home_team: string, away_team: string, status?: string, home_score?: number | null, away_score?: number | null }

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
  'Türkiye': 'tr', 'Czechia': 'cz', 'DR Congo': 'cd', 'Uzbekistan': 'uz',
  'Jordan': 'jo', 'Cape Verde': 'cv', 'Bosnia and Herzegovina': 'ba', 'Haiti': 'ht',
  'Curaçao': 'cw', 'Congo DR': 'cd', 'Cape Verde Islands': 'cv', 'Bosnia': 'ba', 'Bosnia-Herzegovina': 'ba'
}

const getSmallFlagUrl = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null
  return `https://flagcdn.com/24x18/${code}.png`
}

export default function OverallStandingsModal({ matches, onClose }: { matches: Match[], onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const nameAliases: Record<string, string> = {
    'USA': 'United States',
    'Turkey': 'Türkiye',
    'Czech Republic': 'Czechia',
    'Congo DR': 'DR Congo',
    'Cape Verde Islands': 'Cape Verde',
    'Bosnia': 'Bosnia and Herzegovina',
    'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
    'Curacao': 'Curaçao'
  }

  type TeamStat = { team: string, played: number, won: number, drawn: number, lost: number, gf: number, ga: number, points: number, group: string }
  
  // Initialize all stats
  const allStats: Record<string, TeamStat> = {}
  teamRankingsData.teams_by_fifa_rank.forEach(t => {
    allStats[t.team] = { team: t.team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, group: t.group }
  })

  const isGroupMatch = (m: Match) => {
    const d = new Date(new Date(m.kickoff_time).getTime() - 6 * 60 * 60 * 1000)
    const month = d.getMonth() + 1
    const day = d.getDate()
    return month === 6 && day <= 27
  }

  matches.forEach(m => {
    const homeJsonName = nameAliases[m.home_team] || m.home_team;
    const awayJsonName = nameAliases[m.away_team] || m.away_team;
    
    if (isGroupMatch(m) && allStats[homeJsonName] && allStats[awayJsonName]) {
      // Only count matches within the same group
      if (allStats[homeJsonName].group === allStats[awayJsonName].group) {
        if (m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null && m.home_score !== undefined && m.away_score !== undefined) {
          const h = allStats[homeJsonName]
          const a = allStats[awayJsonName]
          
          h.played++; a.played++;
          h.gf += m.home_score; a.gf += m.away_score;
          h.ga += m.away_score; a.ga += m.home_score;
          
          if (m.home_score > m.away_score) { h.won++; h.points += 3; a.lost++; }
          else if (m.home_score === m.away_score) { h.drawn++; a.drawn++; h.points += 1; a.points += 1; }
          else { a.won++; a.points += 3; h.lost++; }
        }
      }
    }
  })

  // Group by group letter
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 16, 0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        
        <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-wimbledon-lime)', textAlign: 'center' }}>Overall Standings</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {groups.map(group => {
            const groupTeams = Object.values(allStats).filter(t => t.group === group).sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points
              const gdA = a.gf - a.ga
              const gdB = b.gf - b.ga
              if (gdB !== gdA) return gdB - gdA
              if (b.gf !== a.gf) return b.gf - a.gf
              return a.team.localeCompare(b.team)
            })

            return (
              <div key={group} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-wimbledon-lime)' }}>Group {group}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '0.3rem', textAlign: 'left' }}>Team</th>
                      <th style={{ padding: '0.3rem' }}>P</th>
                      <th style={{ padding: '0.3rem' }}>W</th>
                      <th style={{ padding: '0.3rem' }}>D</th>
                      <th style={{ padding: '0.3rem' }}>L</th>
                      <th style={{ padding: '0.3rem' }}>GD</th>
                      <th style={{ padding: '0.3rem', color: 'var(--color-wimbledon-lime)' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupTeams.map((stat, index) => (
                      <tr key={stat.team} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.3rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem', width: '10px' }}>{index + 1}</span>
                          {getSmallFlagUrl(stat.team) && <img src={getSmallFlagUrl(stat.team)!} alt={stat.team} style={{ width: '16px', height: '12px', flexShrink: 0 }} />}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{stat.team}</span>
                        </td>
                        <td style={{ padding: '0.3rem' }}>{stat.played}</td>
                        <td style={{ padding: '0.3rem' }}>{stat.won}</td>
                        <td style={{ padding: '0.3rem' }}>{stat.drawn}</td>
                        <td style={{ padding: '0.3rem' }}>{stat.lost}</td>
                        <td style={{ padding: '0.3rem' }}>{stat.gf - stat.ga > 0 ? `+${stat.gf - stat.ga}` : stat.gf - stat.ga}</td>
                        <td style={{ padding: '0.3rem', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>{stat.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
