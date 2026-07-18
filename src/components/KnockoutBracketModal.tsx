'use client'

import { useEffect, useState } from 'react'

type Match = { id: number, kickoff_time: string, odds_home: number, odds_draw: number, odds_away: number, home_team: string, away_team: string, status?: string, home_score?: number | null, away_score?: number | null, et_home_score?: number | null, et_away_score?: number | null, ps_home_score?: number | null, ps_away_score?: number | null }

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

const getSmallFlagUrl = (team: string) => {
  const code = countryToCode[team]
  if (!code) return null
  return `https://flagcdn.com/24x18/${code}.png`
}

export default function KnockoutBracketModal({ matches, onClose }: { matches: Match[], onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const getStage = (dateString: string) => {
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

  const knockoutMatches = matches.filter(m => getStage(m.kickoff_time) !== 'Group Stage')

  // Group matches by stage
  const stages = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final']
  
  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 16, 0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto', position: 'relative', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        
        <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-wimbledon-lime)', textAlign: 'center' }}>Knockout Bracket</h2>

        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {stages.map(stage => {
            const stageMatches = knockoutMatches.filter(m => getStage(m.kickoff_time) === stage).sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())
            
            if (stageMatches.length === 0 && stage !== 'Round of 32') return null // Keep empty stages if wanted, but skip to save space if no matches
            
            return (
              <div key={stage} style={{ display: 'flex', flexDirection: 'column', minWidth: '220px', flex: 1 }}>
                <h3 style={{ textAlign: 'center', color: 'var(--color-text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>{stage}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-around', gap: '1rem' }}>
                  {stageMatches.map(m => {
                    const isFinished = m.status === 'FINISHED'
                    const homeWinner = isFinished && ((m.home_score ?? 0) > (m.away_score ?? 0) || (m.ps_home_score ?? 0) > (m.ps_away_score ?? 0))
                    const awayWinner = isFinished && ((m.away_score ?? 0) > (m.home_score ?? 0) || (m.ps_away_score ?? 0) > (m.ps_home_score ?? 0))

                    return (
                      <div key={m.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getSmallFlagUrl(m.home_team) && <img src={getSmallFlagUrl(m.home_team)!} alt="" width={20} height={15} style={{ marginRight: '8px', borderRadius: '2px' }} />}
                            <span style={{ fontWeight: homeWinner ? 'bold' : 'normal', color: m.home_team.includes('TBD') || m.home_team.includes('Winner') ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{m.home_team}</span>
                          </div>
                          <span style={{ fontWeight: homeWinner ? 'bold' : 'normal' }}>{m.home_score ?? '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getSmallFlagUrl(m.away_team) && <img src={getSmallFlagUrl(m.away_team)!} alt="" width={20} height={15} style={{ marginRight: '8px', borderRadius: '2px' }} />}
                            <span style={{ fontWeight: awayWinner ? 'bold' : 'normal', color: m.away_team.includes('TBD') || m.away_team.includes('Winner') ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{m.away_team}</span>
                          </div>
                          <span style={{ fontWeight: awayWinner ? 'bold' : 'normal' }}>{m.away_score ?? '-'}</span>
                        </div>
                        {isFinished && m.ps_home_score !== null && m.ps_away_score !== null && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'right', marginTop: '0.25rem' }}>
                            Pens: {m.ps_home_score} - {m.ps_away_score}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {stageMatches.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', padding: '2rem 0' }}>TBD</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
