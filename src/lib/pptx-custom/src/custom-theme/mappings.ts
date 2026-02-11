import { normalizeHexColor, parseColorToRgb } from './color-utils'
import type { ColorMapping } from './types'

export function buildColorMappings (
  previous: string[],
  next: string[]
): ColorMapping[] {
  const mappings: ColorMapping[] = []
  const length = Math.min(previous.length, next.length)
  for (let i = 0; i < length; i += 1) {
    const fromParsed = parseColorToRgb(previous[i])
    const toParsed = parseColorToRgb(next[i])
    if (!fromParsed || !toParsed) continue
    const toHex = normalizeHexColor(next[i]) ?? undefined
    mappings.push({
      fromRgb: { r: fromParsed.r, g: fromParsed.g, b: fromParsed.b },
      toRgb: { r: toParsed.r, g: toParsed.g, b: toParsed.b },
      toHex
    })
  }
  return mappings
}

export function buildSingleMapping (
  from?: string,
  to?: string
): ColorMapping | null {
  if (!from || !to) return null
  const fromParsed = parseColorToRgb(from)
  const toParsed = parseColorToRgb(to)
  if (!fromParsed || !toParsed) return null
  const toHex = normalizeHexColor(to) ?? undefined
  return {
    fromRgb: { r: fromParsed.r, g: fromParsed.g, b: fromParsed.b },
    toRgb: { r: toParsed.r, g: toParsed.g, b: toParsed.b },
    toHex
  }
}
