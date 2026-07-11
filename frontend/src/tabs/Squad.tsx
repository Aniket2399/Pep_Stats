import { useState } from 'react'
import { posGroupFull } from '../data/pitch'
import type { SquadPlayer } from '../data/types'

interface RowT { number: number; player: string; position: string; apps: number; goals: number; assists: number; minutes: number; passing: number }
const FILTERS: [string, string][] = [['all', 'All'], ['GK', 'GK'], ['DEF', 'Def'], ['MID', 'Mid'], ['FWD', 'Fwd']]
const COLS: [keyof RowT, string][] = [['apps', 'Apps'], ['goals', 'Goals'], ['assists', 'Assists'], ['minutes', 'Mins'], ['passing', 'Passing']]

export default function Squad({ squad, club }: { squad: SquadPlayer[]; club: string }) {
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState<keyof RowT>('goals')
  const [dir, setDir] = useState<1 | -1>(-1)

  if (!squad.length) return <div className="panel">No squad data for {club}.</div>

  const rows: RowT[] = squad.map((p) => ({
    number: p.number, player: p.player, position: p.position,
    apps: p.apps, goals: p.goals, assists: p.assists, minutes: p.minutes,
    passing: Math.round(p.percentiles?.passes_per90 ?? 0),
  }))
  const filtered = rows
    .filter((p) => filter === 'all' || posGroupFull(p.position) === filter)
    .sort((a, b) => ((a[sortKey] as number) - (b[sortKey] as number)) * dir)
  const sortBy = (k: keyof RowT) => { if (k === sortKey) setDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setDir(-1) } }

  return (
    <div className="panel">
      <div className="sqhead">
        <div>
          <div className="sec-title">{club} — Squad</div>
          <div className="sec-sub">La Liga 2015/16 · per-player stats · tap a column to sort</div>
        </div>
        <div className="chips">{FILTERS.map(([k, l]) => <button key={k} className={`chip${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
      </div>
      <table className="ltable stable" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th className="lft">#</th><th className="lft">Player</th><th className="lft">Pos</th>
            {COLS.map(([k, l]) => <th key={k} className={sortKey === k ? 'on' : ''} onClick={() => sortBy(k)}>{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.player}>
              <td className="lft"><span className="pnum">{p.number}</span></td>
              <td className="lft"><span className="tc-name">{p.player}</span></td>
              <td className="lft"><span className="pos-tag">{p.position}</span></td>
              <td>{p.apps}</td><td>{p.goals}</td><td>{p.assists}</td><td>{p.minutes}</td><td>{p.passing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
