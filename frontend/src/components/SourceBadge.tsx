import { useAsync } from '../hooks/useAsync'
import { getMeta } from '../api/client'
export default function SourceBadge() {
  const { data } = useAsync(() => getMeta(), [], { pollMs: 45000 })
  if (!data) return null
  const t = data.live_updated ? new Date(data.live_updated).toLocaleTimeString() : '—'
  return <span className="text-xs text-slate-400">live updated: {t}</span>
}
