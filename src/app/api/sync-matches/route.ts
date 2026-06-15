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

    const matchDataList = matches.map((m: any) => {
      const homeName = m.homeTeam.name || 'TBD'
      const awayName = m.awayTeam.name || 'TBD'

      // Realistic odds based on FIFA ranks (lower rank = better)
      const homeRank = getRank(homeName)
      const awayRank = getRank(awayName)

      // Calculate probability based on rank difference
      const rankDiff = awayRank - homeRank // Positive means home is better

      let oddsHome = Math.max(1.05, 2.8 - (rankDiff * 0.02)).toFixed(2)
      let oddsAway = Math.max(1.05, 2.8 + (rankDiff * 0.02)).toFixed(2)
      let oddsDraw = Math.max(2.0, 3.5 - (Math.abs(rankDiff) * 0.01)).toFixed(2)

      return {
        id: m.id,
        home_team: homeName,
        away_team: awayName,
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
        kickoff_time: m.utcDate,
        status: m.status,
        odds_home: oddsHome,
        odds_draw: oddsDraw,
        odds_away: oddsAway
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
      .select('id, home_score, away_score, odds_home, odds_draw, odds_away, status')
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
          .select('id, predicted_home_score, predicted_away_score, points_earned')
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

          const pointsEarned = parseFloat((basePoints * multiplier).toFixed(2))

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
        .select('room_id, user_id, points_earned')

      if (allPredictions) {
        const pointsMap = new Map<string, number>()
        for (const p of allPredictions) {
          const key = `${p.room_id}_${p.user_id}`
          pointsMap.set(key, (pointsMap.get(key) || 0) + p.points_earned)
        }

        const leaderboardPromises = Array.from(pointsMap.entries()).map(([key, totalPoints]) => {
          const [roomId, userId] = key.split('_')
          return supabaseAdmin.from('room_members')
            .update({ total_points: parseFloat(totalPoints.toFixed(2)) })
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
