import * as client from '../api/client'
import type { Fixture, PlayerSeason, StandingRow } from '../api/types'
import sample from './sample.json'
import { codeForTeam } from './codes'
import { deriveTeamMetrics } from './deriveWc'
import type { AppData, BracketRound, BracketTie, HistoricStanding, SquadPlayer, WcGroup, WcMatch, WcTeamMetric } from './types'

// team_season row shape (from /api/standings)
interface TeamSeasonRow {
  team_id: number; team: string; matches: number; wins: number; draws: number; losses: number
  gf: number; ga: number; gd: number; points: number
  xg_for: number | null; xg_against: number | null; possession_pct: number | null; ppda: number | null
}

const sampleFormByTeam: Record<string, string> = Object.fromEntries(
  (sample.historic.standings as Array<{ team: string; form: string }>).map((r) => [r.team, r.form]),
)
const sampleNumberByPlayer: Record<string, number> = Object.fromEntries(
  (sample.historic.fc_barcelona_squad as Array<{ player: string; number: number }>).map((p) => [p.player, p.number]),
)
// NOTE: no WC sample maps — World Cup is dynamic-only (user instruction).

export function mapStandings(rows: TeamSeasonRow[]): HistoricStanding[] {
  return [...rows]
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .map((r, i) => ({
      pos: i + 1, code: codeForTeam(r.team), team: r.team, team_id: r.team_id,
      played: r.matches, won: r.wins, drawn: r.draws, lost: r.losses,
      gf: r.gf, ga: r.ga, gd: r.gd, points: r.points, form: sampleFormByTeam[r.team] ?? '',
      xg_for: r.xg_for, xg_against: r.xg_against, possession_pct: r.possession_pct, ppda: r.ppda,
    }))
}

const PCT_KEYS = ['goals_per90', 'assists_per90', 'xg_per90', 'xa_per90', 'shots_per90', 'passes_per90'] as const

export function mapSquads(players: PlayerSeason[]): Record<string, SquadPlayer[]> {
  const byTeam: Record<string, SquadPlayer[]> = {}
  for (const p of players) {
    const percentiles: Record<string, number> = {}
    for (const k of PCT_KEYS) {
      const v = (p as unknown as Record<string, number>)[`percentile_${k}`]
      if (typeof v === 'number') percentiles[k] = v
    }
    const sp: SquadPlayer = {
      number: sampleNumberByPlayer[p.player] ?? 0,
      player_id: p.player_id, player: p.player, position: p.primary_position,
      apps: p.appearances, goals: p.goals, assists: p.assists, minutes: p.minutes,
      pass_pct: null, percentiles,
    }
    ;(byTeam[p.team] ??= []).push(sp)
  }
  for (const team of Object.keys(byTeam)) {
    byTeam[team].sort((a, b) => b.minutes - a.minutes)
    byTeam[team].forEach((p, i) => { if (!p.number) p.number = i + 1 })
  }
  return byTeam
}

export function mapGroups(rows: StandingRow[]): WcGroup[] {
  const order: string[] = []
  const byGroup: Record<string, WcGroup> = {}
  for (const r of rows) {
    if (!byGroup[r.group]) { byGroup[r.group] = { group: r.group, table: [] }; order.push(r.group) }
    byGroup[r.group].table.push({
      pos: r.rank, code: codeForTeam(r.team), team: r.team, flag: r.flag,
      played: r.played, won: r.w, drawn: r.d, lost: r.l, gf: r.gf, ga: r.ga, gd: r.gd, points: r.points,
    })
  }
  order.forEach((g) => byGroup[g].table.sort((a, b) => a.pos - b.pos))
  return order.map((g) => byGroup[g])
}

export function mapWcTeams(rows: StandingRow[]): WcTeamMetric[] {
  // Dynamic-only: purely derived from real standings, no sample overlay.
  return deriveTeamMetrics(rows)
}

