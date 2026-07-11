import { useEffect, useRef } from 'react'
import { genPoints, genPath, type Pt } from '../../data/pitch'

const ACCENT = '#2f7fe0'
const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

// Heat colour ramp (blue → cyan → green → yellow → orange → red), sampled once.
let _pal: Uint8ClampedArray | null = null
function palette(): Uint8ClampedArray {
  if (_pal) return _pal
  const c = document.createElement('canvas'); c.width = 256; c.height = 1
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 256, 0)
  grad.addColorStop(0, 'rgba(10,42,107,0)')
  grad.addColorStop(0.2, 'rgba(10,42,107,0.55)')
  grad.addColorStop(0.4, 'rgba(10,160,180,0.68)')
  grad.addColorStop(0.58, 'rgba(120,210,60,0.78)')
  grad.addColorStop(0.74, 'rgba(240,220,40,0.85)')
  grad.addColorStop(0.88, 'rgba(240,130,30,0.9)')
  grad.addColorStop(1, 'rgba(220,30,30,0.95)')
  g.fillStyle = grad; g.fillRect(0, 0, 256, 1)
  _pal = g.getImageData(0, 0, 256, 1).data
  return _pal
}

type Ctx = CanvasRenderingContext2D

function pitchBase(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#123a22'; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.022)'
  for (let i = 0; i < 8; i += 2) ctx.fillRect(x + i * w / 8, y, w / 8, h)
}

function pitchLines(ctx: Ctx, x: number, y: number, w: number, h: number, zones: boolean) {
  ctx.strokeStyle = 'rgba(233,231,223,0.34)'; ctx.lineWidth = Math.max(1.5, w * 0.0022); ctx.fillStyle = 'rgba(233,231,223,0.34)'
  ctx.strokeRect(x, y, w, h)
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke()
  const cy = y + h / 2
  ctx.beginPath(); ctx.arc(x + w / 2, cy, h * 0.13, 0, 7); ctx.stroke()
  ctx.beginPath(); ctx.arc(x + w / 2, cy, w * 0.004, 0, 7); ctx.fill()
  const pbw = w * 0.16, pbh = h * 0.58, gbw = w * 0.055, gbh = h * 0.28
  ctx.strokeRect(x, y + (h - pbh) / 2, pbw, pbh); ctx.strokeRect(x + w - pbw, y + (h - pbh) / 2, pbw, pbh)
  ctx.strokeRect(x, y + (h - gbh) / 2, gbw, gbh); ctx.strokeRect(x + w - gbw, y + (h - gbh) / 2, gbw, gbh)
  if (zones) {
    ctx.save(); ctx.strokeStyle = 'rgba(233,231,223,0.13)'; ctx.setLineDash([6, 7])
    ctx.beginPath(); ctx.moveTo(x + w / 3, y); ctx.lineTo(x + w / 3, y + h); ctx.moveTo(x + 2 * w / 3, y); ctx.lineTo(x + 2 * w / 3, y + h); ctx.stroke(); ctx.restore()
    ctx.fillStyle = 'rgba(233,231,223,0.3)'; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(w * 0.013)}px Archivo`
    ctx.fillText('DEF', x + w / 6, y + h - 9); ctx.fillText('MID', x + w / 2, y + h - 9); ctx.fillText('ATT', x + w * 5 / 6, y + h - 9)
  }
  ctx.fillStyle = 'rgba(233,231,223,0.26)'; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(w * 0.012)}px Archivo`
  ctx.fillText('ATTACKING DIRECTION  →', x + w / 2, y + 17)
}

function paintHeat(ctx: Ctx, pts: Pt[], W: number, H: number, x0: number, y0: number, pw: number, ph: number) {
  const sc = document.createElement('canvas'); sc.width = W; sc.height = H
  const s = sc.getContext('2d')!; const R = Math.round(pw * 0.06)
  for (const p of pts) {
    const px = x0 + p.x / 100 * pw, py = y0 + p.y / 100 * ph
    const g = s.createRadialGradient(px, py, 0, px, py, R)
    g.addColorStop(0, 'rgba(0,0,0,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    s.fillStyle = g; s.fillRect(px - R, py - R, 2 * R, 2 * R)
  }
  const img = s.getImageData(0, 0, W, H); const d = img.data; const pal = palette()
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]
    if (a) { const idx = a * 4; d[i] = pal[idx]; d[i + 1] = pal[idx + 1]; d[i + 2] = pal[idx + 2]; d[i + 3] = pal[idx + 3] }
  }
  const hc = document.createElement('canvas'); hc.width = W; hc.height = H
  hc.getContext('2d')!.putImageData(img, 0, 0)
  ctx.save(); ctx.filter = `blur(${Math.max(2, Math.round(W * 0.004))}px)`; ctx.drawImage(hc, 0, 0); ctx.restore()
}

function paintTrail(ctx: Ctx, path: Pt[], x0: number, y0: number, pw: number, ph: number) {
  const P = path.map((p) => ({ x: x0 + p.x / 100 * pw, y: y0 + p.y / 100 * ph }))
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  for (let i = 1; i < P.length; i++) {
    const t = i / P.length
    ctx.strokeStyle = hexA(ACCENT, 0.12 + t * 0.75); ctx.lineWidth = Math.max(1.5, pw * 0.0036)
    ctx.shadowColor = hexA(ACCENT, 0.5); ctx.shadowBlur = pw * 0.006
    ctx.beginPath(); ctx.moveTo(P[i - 1].x, P[i - 1].y); ctx.lineTo(P[i].x, P[i].y); ctx.stroke()
  }
  ctx.shadowBlur = 0
  const st = P[0], e = P[P.length - 1]
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(10,20,30,0.9)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(st.x, st.y, pw * 0.008, 0, 7); ctx.fill(); ctx.stroke()
  ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(e.x, e.y, pw * 0.0105, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore()
}

function paintPoints(ctx: Ctx, pts: Pt[], x0: number, y0: number, pw: number, ph: number) {
  ctx.save(); ctx.fillStyle = hexA(ACCENT, 0.5)
  for (const p of pts) { ctx.beginPath(); ctx.arc(x0 + p.x / 100 * pw, y0 + p.y / 100 * ph, pw * 0.0042, 0, 7); ctx.fill() }
  ctx.restore()
}

export default function Pitch(
  { playerKey, zone, mode, phase, width = 1000, height = 640 }:
  { playerKey: string; zone: number[]; mode: string; phase: string; width?: number; height?: number },
) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const m = Math.round(W * 0.022), x0 = m, y0 = m, pw = W - 2 * m, ph = H - 2 * m
    pitchBase(ctx, x0, y0, pw, ph)
    if (mode === 'heat') {
      paintHeat(ctx, genPoints(playerKey, zone, phase), W, H, x0, y0, pw, ph)
      pitchLines(ctx, x0, y0, pw, ph, true)
    } else {
      pitchLines(ctx, x0, y0, pw, ph, true)
      if (mode === 'points') paintPoints(ctx, genPoints(playerKey, zone, phase), x0, y0, pw, ph)
      else paintTrail(ctx, genPath(playerKey, zone, phase), x0, y0, pw, ph)
    }
  }, [playerKey, zone, mode, phase])
  return <canvas ref={ref} width={width} height={height} className="chart-canvas" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }} />
}
