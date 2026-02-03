import type { Deck, Slide } from '../types/ppt'

type ThemeUpdate = {
  themeColors: string[]
  fontColor: string
  backgroundColor?: string
}

type ColorMapping = {
  fromRgb: RGB
  toRgb: RGB
  toHex?: string
}

type RGB = {
  r: number
  g: number
  b: number
}

export function applyThemeToDeck (deck: Deck, update: ThemeUpdate): Deck {
  const previousTheme = deck.theme ?? {}
  const themeColors = update.themeColors.slice(0, 6)
  const themeMappings = buildColorMappings(
    previousTheme.themeColors ?? [],
    themeColors
  )
  const fontMapping = buildSingleMapping(
    previousTheme.fontColor,
    update.fontColor
  )
  const fontMappings = fontMapping ? [fontMapping] : []

  const nextBackground = update.backgroundColor ?? previousTheme.backgroundColor
  const prevBackground = previousTheme.backgroundColor
  const slides = deck.slides?.map((slide) => {
    const nextSlide = replaceSlideColors(
      slide,
      themeMappings,
      fontMappings,
      update.fontColor
    )
    if (!nextBackground) return nextSlide
    const currentColor = nextSlide.background?.color
    const shouldUpdate =
      !currentColor ||
      (prevBackground && colorsEqual(currentColor, prevBackground)) ||
      (!prevBackground && isWhiteColor(currentColor))
    if (!shouldUpdate) return nextSlide
    return {
      ...nextSlide,
      background: {
        ...(nextSlide.background ?? {}),
        type: nextSlide.background?.type ?? 'solid',
        color: nextBackground
      }
    }
  })

  return {
    ...deck,
    theme: {
      ...previousTheme,
      themeColors,
      fontColor: update.fontColor,
      backgroundColor: update.backgroundColor ?? previousTheme.backgroundColor
    },
    slides
  }
}

function replaceSlideColors (
  slide: Slide,
  themeMappings: ColorMapping[],
  fontMappings: ColorMapping[],
  fontColor: string
): Slide {
  const { elements, ...rest } = slide
  const nextSlide = replaceColorsDeep(rest, themeMappings) as Slide
  if (!elements) return nextSlide

  const nextElements = elements.map((element) => {
    if (element && typeof element === 'object' && element.type === 'text') {
      return replaceTextElementColors(element, fontMappings, fontColor)
    }
    return replaceColorsDeep(element, themeMappings)
  })

  return { ...nextSlide, elements: nextElements }
}

function replaceTextElementColors (
  element: Slide['elements'][number],
  fontMappings: ColorMapping[],
  fontColor: string
): Slide['elements'][number] {
  if (!element || typeof element !== 'object') return element
  const next = replaceColorsDeep(element, fontMappings) as Slide['elements'][number]
  const normalizedFontColor = normalizeThemeColor(fontColor) ?? fontColor
  const withDefault =
    normalizedFontColor && 'defaultColor' in next
      ? { ...next, defaultColor: normalizedFontColor }
      : next
  if (!('content' in withDefault) || typeof withDefault.content !== 'string') {
    return withDefault
  }
  return {
    ...withDefault,
    content: applyFontColorToHtml(withDefault.content, normalizedFontColor)
  }
}

function replaceColorsDeep (value: unknown, mappings: ColorMapping[]): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const isPureColor = isPureColorString(trimmed)
    if (isPureColor) {
      const replaced = replaceColorValue(trimmed, mappings)
      return value === trimmed ? replaced : value.replace(trimmed, replaced)
    }
    return replaceColorsInText(value, mappings)
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceColorsDeep(item, mappings))
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    const next: Record<string, unknown> = {}
    for (const [key, item] of entries) {
      next[key] = replaceColorsDeep(item, mappings)
    }
    return next
  }

  return value
}

function replaceColorsInText (value: string, mappings: ColorMapping[]): string {
  let next = value
  next = next.replace(/#([0-9a-f]{3}|[0-9a-f]{6})/gi, (match) => {
    const mapping = findMappingForColor(match, mappings)
    if (!mapping) return match
    return mapping.toHex ?? rgbToString(mapping.toRgb)
  })
  next = next.replace(/rgba?\([^)]*\)/gi, (match) =>
    replaceRgbaString(match, mappings)
  )
  return next
}

function applyFontColorToHtml (value: string, fontColor: string): string {
  if (!value || !fontColor) return value
  const normalized = normalizeThemeColor(fontColor) ?? fontColor
  const hasStyleColor = /\bcolor\s*:/i.test(value)
  if (hasStyleColor) {
    return value.replace(/color\s*:\s*([^;"']+)/gi, () => `color: ${normalized}`)
  }
  return value.replace(
    /(<[^>]+style\s*=\s*["'])([^"']*)(["'])/gi,
    (_match, start, styles, end) => {
      if (/\bcolor\s*:/i.test(styles)) return _match
      const nextStyles = styles.trim()
        ? `${styles.trim()}; color: ${normalized}`
        : `color: ${normalized}`
      return `${start}${nextStyles}${end}`
    }
  )
}

function replaceColorValue (value: string, mappings: ColorMapping[]): string {
  const mapping = findMappingForColor(value, mappings)
  if (!mapping) return value
  const parsed = parseColorToRgb(value)
  if (!parsed) return value
  if (parsed.alpha !== undefined) {
    return `rgba(${mapping.toRgb.r},${mapping.toRgb.g},${mapping.toRgb.b},${parsed.alpha})`
  }
  return mapping.toHex ?? rgbToString(mapping.toRgb)
}

function replaceRgbaString (value: string, mappings: ColorMapping[]): string {
  const parsed = parseColorToRgb(value)
  if (!parsed) return value
  const mapping = mappings.find(
    (item) =>
      item.fromRgb.r === parsed.r &&
      item.fromRgb.g === parsed.g &&
      item.fromRgb.b === parsed.b
  )
  if (!mapping) return value
  if (parsed.alpha !== undefined || value.toLowerCase().startsWith('rgba')) {
    return `rgba(${mapping.toRgb.r},${mapping.toRgb.g},${mapping.toRgb.b},${parsed.alpha ?? 1})`
  }
  return mapping.toHex ?? rgbToString(mapping.toRgb)
}

function buildColorMappings (
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

function buildSingleMapping (
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

function normalizeHexColor (value: string): string | null {
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

function normalizeThemeColor (value: string): string | null {
  const hex = normalizeHexColor(value)
  if (hex) return hex
  const parsed = parseColorToRgb(value)
  if (!parsed) return null
  if (parsed.alpha !== undefined) {
    return `rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.alpha})`
  }
  return `rgb(${parsed.r},${parsed.g},${parsed.b})`
}

function parseColorToRgb (
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

function isPureColorString (value: string): boolean {
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

function colorsEqual (a: string, b: string): boolean {
  const aKey = normalizeColorKey(a)
  const bKey = normalizeColorKey(b)
  if (!aKey || !bKey) return false
  return aKey === bKey
}

function isWhiteColor (value?: string): boolean {
  const key = normalizeColorKey(value)
  if (!key) return false
  return (
    key === '#FFFFFF' ||
    key === '255,255,255,none' ||
    key === '255,255,255,1'
  )
}


function findMappingForColor (
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

function rgbToString (rgb: RGB): string {
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`
}
