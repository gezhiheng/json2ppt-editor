import {
  DEFAULT_ELEMENT_ROTATE,
  DEFAULT_HEIGHT,
  DEFAULT_IMAGE_FIXED_RATIO,
  DEFAULT_LINE_STYLE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SCHEMA_VERSION,
  DEFAULT_SHAPE_FIXED_RATIO,
  DEFAULT_SLIDE_REMARK,
  DEFAULT_SLIDE_TYPE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_THEME,
  DEFAULT_THEME_OUTLINE,
  DEFAULT_THEME_SHADOW,
  DEFAULT_TITLE,
  DEFAULT_WIDTH,
  LEGACY_SLIDE_TYPE_MAP
} from '../versions/v1/defaults'
import type {
  V1Document,
  V1DocumentInput,
  V1Element,
  V1ImageElement,
  V1LineElement,
  V1Outline,
  V1Shadow,
  V1ShapeElement,
  V1Slide,
  V1SlideBackground,
  V1TextElement,
  V1Theme
} from '../versions/v1/types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asPair(value: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(value) || value.length < 2) return fallback
  return [asNumber(value[0], fallback[0]), asNumber(value[1], fallback[1])]
}

function asLinePoints(value: unknown): [string, string] {
  if (!Array.isArray(value)) return ['', '']
  const first = typeof value[0] === 'string' ? value[0] : ''
  const second = typeof value[1] === 'string' ? value[1] : ''
  return [first, second]
}

function normalizeShadow(value: unknown): V1Shadow {
  const source = isRecord(value) ? value : {}
  return {
    ...source,
    h: asNumber(source.h, DEFAULT_THEME_SHADOW.h),
    v: asNumber(source.v, DEFAULT_THEME_SHADOW.v),
    blur: asNumber(source.blur, DEFAULT_THEME_SHADOW.blur),
    color: asString(source.color, DEFAULT_THEME_SHADOW.color)
  }
}

function normalizeOutline(value: unknown): V1Outline {
  const source = isRecord(value) ? value : {}
  return {
    ...source,
    width: asNumber(source.width, DEFAULT_THEME_OUTLINE.width),
    color: asString(source.color, DEFAULT_THEME_OUTLINE.color),
    style: asString(source.style, DEFAULT_THEME_OUTLINE.style)
  }
}

function normalizeTheme(value: unknown): V1Theme {
  const source = isRecord(value) ? value : {}
  const themeColors = Array.isArray(source.themeColors)
    ? source.themeColors.filter((item): item is string => typeof item === 'string')
    : DEFAULT_THEME.themeColors.slice()

  return {
    ...source,
    themeColors,
    fontColor: asString(source.fontColor, DEFAULT_THEME.fontColor),
    fontName: asString(source.fontName, DEFAULT_THEME.fontName),
    backgroundColor: asString(source.backgroundColor, DEFAULT_THEME.backgroundColor),
    shadow: normalizeShadow(source.shadow),
    outline: normalizeOutline(source.outline)
  }
}

function normalizeBackground(
  value: unknown,
  fallbackColor: string
): V1SlideBackground | undefined {
  if (!isRecord(value)) return undefined

  const type =
    typeof value.type === 'string' && value.type.trim().length > 0
      ? value.type
      : 'solid'

  const normalized: V1SlideBackground = {
    ...value,
    type
  }

  if (type === 'solid' && typeof normalized.color !== 'string') {
    normalized.color = fallbackColor
  }

  return normalized
}

