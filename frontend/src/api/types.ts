export interface Club { team_id: number; team: string }

export interface PlayerSeason {
  player_id: number; team_id: number; player: string; team: string
  primary_position: string; position_group: string; minutes: number; appearances: number
  goals: number; assists: number; xg: number; xa: number; shots: number
  percentile_goals_per90: number; percentile_assists_per90: number
  percentile_xg_per90: number; percentile_xa_per90: number; percentile_shots_per90: number
  percentile_passes_per90: number; percentile_prog_passes_per90: number
  percentile_pressures_per90: number; percentile_tackles_per90: number
  percentile_interceptions_per90: number
  [key: string]: string | number
}

export interface Shot {
  shot_id: string; team_id: number; player_id: number; minute: number
  location_x: number; location_y: number; shot_statsbomb_xg: number
  outcome: string; body_part: string; shot_type: string
}

export interface LiveMatch {
  id: number; home_team: string; away_team: string; home_flag: string; away_flag: string
  home_score: number | null; away_score: number | null
  status: string; minute: number | null; stage: string | null; kickoff: string
}
export interface Fixture {
  id: number; home_team: string; away_team: string; home_flag: string; away_flag: string
  stage: string | null; kickoff: string
}
export interface StandingRow {
  group: string; rank: number; team: string; flag: string
  played: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; points: number
}
export interface Meta { historic_updated: string | null; live_updated: string | null; source: string }
