export interface HistoricStanding {
  pos: number; code: string; team: string; team_id: number | null
  played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number; points: number; form: string
  xg_for: number | null; xg_against: number | null
  possession_pct: number | null; ppda: number | null
}

export interface SquadPlayer {
  number: number; player_id: number | null; player: string; position: string
  apps: number; goals: number; assists: number; minutes: number
  pass_pct: number | null
  /** percentile_* fields (0..100) used for the radar; keyed without the prefix, e.g. goals_per90 */
  percentiles: Record<string, number>
}

export interface WcTeamMetric {
  rank: number; code: string; team: string
  possession_pct: number; xg_for: number; xg_against: number
  shots: number; shots_on_target: number; pass_pct: number
  ppda: number; team_rating: number
  /** true when rank/rating/goal figures were derived from real standings */
  derived: boolean
}

export interface WcGroupRow {
  pos: number; code: string; team: string; flag: string
  played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number; points: number
}
export interface WcGroup { group: string; table: WcGroupRow[] }

export interface WcMatch {
  id: number; home_team: string; away_team: string
  home_flag: string; away_flag: string
  home_score: number | null; away_score: number | null
  status: string; minute: number | null; stage: string | null; kickoff: string
}

export interface BracketTie {
  stage: string
  home_team: string | null; away_team: string | null
  home_flag: string; away_flag: string
  home_score: number | null; away_score: number | null
  status: string
}
export interface BracketRound { stage: string; ties: BracketTie[] }

export interface AppData {
  source: 'live' | 'sample'
  historic: {
    competition: string
    standings: HistoricStanding[]
    /** squads keyed by team name */
    squads: Record<string, SquadPlayer[]>
  }
  world_cup_2026: {
    team_metrics: WcTeamMetric[]
    group_standings: WcGroup[]
    bracket: BracketRound[]
    matches: WcMatch[]     // finished/live knockout matches (WC Overview live cards)
    fixtures: WcMatch[]    // upcoming fixtures (WC Overview "Upcoming"); scores null
  }
}
