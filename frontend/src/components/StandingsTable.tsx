import type { StandingRow } from '../api/types'

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const groups = [...new Set(rows.map((r) => r.group))].sort()
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {groups.map((g) => (
        <div key={g} className="rounded border overflow-hidden">
          <div className="bg-navy text-white px-3 py-1 text-sm font-semibold">{g}</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr><th className="text-left p-1 pl-2">Team</th><th className="p-1">P</th><th className="p-1">W</th>
              <th className="p-1">D</th><th className="p-1">L</th><th className="p-1">GD</th><th className="p-1">Pts</th></tr>
            </thead>
            <tbody>
              {rows.filter((r) => r.group === g).sort((a, b) => a.rank - b.rank).map((r) => (
                <tr key={r.team} className="border-t">
                  <td className="p-1 pl-2">{r.flag} {r.team}</td>
                  <td className="p-1 text-center">{r.played}</td><td className="p-1 text-center">{r.w}</td>
                  <td className="p-1 text-center">{r.d}</td><td className="p-1 text-center">{r.l}</td>
                  <td className="p-1 text-center">{r.gd}</td><td className="p-1 text-center font-bold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
