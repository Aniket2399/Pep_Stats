import { useMemo, useState } from 'react'
import sample from '../data/sample.json'
import Pitch from '../components/charts/Pitch'
import { ZONE_MAP, zoneForPositionFull, posGroupFull, playerKpis, genPoints, zonesFor } from '../data/pitch'
import type { SquadPlayer } from '../data/types'

const OPP = (sample.historic.standings as { team: string; code: string }[]).filter((t) => t.code !== 'BAR')

const VIEWS: [string, string][] = [['heat', 'Heat'], ['trail', 'Path'], ['points', 'Points']]
const PHASES: [string, string][] = [['all', 'Full'], ['1st', '1st'], ['2nd', '2nd']]
const TITLE: Record<string, string> = { heat: 'Movement Heatmap', trail: 'Movement Path', points: 'Position Map' }
const HEAT_GRAD = 'linear-gradient(90deg, rgba(10,42,107,.7), rgba(10,160,180,.75), rgba(120,210,60,.8), rgba(240,220,40,.85), rgba(240,130,30,.9), rgba(220,30,30,.95))'

export default function Players({ squad, club }: { squad: SquadPlayer[]; club: string }) {
  const zones = useMemo(() => {
    const c: Record<string, number> = {}
    return squad.map((p) => { const i = c[p.position] ?? 0; c[p.position] = i + 1; return zoneForPositionFull(p.position, i) })
  }, [squad])

  const [sel, setSel] = useState(0)
  const [view, setView] = useState('heat')
  const [phase, setPhase] = useState('all')
  const [opp, setOpp] = useState('Real Madrid')

  if (!squad.length) return <div className="panel">No squad data for {club}.</div>
  const idx = Math.min(sel, squad.length - 1)
  const p = squad[idx]
  const zone = ZONE_MAP[zones[idx]] ?? ZONE_MAP.CAM
  const key = `${p.number}-${p.player}`
  const pitchKey = `${key}|${phase}`
  const kpis = playerKpis(key, posGroupFull(p.position))
  const zocc = zonesFor(genPoints(pitchKey, zone, phase)) // [DEF, MID, ATT]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
      {/* LEFT: match + squad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel">
          <div className="field-label">Match</div>
          <select className="sel" value={opp} onChange={(e) => setOpp(e.target.value)}>
            {OPP.map((t) => <option key={t.code} value={t.team}>vs {t.team}</option>)}
          </select>
          <div className="sec-sub" style={{ marginTop: 8 }}>Matchday 27 · Camp Nou · 22 Mar</div>
        </div>
        <div className="panel">
          <div className="field-label">{club} squad</div>
          <div className="squad" style={{ maxHeight: 520 }}>
            {squad.map((pl, i) => (
              <button key={pl.player} className={`pl-item${i === idx ? ' on' : ''}`} onClick={() => setSel(i)}>
                <span className="pl-num">{pl.number}</span>
                <span><span className="pl-name">{pl.player}</span> <span className="pl-pos">{pl.position}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: heatmap panel — 527 x 454 */}
      <div className="panel" style={{ width: '100%', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="pitch-top" style={{ marginBottom: 0 }}>
          <div>
            <div className="sec-title">{TITLE[view]}</div>
            <div className="sec-sub">{p.player} · vs {opp}</div>
          </div>
          <div className="ctlcol">
            <div className="chips">{VIEWS.map(([k, l]) => <button key={k} className={`chip${view === k ? ' on' : ''}`} onClick={() => setView(k)}>{l}</button>)}</div>
            <div className="chips">{PHASES.map(([k, l]) => <button key={k} className={`chip${phase === k ? ' on' : ''}`} onClick={() => setPhase(k)}>{l}</button>)}</div>
          </div>
        </div>
        <div className="pitch-wrap">
          <Pitch playerKey={pitchKey} zone={zone} mode={view} phase={phase} />
        </div>
        <div className="legend" style={{ marginTop: 0 }}>
          <span className="muted" style={{ fontSize: 11, letterSpacing: '.08em' }}>LOW</span>
          <div className="legend-bar" style={{ background: HEAT_GRAD }} />
          <span className="muted" style={{ fontSize: 11, letterSpacing: '.08em' }}>HIGH</span>
          <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>640 touch points</span>
        </div>
      </div>

      {/* RIGHT: player stats + zone occupation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel">
          <div className="phead" style={{ marginBottom: 0 }}>
            <div className="pavatar">{p.number}</div>
            <div>
              <div className="hero-name" style={{ fontSize: 22 }}>{p.player}</div>
              <div className="hero-sub">{p.position} · #{p.number} · Barcelona</div>
            </div>
          </div>
          <div className="kpi-grid" style={{ marginTop: 16 }}>
            <div className="kpi"><div className="kpi-val">{kpis.distance}<span className="kpi-unit"> km</span></div><div className="kpi-label">Distance</div></div>
            <div className="kpi"><div className="kpi-val">{kpis.topspeed}<span className="kpi-unit"> km/h</span></div><div className="kpi-label">Top Speed</div></div>
            <div className="kpi"><div className="kpi-val">{kpis.sprints}</div><div className="kpi-label">Sprints</div></div>
            <div className="kpi"><div className="kpi-val">{kpis.touches}</div><div className="kpi-label">Touches</div></div>
          </div>
        </div>
        <div className="panel">
          <div className="sec-title" style={{ marginBottom: 12 }}>Zone occupation</div>
          {([['Defensive third', zocc[0]], ['Middle third', zocc[1]], ['Attacking third', zocc[2]]] as [string, number][]).map(([label, pct]) => (
            <div key={label} className="zone-row">
              <div className="zone-head"><span>{label}</span><span className="mono">{pct}%</span></div>
              <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
