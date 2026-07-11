import { flagUrl } from '../data/flags'

/** Real flag image (flagcdn.com, like the wireframe), falling back to the emoji. */
export default function Flag({ code, size = 22 }: { code: string; size?: number }) {
  const url = flagUrl(code)
  if (!url) return <span aria-hidden>{code}</span>
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={Math.round(size * 0.68)}
      loading="lazy"
      style={{ borderRadius: 3, objectFit: 'cover', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.25)' }}
    />
  )
}
