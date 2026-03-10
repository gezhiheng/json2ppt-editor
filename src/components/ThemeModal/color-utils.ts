type ParsedRgbColor = {
  r: number
  g: number
  b: number
  alpha?: number
}

export function normalizeHexColor (value: string): string | null {
  const raw = value.trim()
  const withHash = raw.startsWith('#') ? raw.slice(1) : raw
  if (withHash.length !== 3 && withHash.length !== 6) return null
  if (!/^[0-9a-fA-F]+$/.test(withHash)) return null

  const expanded =
    withHash.length === 3
      ? withHash
          .split('')
          .map(char => char + char)
          .join('')
      : withHash

  return `#${expanded.toUpperCase()}`
}

export function normalizeThemeColor (value: string): string | null {
  const hex = normalizeHexColor(value)
  if (hex) return hex
  return normalizeRgbColor(value)
}

export function normalizePickerColor (value: string): string | null {
  const hex = normalizeHexColor(value)
  if (hex) return hex

  const rgb = parseRgbColor(value)
  if (!rgb) return null

  function toHex (channel: number): string {
    return Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  }

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function normalizeRgbColor (value: string): string | null {
  const parsed = parseRgbColor(value)
  if (!parsed) return null

  if (parsed.alpha !== undefined) {
    return `rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.alpha})`
  }

  return `rgb(${parsed.r},${parsed.g},${parsed.b})`
}

function parseRgbColor (value: string): ParsedRgbColor | null {
  const match = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)/i
  )
  if (!match) return null

  const r = Math.round(Number(match[1]))
  const g = Math.round(Number(match[2]))
  const b = Math.round(Number(match[3]))
  if (![r, g, b].every(channel => Number.isFinite(channel))) return null

  const alpha = match[4] !== undefined ? Number(match[4]) : undefined
  if (alpha !== undefined && Number.isFinite(alpha)) {
    return { r, g, b, alpha }
  }

  return { r, g, b }
}
