import sample from './sample.json'

function build(): Record<string, string> {
  const m: Record<string, string> = {}
  for (const r of sample.historic.standings as Array<{ team: string; code: string }>) m[r.team] = r.code
  for (const t of sample.world_cup_2026.team_metrics as Array<{ team: string; code: string }>) m[t.team] = t.code
  for (const g of sample.world_cup_2026.group_standings as Array<{ table: Array<{ team: string; code: string }> }>)
    for (const row of g.table) m[row.team] = row.code
  return m
}

export const nameToCode: Record<string, string> = build()

export function codeForTeam(name: string): string {
  if (nameToCode[name]) return nameToCode[name]
  const letters = (name.match(/[A-Za-z]/g) ?? []).join('')
  return letters.slice(0, 3).toUpperCase() || '???'
}
