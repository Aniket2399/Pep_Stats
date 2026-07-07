export default function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-red-600 font-medium">Could not load data</p>
      <p className="text-sm text-slate-500 mt-1">{error.message}</p>
      <p className="text-xs text-slate-400 mt-2">Is the API running? (uvicorn apex.api.app:app)</p>
      {onRetry && <button onClick={onRetry} className="mt-3 px-3 py-1 rounded bg-navy text-white text-sm">Retry</button>}
    </div>
  )
}
