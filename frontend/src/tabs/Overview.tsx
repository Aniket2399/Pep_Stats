import Donut from '../components/charts/Donut'
import { crestStyle } from '../data/kits'
import type { HistoricStanding, SquadPlayer } from '../data/types'

// seeded form guide (reproduces the wireframe's formFor)
function seedStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function rng(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}
function formFor(code: string, w: number, d: number, n: number): string[] {
  const r = rng(seedStr('fg' + code) + 2)
  return Array.from({ length: n }, () => { const x = r(); return x < w / 38 ? 'w' : x < (w + d) / 38 ? 'd' : 'l' })
}
const ord = (n: number) => (n % 10 === 1 && n !== 11) ? 'st' : (n % 10 === 2 && n !== 12) ? 'nd' : (n % 10 === 3 && n !== 13) ? 'rd' : 'th'

function Kpi({ val, unit, label }: { val: string | number; unit?: string; label: string }) {
  return (
    <div className="kpi">
      <div className="kpi-val">{val}{unit && <span className="kpi-unit"> {unit}</span>}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

export default function Overview({ team, squad }: { team: HistoricStanding; squad: SquadPlayer[] }) {
  const champ = team.pos === 1
  const heroSub = champ ? 'La Liga 2015/16 · Champions of Spain' : `La Liga 2015/16 · ${team.pos}${ord(team.pos)} in the table`
  const form = formFor(team.code, team.won, team.drawn, 6)
  const cleanSheets = Math.max(2, Math.round((1 - team.ga / 70) * 20))

  const poss = typeof team.possession_pct === 'number' ? Math.round(team.possession_pct) : 50
  const shot = { goals: team.gf, on: Math.round(team.gf * 1.9), off: Math.round(team.gf * 1.6), blocked: Math.round(team.gf * 0.6) }
  const totalShots = shot.goals + shot.on + shot.off + shot.blocked
  const scorers = [...squad].sort((a, b) => b.goals - a.goals).slice(0, 5)

  return (
    <div>
      <div className="panel hero">
        <div className="crest" style={crestStyle(team.code)}>{team.code}</div>
        <div>
          <div className="hero-name">{team.team}{champ && <span className="champ">★ Champions</span>}</div>
          <div className="hero-sub">{heroSub}</div>
        </div>
        <div className="form-row">
          {form.map((f, i) => <div key={i} className={`fp ${f}`}>{f.toUpperCase()}</div>)}
        </div>
      </div>

      <div className="kpi-strip">
        <Kpi val={team.points} label="Points" />
        <Kpi val={`${team.won}-${team.drawn}-${team.lost}`} unit="W-D-L" label="Record" />
        <Kpi val={team.gf} label="Goals For" />
        <Kpi val={team.ga} label="Goals Against" />
        <Kpi val={`${team.gd > 0 ? '+' : ''}${team.gd}`} label="Goal Diff" />
        <Kpi val={cleanSheets} label="Clean Sheets" />
      </div>

      <div className="ov-grid">
        <div className="panel">
          <div className="sec-title">Possession</div>
          <Donut centerValue={`${poss}%`} centerLabel="AVG" segments={[
            { label: team.team, value: poss, color: '#2f7fe0' },
            { label: 'Opponents', value: 100 - poss, color: '#39424e' },
          ]} />
        </div>

        <div className="panel">
          <div className="sec-title">Shot outcomes</div>
          <Donut centerValue={totalShots} centerLabel="SHOTS" segments={[
            { label: 'Goals', value: shot.goals, color: '#1a9e4b' },
            { label: 'On target', value: shot.on, color: '#2f7fe0' },
            { label: 'Off target', value: shot.off, color: '#39424e' },
            { label: 'Blocked', value: shot.blocked, color: '#e8792b' },
          ]} />
        </div>

        <div className="panel">
          <div className="sec-title">Top Scorers</div>
          {scorers.map((p, i) => (
            <div className="scorer" key={p.player}>
              <span className="sc-rank">{i + 1}</span>
              <div><div className="sc-name">{p.player}</div><div className="sc-pos">{p.position}</div></div>
              <span className="sc-goals">{p.goals}</span>
              <span className="sc-assist">{p.assists} A</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