function normalizeElement(
  value: unknown,
  slideIndex: number,
  elementIndex: number,
  theme: V1Theme
): V1Element {
  const fallbackId = `slide-${slideIndex + 1}-element-${elementIndex + 1}`

  if (!isRecord(value)) {
    return {
      type: 'unknown',
      id: fallbackId,
      left: 0,
      top: 0,
      rotate: DEFAULT_ELEMENT_ROTATE
    }
  }

  const type =
    typeof value.type === 'string' && value.type.trim().length > 0
      ? value.type
      : 'unknown'

  const base = {
    ...value,
    type,
    id: asString(value.id, fallbackId),
    left: asNumber(value.left, 0),
    top: asNumber(value.top, 0),
    rotate: asNumber(value.rotate, DEFAULT_ELEMENT_ROTATE)
  }

  if (type === 'text') {
    const textElement: V1TextElement = {
      ...base,
      type: 'text',
      width: asNumber(value.width, 0),
      height: asNumber(value.height, 0),
      content: asString(value.content, ''),
      defaultColor: asString(value.defaultColor, theme.fontColor || DEFAULT_TEXT_COLOR),
      defaultFontName: asString(value.defaultFontName, theme.fontName),
      vertical: asBoolean(value.vertical, false)
    }
    return textElement
  }

  if (type === 'shape') {
    const width = asNumber(value.width, 0)
    const height = asNumber(value.height, 0)
    const shapeElement: V1ShapeElement = {
      ...base,
      type: 'shape',
      width,
      height,
      path: asString(value.path, ''),
      viewBox: asPair(value.viewBox, [width, height]),
      fill: asString(value.fill, ''),
      fixedRatio: asBoolean(value.fixedRatio, DEFAULT_SHAPE_FIXED_RATIO)
    }
    return shapeElement
  }

  if (type === 'line') {
    const lineElement: V1LineElement = {
      ...base,
      type: 'line',
      width: asNumber(value.width, DEFAULT_LINE_WIDTH),
      start: asPair(value.start, [0, 0]),
      end: asPair(value.end, [0, 0]),
      points: asLinePoints(value.points),
      color: asString(value.color, '#000000'),
      style: asString(value.style, DEFAULT_LINE_STYLE)
    }
    return lineElement
  }

  if (type === 'image') {
    const imageElement: V1ImageElement = {
      ...base,
      type: 'image',
      width: asNumber(value.width, 0),
      height: asNumber(value.height, 0),
      src: asString(value.src, ''),
      fixedRatio: asBoolean(value.fixedRatio, DEFAULT_IMAGE_FIXED_RATIO)
    }
    return imageElement
  }

  return base
}

function normalizeSlide(value: unknown, index: number, theme: V1Theme): V1Slide {
  if (!isRecord(value)) {
    return {
      id: `slide-${index + 1}`,
      type: DEFAULT_SLIDE_TYPE,
      remark: DEFAULT_SLIDE_REMARK,
      elements: []
    }
  }

  const rawType = typeof value.type === 'string' ? value.type.trim() : ''
  const normalizedType =
    rawType && LEGACY_SLIDE_TYPE_MAP[rawType.toLowerCase()]
      ? LEGACY_SLIDE_TYPE_MAP[rawType.toLowerCase()]
      : rawType || DEFAULT_SLIDE_TYPE

  const sourceElements = Array.isArray(value.elements) ? value.elements : []
  const elements = sourceElements.map((element, elementIndex) =>
    normalizeElement(element, index, elementIndex, theme)
  )

  const background = normalizeBackground(value.background, theme.backgroundColor)

  return {
    ...value,
    id: asString(value.id, `slide-${index + 1}`),
    type: normalizedType,
    remark: asString(value.remark, DEFAULT_SLIDE_REMARK),
    background,
    elements
  }
}

export function normalizeDocument(input: V1DocumentInput): V1Document {
  const source = cloneValue(input)

  if (!isRecord(source)) {
    return {
      schemaVersion: DEFAULT_SCHEMA_VERSION,
      title: DEFAULT_TITLE,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      theme: normalizeTheme(undefined),
      slides: []
    }
  }

  const theme = normalizeTheme(source.theme)
  const sourceSlides = Array.isArray(source.slides) ? source.slides : []
  const slides = sourceSlides.map((slide, index) => normalizeSlide(slide, index, theme))

  const normalized = {
    ...source,
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    title: asString(source.title, DEFAULT_TITLE),
    width: asNumber(source.width, DEFAULT_WIDTH),
    height: asNumber(source.height, DEFAULT_HEIGHT),
    theme,
    slides
  } as V1Document

  delete (normalized as UnknownRecord).version

  return normalized
}