/** Winner of a decided tie (both scores present and unequal), else null. */
function bracketWinner(t: BracketTie): { team: string; flag: string } | null {
  if (t.home_team && t.away_team && t.home_score != null && t.away_score != null && t.home_score !== t.away_score) {
    return t.home_score > t.away_score
      ? { team: t.home_team, flag: t.home_flag }
      : { team: t.away_team, flag: t.away_flag }
  }
  return null
}

const pairKey = (a: string, b: string) => [a, b].sort().join(' | ')

const toTie = (stage: string) => (m: WcMatch): BracketTie => ({
  stage, home_team: m.home_team, away_team: m.away_team, home_flag: m.home_flag, away_flag: m.away_flag,
  home_score: m.home_score, away_score: m.away_score, status: m.status,
})
const tbdTie = (stage: string): BracketTie => ({
  stage, home_team: null, away_team: null, home_flag: '', away_flag: '', home_score: null, away_score: null, status: 'UP',
})

/**
 * Build the knockout bracket from ALL real knockout matches. Every recorded
 * match is shown with its real teams and score; rounds/slots not yet played
 * stay TBD (Quarter-finals onward, and R16 ties still to come). R32 feeders are
 * ordered under the R16 tie their winner plays in, so teams sit in the right
 * position. No pairings are ever invented.
 */
export function mapBracket(knockout: WcMatch[]): BracketRound[] {
  const r32src = knockout.filter((m) => /32/.test(m.stage ?? '')).map(toTie('Round of 32'))
  const r16src = knockout.filter((m) => /16/.test(m.stage ?? '')).map(toTie('Round of 16'))
  if (!r32src.length && !r16src.length) return []

  // Position each R32 tie under the R16 tie its winner advanced into.
  const r32ByWinner = new Map<string, BracketTie>()
  for (const t of r32src) { const w = bracketWinner(t); if (w && !r32ByWinner.has(w.team)) r32ByWinner.set(w.team, t) }
  const usedR32 = new Set<BracketTie>()
  const orderedR16: BracketTie[] = []
  const orderedR32: BracketTie[] = []
  const pushFeeder = (team: string | null) => {
    const f = team ? r32ByWinner.get(team) : undefined
    if (f && !usedR32.has(f)) { orderedR32.push(f); usedR32.add(f) } else orderedR32.push(tbdTie('Round of 32'))
  }
  for (const t of r16src) { orderedR16.push(t); pushFeeder(t.home_team); pushFeeder(t.away_team) }
  // R16 ties still to be played — fed by R32 winners not yet in an R16 match.
  const leftover = r32src.filter((t) => !usedR32.has(t))
  for (let i = 0; i < leftover.length; i += 2) {
    orderedR16.push(tbdTie('Round of 16'))
    orderedR32.push(leftover[i]); usedR32.add(leftover[i])
    if (leftover[i + 1]) { orderedR32.push(leftover[i + 1]); usedR32.add(leftover[i + 1]) } else orderedR32.push(tbdTie('Round of 32'))
  }
  while (orderedR16.length < 8) orderedR16.push(tbdTie('Round of 16'))
  while (orderedR32.length < 16) orderedR32.push(tbdTie('Round of 32'))

  // Real results by unordered team pair, so a later-round match that has been
  // played (e.g. a Quarter-final) shows its real score and its winner advances.
  const realByPair = new Map<string, WcMatch>()
  for (const m of knockout) {
    if (m.home_team && m.away_team && m.home_score != null && m.away_score != null) {
      realByPair.set(pairKey(m.home_team, m.away_team), m)
    }
  }

  // Advance winners: each decided tie sends its winner into the next round,
  // replacing a TBD. An undecided feeder leaves that side TBD until it's played.
  // If the advanced pairing has actually been played, overlay its real score.
  const advance = (prev: BracketTie[], stage: string): BracketTie[] => {
    const out: BracketTie[] = []
    for (let i = 0; i < prev.length; i += 2) {
      const a = bracketWinner(prev[i])
      const b = prev[i + 1] ? bracketWinner(prev[i + 1]) : null
      let hs: number | null = null, as: number | null = null, status = 'UP'
      if (a && b) {
        const r = realByPair.get(pairKey(a.team, b.team))
        if (r) {
          const flip = r.home_team !== a.team
          hs = flip ? r.away_score : r.home_score
          as = flip ? r.home_score : r.away_score
          status = r.status
        }
      }
      out.push({
        stage, home_team: a?.team ?? null, away_team: b?.team ?? null,
        home_flag: a?.flag ?? '', away_flag: b?.flag ?? '', home_score: hs, away_score: as, status,
      })
    }
    return out
  }
  const qf = advance(orderedR16, 'Quarter-finals')
  const sf = advance(qf, 'Semi-finals')
  const final = advance(sf, 'Final')

  const rounds: BracketRound[] = []
  if (r32src.length) rounds.push({ stage: 'Round of 32', ties: orderedR32 })
  rounds.push({ stage: 'Round of 16', ties: orderedR16 })
  rounds.push({ stage: 'Quarter-finals', ties: qf })
  rounds.push({ stage: 'Semi-finals', ties: sf })
  rounds.push({ stage: 'Final', ties: final })
  return rounds
}

