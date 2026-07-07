export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="py-10 text-center text-slate-500">{label}</div>
}
