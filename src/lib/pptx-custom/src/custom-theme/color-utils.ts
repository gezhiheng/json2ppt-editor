import type { ColorMapping, RGB } from './types'

export function normalizeHexColor (value: string): string | null {
  const raw = value.trim()
  const withHash = raw.startsWith('#') ? raw.slice(1) : raw
  if (withHash.length !== 3 && withHash.length !== 6) return null
  if (!/^[0-9a-fA-F]+$/.test(withHash)) return null
  const expanded =
    withHash.length === 3
      ? withHash
          .split('')
          .map((char) => char + char)
          .join('')
      : withHash
  return `#${expanded.toUpperCase()}`
}

export function parseColorToRgb (
  value: string
): (RGB & { alpha?: number }) | null {
  const hex = normalizeHexColor(value)
  if (hex) {
    const raw = hex.slice(1)
    const r = Number.parseInt(raw.slice(0, 2), 16)
    const g = Number.parseInt(raw.slice(2, 4), 16)
    const b = Number.parseInt(raw.slice(4, 6), 16)
    return { r, g, b }
  }

  const match = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)/i
  )
  if (!match) return null
  const r = Math.round(Number(match[1]))
  const g = Math.round(Number(match[2]))
  const b = Math.round(Number(match[3]))
  const alpha = match[4] !== undefined ? Number(match[4]) : undefined
  return {
    r,
    g,
    b,
    ...(Number.isFinite(alpha) ? { alpha } : {})
  }
}

export function normalizeThemeColor (value: string): string | null {
  const hex = normalizeHexColor(value)
  if (hex) return hex
  const parsed = parseColorToRgb(value)
  if (!parsed) return null
  if (parsed.alpha !== undefined) {
    return `rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.alpha})`
  }
  return `rgb(${parsed.r},${parsed.g},${parsed.b})`
}

export function isPureColorString (value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return true
  return /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i.test(
    trimmed
  )
}

function normalizeColorKey (value?: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = parseColorToRgb(trimmed)
  if (parsed) {
    return `${parsed.r},${parsed.g},${parsed.b},${parsed.alpha ?? 'none'}`
  }
  const hex = normalizeHexColor(trimmed)
  if (hex) return hex
  return trimmed.toLowerCase()
}

export function colorsEqual (a: string, b: string): boolean {
  const aKey = normalizeColorKey(a)
  const bKey = normalizeColorKey(b)
  if (!aKey || !bKey) return false
  return aKey === bKey
}

export function isWhiteColor (value?: string): boolean {
  const key = normalizeColorKey(value)
  if (!key) return false
  return (
    key === '#FFFFFF' ||
    key === '255,255,255,none' ||
    key === '255,255,255,1'
  )
}

export function rgbToString (rgb: RGB): string {
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`
}

export function findMappingForColor (
  value: string,
  mappings: ColorMapping[]
): ColorMapping | undefined {
  const parsed = parseColorToRgb(value)
  if (!parsed) return undefined
  return mappings.find(
    (item) =>
      item.fromRgb.r === parsed.r &&
      item.fromRgb.g === parsed.g &&
      item.fromRgb.b === parsed.b
  )
}
