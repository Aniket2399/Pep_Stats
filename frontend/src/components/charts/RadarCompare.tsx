function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`
}

/** Two overlaid team radars — reproduces the wireframe's drawRadar (B then A,
 * each stroked in its colour with a 0.16 fill), axis labels, 4 rings + spokes. */
export default function RadarCompare(
  { axes, a, b, colorA = '#2f7fe0', colorB = '#e8792b', size = 340 }:
  { axes: string[]; a: number[]; b: number[]; colorA?: string; colorB?: string; size?: number },
) {
  const W = size, H = size, cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) * 0.34, n = axes.length
  const pt = (i: number, f: number): [number, number] => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2
    return [cx + Math.cos(ang) * R * f, cy + Math.sin(ang) * R * f]
  }
  const poly = (vals: number[]) => axes.map((_, i) => { const [x, y] = pt(i, (vals[i] ?? 0) / 100); return `${x},${y}` }).join(' ')
  const ring = (f: number) => axes.map((_, i) => { const [x, y] = pt(i, f); return `${x},${y}` }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rchart" role="img" aria-label="team comparison radar"
      style={{ width: '100%', maxWidth: 400, height: 'auto', margin: '0 auto', display: 'block' }}>
      {[1, 2, 3, 4].map((r) => <polygon key={r} points={ring(r / 4)} fill="none" stroke="rgba(233,236,240,0.14)" strokeWidth="1" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(233,236,240,0.14)" strokeWidth="1" /> })}
      <polygon points={poly(b)} fill={hexA(colorB, 0.16)} stroke={colorB} strokeWidth="2.4" />
      <polygon points={poly(a)} fill={hexA(colorA, 0.16)} stroke={colorA} strokeWidth="2.4" />
      {a.map((v, i) => { const [x, y] = pt(i, v / 100); return <circle key={`a${i}`} cx={x} cy={y} r="3.4" fill={colorA} /> })}
      {b.map((v, i) => { const [x, y] = pt(i, v / 100); return <circle key={`b${i}`} cx={x} cy={y} r="3.4" fill={colorB} /> })}
      {axes.map((ax, i) => {
        const [x, y] = pt(i, 1.16)
        const anchor = Math.abs(x - cx) < 6 ? 'middle' : x < cx ? 'end' : 'start'
        const baseline = y < cy - 4 ? 'auto' : y > cy + 4 ? 'hanging' : 'middle'
        return <text key={ax} x={x} y={y} fontSize="11" fontWeight="700" fill="#eef2f6" textAnchor={anchor} dominantBaseline={baseline}>{ax}</text>
      })}
    </svg>
  )
}