function mapMatches(rows: client.LiveMatchResult[]): WcMatch[] {
  return rows.map((m) => ({
    id: m.id, home_team: m.home_team, away_team: m.away_team, home_flag: m.home_flag, away_flag: m.away_flag,
    home_score: m.home_score, away_score: m.away_score, status: m.status, minute: m.minute, stage: m.stage, kickoff: m.kickoff,
  }))
}

function mapFixtures(rows: Fixture[]): WcMatch[] {
  return rows.map((f) => ({
    id: f.id, home_team: f.home_team, away_team: f.away_team, home_flag: f.home_flag, away_flag: f.away_flag,
    home_score: null, away_score: null, status: 'SCHEDULED', minute: null, stage: f.stage, kickoff: f.kickoff,
  }))
}

// Fallback used only on total API failure: historic from sample, WC EMPTY
// (World Cup is dynamic-only — never show static WC data).
function sampleAppData(): AppData {
  const s = sample as unknown as {
    historic: { competition: string; standings: HistoricStanding[]; fc_barcelona_squad: SquadPlayer[] }
  }
  return {
    source: 'sample',
    historic: {
      competition: s.historic.competition,
      standings: s.historic.standings,
      squads: { Barcelona: s.historic.fc_barcelona_squad },
    },
    world_cup_2026: { team_metrics: [], group_standings: [], bracket: [], matches: [], fixtures: [] },
  }
}

export async function loadAppData(): Promise<AppData> {
  try {
    const [standings, players, live, matches, fixtures, knockout] = await Promise.all([
      client.getStandings() as Promise<TeamSeasonRow[]>,
      client.getPlayers({}),
      client.getLiveStandings(),
      client.getLiveMatches(),
      client.getLiveFixtures(),
      client.getKnockout(),
    ])
    const wcMatches = mapMatches(matches as client.LiveMatchResult[])
    const wcFixtures = mapFixtures(fixtures)
    const koMatches = mapMatches(knockout as client.LiveMatchResult[])
    const groups = mapGroups(live)
    // WC Overview "latest matches": live window if any, else the latest played
    // knockout round (Round of 16) so recent results always show.
    const latestR16 = koMatches.filter((m) => /16/.test(m.stage ?? ''))
    const overviewMatches = wcMatches.length ? wcMatches : latestR16.length ? latestR16 : koMatches.slice(-6)
    return {
      source: 'live',
      historic: {
        competition: 'La Liga 2015/16',
        standings: mapStandings(standings),
        squads: mapSquads(players),
      },
      world_cup_2026: {
        team_metrics: mapWcTeams(live),
        group_standings: groups,
        bracket: mapBracket(koMatches),
        matches: overviewMatches,
        fixtures: wcFixtures,
      },
    }
  } catch {
    return sampleAppData()
  }
}
