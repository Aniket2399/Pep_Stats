export default function Bars({ items, max = 100 }: { items: { label: string; value: number }[]; max?: number }) {
  return (
    <div>
      {items.map((it) => (
        <div key={it.label} className="zone-row">
          <div className="zone-head"><span>{it.label}</span><span className="mono">{it.value}</span></div>
          <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, (it.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  )
}
