/**
 * Convert a flag emoji (two Regional Indicator symbols, e.g. "🇲🇽") into a real
 * flag image URL from flagcdn.com — the same image source the wireframe uses.
 * Returns null for anything that isn't a standard 2-letter flag emoji (e.g. the
 * England subdivision flag), so callers can fall back to the emoji.
 */
export function flagUrl(flag: string | null | undefined, w: 40 | 80 | 160 = 80): string | null {
  if (!flag) return null
  const cps = Array.from(flag).map((c) => c.codePointAt(0) ?? 0)
  if (cps.length !== 2 || cps.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) return null
  const iso = cps.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 97)).join('') // a-z
  return `https://flagcdn.com/w${w}/${iso}.png`
}
