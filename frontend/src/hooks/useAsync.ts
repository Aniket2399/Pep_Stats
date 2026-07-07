import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> { data: T | null; loading: boolean; error: Error | null; reload: () => void }

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  opts: { pollMs?: number } = {},
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const load = () => {
      setLoading(true)
      run()
        .then((d) => { if (!cancelled) { setData(d); setError(null) } })
        .catch((e) => { if (!cancelled) setError(e as Error) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    load()
    const timer = opts.pollMs ? setInterval(load, opts.pollMs) : undefined
    return () => { cancelled = true; if (timer) clearInterval(timer) }
  }, [run, opts.pollMs, tick])

  return { data, loading, error, reload }
}
