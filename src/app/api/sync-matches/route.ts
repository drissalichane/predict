import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  // 1. Secure endpoint via Vercel Cron authentication
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const token = process.env.API_FOOTBALL_DATA_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'No API token' }, { status: 500 })
  }

  // Create admin client to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: {
        'X-Auth-Token': token
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`)
    }

    const data = await res.json()
    const matches = data.matches

    if (!matches || !Array.isArray(matches)) {
      throw new Error('Invalid match data')
    }

    let updatedCount = 0;

    // Load rankings
    let rankingsData: any = { teams_by_fifa_rank: [] }
    try {
      const rankingsPath = path.join(process.cwd(), 'world_cup_2026_teams_ranking.json')
      const fileContent = fs.readFileSync(rankingsPath, 'utf-8')
      rankingsData = JSON.parse(fileContent)
    } catch (e) {
      console.warn('Could not load rankings file', e)
    }

    const getRank = (teamName: string) => {
      // Basic normalization
      const name = teamName.replace('Republic', '').trim()
      const t = rankingsData.teams_by_fifa_rank.find((x: any) => x.team.includes(name) || name.includes(x.team))
      return t ? t.fifa_rank : 100 // default rank 100
    }

    // Fetch existing matches to preserve manually updated odds
    const { data: existingMatches } = await supabaseAdmin
      .from('matches')
      .select('id, odds_home, odds_draw, odds_away')
      
    const existingMatchesMap = new Map(existingMatches?.map((m: any) => [m.id, m]) || [])

    const matchDataList = matches.map((m: any) => {
      const homeName = m.homeTeam.name || 'TBD'
      const awayName = m.awayTeam.name || 'TBD'

      // Realistic odds based on FIFA ranks (lower rank = better)
      const homeRank = getRank(homeName)
      const awayRank = getRank(awayName)

      // Calculate probability based on rank difference
      const rankDiff = awayRank - homeRank // Positive means home is better

      const existingMatch = existingMatchesMap.get(m.id)

      let oddsHome = existingMatch?.odds_home ?? Math.max(1.05, 2.8 - (rankDiff * 0.02)).toFixed(2)
      let oddsAway = existingMatch?.odds_away ?? Math.max(1.05, 2.8 + (rankDiff * 0.02)).toFixed(2)
      let oddsDraw = existingMatch?.odds_draw ?? Math.max(2.0, 3.5 - (Math.abs(rankDiff) * 0.01)).toFixed(2)

      let inferredDuration = m.score?.duration || 'REGULAR';
      if (m.score?.penalties?.home != null) {
        inferredDuration = 'PENALTY_SHOOTOUT';
      } else if (m.score?.extraTime?.home != null) {
        inferredDuration = 'EXTRA_TIME';
      }

      let homeScore = m.score?.regularTime?.home;
      let awayScore = m.score?.regularTime?.away;

      if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
        if ((inferredDuration === 'EXTRA_TIME' || inferredDuration === 'PENALTY_SHOOTOUT') &&
            m.score?.fullTime?.home !== undefined && m.score?.fullTime?.home !== null &&
            m.score?.extraTime?.home !== undefined && m.score?.extraTime?.home !== null) {
          homeScore = m.score.fullTime.home - m.score.extraTime.home;
          awayScore = m.score.fullTime.away - m.score.extraTime.away;
        } else {
          homeScore = m.score?.fullTime?.home ?? null;
          awayScore = m.score?.fullTime?.away ?? null;
        }
      }

      let psHomeScore = m.score?.penalties?.home ?? null;
      let psAwayScore = m.score?.penalties?.away ?? null;

      // Fix for API anomaly where penalties might show a draw but fullTime has the actual outcome
      if (inferredDuration === 'PENALTY_SHOOTOUT' && psHomeScore !== null && psAwayScore !== null && psHomeScore === psAwayScore) {
        const ftHome = m.score?.fullTime?.home;
        const ftAway = m.score?.fullTime?.away;
        if (ftHome !== undefined && ftAway !== undefined && ftHome !== ftAway) {
          const cumPsHome = ftHome - (m.score?.regularTime?.home || 0) - (m.score?.extraTime?.home || 0);
          const cumPsAway = ftAway - (m.score?.regularTime?.away || 0) - (m.score?.extraTime?.away || 0);
          if (cumPsHome !== cumPsAway && cumPsHome >= 0 && cumPsAway >= 0) {
            psHomeScore = cumPsHome;
            psAwayScore = cumPsAway;
          } else {
            psHomeScore = ftHome;
            psAwayScore = ftAway;
          }
        }
      }

      return {
        id: m.id,
        home_team: homeName,
        away_team: awayName,
        home_score: homeScore,
        away_score: awayScore,
        kickoff_time: m.utcDate,
        status: m.status,
        odds_home: oddsHome,
        odds_draw: oddsDraw,
        odds_away: oddsAway,
        duration: inferredDuration,
        et_home_score: m.score?.extraTime?.home ?? null,
        et_away_score: m.score?.extraTime?.away ?? null,
        ps_home_score: psHomeScore,
        ps_away_score: psAwayScore
      }
    })

    const { error: upsertError } = await supabaseAdmin.from('matches').upsert(matchDataList)
    if (upsertError) {
      console.error('Matches upsert error:', upsertError)
      throw new Error(`Failed to upsert matches: ${upsertError.message}`)
    }
    
    updatedCount = matchDataList.length;

    // ----------------------------------------------------
    // SCORING ENGINE
    // ----------------------------------------------------
    console.log("Running scoring engine...")
    const scoreStatus = process.env.TEST_SCORING === 'true' ? ['FINISHED', 'TIMED'] : ['FINISHED']

    // 1. Fetch matches that are finished
    const { data: finishedMatches } = await supabaseAdmin
      .from('matches')
      .select('id, home_score, away_score, odds_home, odds_draw, odds_away, status, duration, et_home_score, et_away_score, ps_home_score, ps_away_score')
      .in('status', scoreStatus)

    if (finishedMatches && finishedMatches.length > 0) {
      for (const fm of finishedMatches) {
        // Skip if scores are null
        if (fm.home_score === null || fm.away_score === null) {
          // If testing with TIMED, mock some scores
          if (process.env.TEST_SCORING === 'true') {
            if (fm.id === 537327) {
              fm.home_score = 1
              fm.away_score = 1
            } else if (fm.id === 537328) {
              fm.home_score = 1
              fm.away_score = 0
            } else {
              continue
            }
          } else {
            continue
          }
        }

        // Fetch predictions for this match
        const { data: predictions } = await supabaseAdmin
          .from('predictions')
          .select('id, predicted_home_score, predicted_away_score, points_earned, predicted_et_home_score, predicted_et_away_score, predicted_ps_home_score, predicted_ps_away_score')
          .eq('match_id', fm.id)

        if (!predictions) continue

        const predictionPromises = predictions.map((pred: any) => {
          const ph = pred.predicted_home_score
          const pa = pred.predicted_away_score
          const ah = fm.home_score
          const aa = fm.away_score

          let basePoints = 0

          // Exact Score
          if (ph === ah && pa === aa) {
            basePoints = 10
          }
          // Correct Outcome
          else if ((ph > pa && ah > aa) || (ph < pa && ah < aa) || (ph === pa && ah === aa)) {
            basePoints = 5
          }

          // Multiplier
          let multiplier = fm.odds_draw
          if (ph > pa) multiplier = fm.odds_home
          if (ph < pa) multiplier = fm.odds_away

          let pointsEarned = parseFloat((basePoints * multiplier).toFixed(2))

          // ET Bonus
          if ((fm.duration === 'EXTRA_TIME' || fm.duration === 'PENALTY_SHOOTOUT') && ph === pa) {
            const petH = pred.predicted_et_home_score;
            const petA = pred.predicted_et_away_score;
            const aetH = fm.et_home_score;
            const aetA = fm.et_away_score;

            if (petH !== null && petA !== null && aetH !== null && aetA !== null) {
              let etMultiplier = fm.odds_draw;
              if (petH > petA) etMultiplier = fm.odds_home;
              if (petH < petA) etMultiplier = fm.odds_away;

              if (petH === aetH && petA === aetA) {
                pointsEarned += parseFloat((5.0 * etMultiplier).toFixed(2))
              } else if ((petH > petA && aetH > aetA) || (petH < petA && aetH < aetA) || (petH === petA && aetH === aetA)) {
                pointsEarned += parseFloat((2.5 * etMultiplier).toFixed(2))
              }
            }
          }

          // PS Bonus
          if (fm.duration === 'PENALTY_SHOOTOUT' && ph === pa) {
            const petH = pred.predicted_et_home_score;
            const petA = pred.predicted_et_away_score;
            const ppsH = pred.predicted_ps_home_score;
            const ppsA = pred.predicted_ps_away_score;
            const apsH = fm.ps_home_score;
            const apsA = fm.ps_away_score;
            
            // Only reward if they also predicted a draw in ET
            if (petH === petA && ppsH !== null && ppsA !== null && apsH !== null && apsA !== null) {
              let psMultiplier = fm.odds_draw;
              if (ppsH > ppsA) psMultiplier = fm.odds_home;
              if (ppsH < ppsA) psMultiplier = fm.odds_away;

              if (ppsH === apsH && ppsA === apsA) {
                pointsEarned += parseFloat((5.0 * psMultiplier).toFixed(2))
              } else if ((ppsH > ppsA && apsH > apsA) || (ppsH < ppsA && apsH < apsA)) {
                pointsEarned += parseFloat((2.5 * psMultiplier).toFixed(2))
              }
            }
          }

          // Late Qualification Bonus
          if (ah === aa && ph !== pa && (fm.duration === 'EXTRA_TIME' || fm.duration === 'PENALTY_SHOOTOUT')) {
            const pickedHome = ph > pa;
            let qualifiedInET = false;
            let qualifiedInPS = false;

            if (fm.duration === 'EXTRA_TIME') {
              const aetH = fm.et_home_score;
              const aetA = fm.et_away_score;
              if (aetH !== null && aetA !== null) {
                if (pickedHome && aetH > aetA) qualifiedInET = true;
                if (!pickedHome && aetH < aetA) qualifiedInET = true;
              }
            } else if (fm.duration === 'PENALTY_SHOOTOUT') {
              const apsH = fm.ps_home_score;
              const apsA = fm.ps_away_score;
              if (apsH !== null && apsA !== null) {
                if (pickedHome && apsH > apsA) qualifiedInPS = true;
                if (!pickedHome && apsH < apsA) qualifiedInPS = true;
              }
            }

            if (qualifiedInET) {
              pointsEarned += parseFloat((2.0 * (pickedHome ? fm.odds_home : fm.odds_away)).toFixed(2));
            } else if (qualifiedInPS) {
              pointsEarned += parseFloat((2.0 * (pickedHome ? fm.odds_home : fm.odds_away)).toFixed(2));
            }
          }

          // Early Qualification Bonus (Predicted draw in 90m, predicted winner in ET/PS, but actual match won in 90m by predicted winner)
          if (ah !== null && aa !== null && ah !== aa && ph === pa) {
            const actualHomeWon = ah > aa;
            let predictedWinnerInET = false;
            let predictedWinnerInPS = false;
            let predictedHomeWon = false;

            const petH = pred.predicted_et_home_score;
            const petA = pred.predicted_et_away_score;
            
            if (petH !== null && petA !== null) {
              if (petH !== petA) {
                predictedWinnerInET = true;
                predictedHomeWon = petH > petA;
              } else {
                const ppsH = pred.predicted_ps_home_score;
                const ppsA = pred.predicted_ps_away_score;
                if (ppsH !== null && ppsA !== null && ppsH !== ppsA) {
                  predictedWinnerInPS = true;
                  predictedHomeWon = ppsH > ppsA;
                }
              }
            }

            if ((predictedWinnerInET || predictedWinnerInPS) && actualHomeWon === predictedHomeWon) {
              if (predictedWinnerInET) {
                pointsEarned += parseFloat((2.0 * (predictedHomeWon ? fm.odds_home : fm.odds_away)).toFixed(2));
              } else if (predictedWinnerInPS) {
                pointsEarned += parseFloat((2.0 * (predictedHomeWon ? fm.odds_home : fm.odds_away)).toFixed(2));
              }
            }
          }

          pointsEarned = parseFloat(pointsEarned.toFixed(2))

          // Update if changed
          if (pred.points_earned !== pointsEarned) {
            return supabaseAdmin.from('predictions')
              .update({ points_earned: pointsEarned })
              .eq('id', pred.id)
          }
          return null
        }).filter(Boolean)

        await Promise.all(predictionPromises)
      }

      // 2. Aggregate points and update leaderboards
      console.log("Updating leaderboards...")
      const { data: allPredictions } = await supabaseAdmin
        .from('predictions')
        .select(`
          room_id, 
          user_id, 
          points_earned,
          predicted_home_score,
          predicted_away_score,
          matches ( home_score, away_score, status, kickoff_time )
        `)

      if (allPredictions) {
        // Fetch current members to check if points changed and to save current rank
        const { data: currentMembers } = await supabaseAdmin
          .from('room_members')
          .select('room_id, user_id, total_points, exact_scores, knockout_points, knockout_exact_scores')

        // Build current ranks per room
        const roomRanks = new Map<string, string[]>()
        const knockoutRoomRanks = new Map<string, string[]>()
        const pointsMap = new Map<string, { totalPoints: number, totalExact: number, knockoutPoints: number, knockoutExact: number }>()
        
        if (currentMembers) {
          // Sort for total points
          const sortedTotal = [...currentMembers].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
          for (const m of sortedTotal) {
            if (!roomRanks.has(m.room_id)) roomRanks.set(m.room_id, [])
            roomRanks.get(m.room_id)!.push(m.user_id)
            
            // Initialize everyone to 0 points
            pointsMap.set(`${m.room_id}_${m.user_id}`, { totalPoints: 0, totalExact: 0, knockoutPoints: 0, knockoutExact: 0 })
          }

          // Sort for knockout points
          const sortedKnockout = [...currentMembers].sort((a, b) => (b.knockout_points || 0) - (a.knockout_points || 0));
          for (const m of sortedKnockout) {
            if (!knockoutRoomRanks.has(m.room_id)) knockoutRoomRanks.set(m.room_id, [])
            knockoutRoomRanks.get(m.room_id)!.push(m.user_id)
          }
        }

        for (const p of allPredictions) {
          const m: any = p.matches;
          if (!m) continue;

          // Calculate if this is a group stage match
          const d = new Date(new Date(m.kickoff_time).getTime() - 6 * 60 * 60 * 1000)
          const month = d.getMonth() + 1
          const day = d.getDate()
          const isGroupStage = month === 6 && day <= 27

          const key = `${p.room_id}_${p.user_id}`
          const current = pointsMap.get(key) || { totalPoints: 0, totalExact: 0, knockoutPoints: 0, knockoutExact: 0 }
          
          let isExact = false;
          if (m.status === 'FINISHED' || process.env.TEST_SCORING === 'true') {
             if (m.home_score !== null && m.away_score !== null) {
                if (p.predicted_home_score === m.home_score && p.predicted_away_score === m.away_score) {
                   isExact = true;
                }
             }
          }

          const newTotalPoints = current.totalPoints + p.points_earned;
          const newTotalExact = current.totalExact + (isExact ? 1 : 0);
          
          let newKnockoutPoints = current.knockoutPoints;
          let newKnockoutExact = current.knockoutExact;

          if (!isGroupStage) {
             newKnockoutPoints += p.points_earned;
             newKnockoutExact += (isExact ? 1 : 0);
          }

          pointsMap.set(key, {
            totalPoints: newTotalPoints,
            totalExact: newTotalExact,
            knockoutPoints: newKnockoutPoints,
            knockoutExact: newKnockoutExact
          })
        }

        const roomHasChanges = new Set<string>()
        
        for (const [key, data] of pointsMap.entries()) {
          const [roomId, userId] = key.split('_')
          const member = currentMembers?.find(m => m.room_id === roomId && m.user_id === userId)
          const currentTotal = member?.total_points || 0
          const currentExact = member?.exact_scores || 0
          const currentKo = member?.knockout_points || 0
          const currentKoExact = member?.knockout_exact_scores || 0

          const newTotal = parseFloat(data.totalPoints.toFixed(2))
          const newKo = parseFloat(data.knockoutPoints.toFixed(2))

          if (currentTotal !== newTotal || currentExact !== data.totalExact || currentKo !== newKo || currentKoExact !== data.knockoutExact) {
            roomHasChanges.add(roomId)
          }
        }

        const leaderboardPromises = Array.from(pointsMap.entries()).map(([key, data]) => {
          const [roomId, userId] = key.split('_')
          const newTotal = parseFloat(data.totalPoints.toFixed(2))
          const newKo = parseFloat(data.knockoutPoints.toFixed(2))
          
          const updateData: any = { 
             total_points: newTotal,
             exact_scores: data.totalExact,
             knockout_points: newKo,
             knockout_exact_scores: data.knockoutExact
          }

          if (roomHasChanges.has(roomId)) {
             // Snapshot current rank before updating
             const currentRank = (roomRanks.get(roomId)?.indexOf(userId) ?? -1) + 1;
             if (currentRank > 0) {
               updateData.previous_rank = currentRank;
             }
             const currentKoRank = (knockoutRoomRanks.get(roomId)?.indexOf(userId) ?? -1) + 1;
             if (currentKoRank > 0) {
               updateData.knockout_previous_rank = currentKoRank;
             }
          }

          return supabaseAdmin.from('room_members')
            .update(updateData)
            .eq('room_id', roomId)
            .eq('user_id', userId)
        })
        
        await Promise.all(leaderboardPromises)
      }
    }

    revalidatePath('/', 'layout')
    
    return NextResponse.json({ success: true, count: updatedCount, message: 'Sync and scoring completed' })

  } catch (error: any) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
