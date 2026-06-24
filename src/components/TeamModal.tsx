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
  'Curaçao': 'cw'
}

const getFlagUrl = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null
  return `https://flagcdn.com/48x36/${code}.png`
}

const getSmallFlagUrl = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null
  return `https://flagcdn.com/24x18/${code}.png`
}

export default function TeamModal({ teamName, matches, onClose }: { teamName: string, matches: Match[], onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const nameAliases: Record<string, string> = {
    'USA': 'United States',
    'Turkey': 'Türkiye',
    'Czech Republic': 'Czechia'
  }

  const normalizedName = nameAliases[teamName] || teamName
  const teamInfo = teamRankingsData.teams_by_fifa_rank.find(t => t.team === normalizedName || t.team === teamName)

  const teamMatches = matches.filter(m => m.home_team === teamName || m.away_team === teamName).sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())

  const reverseAliases: Record<string, string> = {
    'United States': 'USA',
    'Türkiye': 'Turkey',
    'Czechia': 'Czech Republic'
  }

  const groupTeams = teamInfo ? teamRankingsData.teams_by_fifa_rank.filter(t => t.group === teamInfo.group).map(t => t.team) : []
  const groupTeamNamesInMatches = groupTeams.map(t => reverseAliases[t] || t)

  type TeamStat = { team: string, played: number, won: number, drawn: number, lost: number, gf: number, ga: number, points: number }
  const groupStats: Record<string, TeamStat> = {}
  groupTeamNamesInMatches.forEach(t => {
    groupStats[t] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
  })

  const isGroupMatch = (m: Match) => {
    const d = new Date(new Date(m.kickoff_time).getTime() - 6 * 60 * 60 * 1000)
    const month = d.getMonth() + 1
    const day = d.getDate()
    return month === 6 && day <= 27
  }

  matches.forEach(m => {
    if (isGroupMatch(m) && groupTeamNamesInMatches.includes(m.home_team) && groupTeamNamesInMatches.includes(m.away_team)) {
      if (m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null && m.home_score !== undefined && m.away_score !== undefined) {
        const h = groupStats[m.home_team]
        const a = groupStats[m.away_team]
        if (!h || !a) return
        
        h.played++; a.played++;
        h.gf += m.home_score; a.gf += m.away_score;
        h.ga += m.away_score; a.ga += m.home_score;
        
        if (m.home_score > m.away_score) { h.won++; h.points += 3; a.lost++; }
        else if (m.home_score === m.away_score) { h.drawn++; a.drawn++; h.points += 1; a.points += 1; }
        else { a.won++; a.points += 3; h.lost++; }
      }
    }
  })

  const sortedGroupStats = Object.values(groupStats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.gf - a.ga
    const gdB = b.gf - b.ga
    if (gdB !== gdA) return gdB - gdA
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team)
  })

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 16, 0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          {getFlagUrl(teamName) && (
            <img src={getFlagUrl(teamName)!} alt={teamName} style={{ border: '2px solid #000', borderRadius: '4px' }} />
          )}
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-wimbledon-lime)' }}>{teamName}</h2>
            {teamInfo && <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{teamInfo.confederation}</div>}
          </div>
        </div>

        {teamInfo && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>FIFA Rank</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>#{teamInfo.fifa_rank}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Group</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{teamInfo.group}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Best World Cup Result</div>
              <div style={{ fontWeight: 'bold' }}>{teamInfo.best_world_cup_result}</div>
            </div>
          </div>
        )}

        {teamInfo && (
          <>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Group {teamInfo.group} Standing</h3>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Team</th>
                    <th style={{ padding: '0.5rem' }}>P</th>
                    <th style={{ padding: '0.5rem' }}>W</th>
                    <th style={{ padding: '0.5rem' }}>D</th>
                    <th style={{ padding: '0.5rem' }}>L</th>
                    <th style={{ padding: '0.5rem' }}>GD</th>
                    <th style={{ padding: '0.5rem', color: 'var(--color-wimbledon-lime)' }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroupStats.map((stat, index) => {
                    const isSelected = stat.team === teamName
                    return (
                      <tr key={stat.team} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                        <td style={{ padding: '0.5rem', textAlign: 'left', fontWeight: isSelected ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', width: '12px' }}>{index + 1}</span>
                          {getSmallFlagUrl(stat.team) && <img src={getSmallFlagUrl(stat.team)!} alt={stat.team} style={{ width: '16px', height: '12px' }} />}
                          {stat.team}
                        </td>
                        <td style={{ padding: '0.5rem' }}>{stat.played}</td>
                        <td style={{ padding: '0.5rem' }}>{stat.won}</td>
                        <td style={{ padding: '0.5rem' }}>{stat.drawn}</td>
                        <td style={{ padding: '0.5rem' }}>{stat.lost}</td>
                        <td style={{ padding: '0.5rem' }}>{stat.gf - stat.ga > 0 ? `+${stat.gf - stat.ga}` : stat.gf - stat.ga}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-wimbledon-lime)' }}>{stat.points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Matches</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {teamMatches.length > 0 ? teamMatches.map(m => {
            const isHome = m.home_team === teamName
            const opponent = isHome ? m.away_team : m.home_team
            const date = new Date(m.kickoff_time)
            
            let resultColor = 'var(--color-text-secondary)'
            let resultText = '-'
            if (m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null && m.home_score !== undefined && m.away_score !== undefined) {
              const scored = isHome ? m.home_score : m.away_score
              const conceded = isHome ? m.away_score : m.home_score
              resultText = `${scored} - ${conceded}`
              if (scored > conceded) resultColor = 'var(--color-success, #4ade80)'
              else if (scored < conceded) resultColor = 'var(--color-danger, #f87171)'
              else resultColor = 'var(--color-warning, #facc15)'
            } else {
              resultText = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }

            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>vs</span>
                  {getSmallFlagUrl(opponent) && <img src={getSmallFlagUrl(opponent)!} alt={opponent} style={{ width: '16px', height: '12px' }} />}
                  <span style={{ fontWeight: 'bold' }}>{opponent}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: resultColor }}>
                  {resultText}
                </div>
              </div>
            )
          }) : (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No matches found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
