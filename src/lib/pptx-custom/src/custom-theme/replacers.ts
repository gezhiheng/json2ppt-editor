import type { Slide, SlideElement } from '../types'
import {
  findMappingForColor,
  isPureColorString,
  normalizeThemeColor,
  parseColorToRgb,
  rgbToString
} from './color-utils'
import type { ColorMapping } from './types'

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

function replaceColorsDeep (value: unknown, mappings: ColorMapping[]): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const pureColor = isPureColorString(trimmed)
    if (pureColor) {
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

function replaceTextElementColors (
  element: SlideElement,
  fontMappings: ColorMapping[],
  fontColor: string
): SlideElement {
  const next = replaceColorsDeep(element, fontMappings) as SlideElement
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

export function replaceSlideColors (
  slide: Slide,
  themeMappings: ColorMapping[],
  fontMappings: ColorMapping[],
  fontColor: string
): Slide {
  const { elements, ...rest } = slide
  const nextSlide = replaceColorsDeep(rest, themeMappings) as Slide
  if (!elements) return nextSlide

  const nextElements: SlideElement[] = elements.map((element) => {
    if (element && typeof element === 'object' && element.type === 'text') {
      return replaceTextElementColors(element, fontMappings, fontColor)
    }
    return replaceColorsDeep(element, themeMappings) as SlideElement
  })

  return { ...nextSlide, elements: nextElements }
}
