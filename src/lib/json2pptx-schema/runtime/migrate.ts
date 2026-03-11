import {
  DEFAULT_SCHEMA_VERSION,
  LEGACY_SLIDE_TYPE_MAP
} from '../versions/v1/defaults'
import type { V1SchemaVersion } from '../versions/v1/types'
import { UnsupportedSchemaVersionError } from './errors'

type UnknownRecord = Record<string, unknown>

const V1_VERSION_EQUIVALENTS = new Set(['1', '1.0', '1.0.0'])

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function normalizeVersion(value: unknown): V1SchemaVersion | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) return DEFAULT_SCHEMA_VERSION
    return null
  }

  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (V1_VERSION_EQUIVALENTS.has(trimmed)) return DEFAULT_SCHEMA_VERSION
  return null
}

function migrateSlideType(type: unknown): unknown {
  if (typeof type !== 'string') return type
  const normalized = type.trim().toLowerCase()
  return LEGACY_SLIDE_TYPE_MAP[normalized] ?? type
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const numeric = Number.parseFloat(trimmed)
  return Number.isFinite(numeric) ? numeric : undefined
}

function normalizeGradientType(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return 'linear'
  return value === 'line' ? 'linear' : value
}

function normalizeGradientStopPosition(value: unknown): number {
  const numeric = toFiniteNumber(value)
  if (numeric === undefined) return 0
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    return numeric
  }
  if (numeric > 1000) return numeric / 1000
  if (numeric > 100) return numeric / 1000
  return numeric
}

function migrateGradient(value: unknown): unknown {
  if (!isRecord(value)) return value

  const gradient = cloneValue(value)
  const sourceColors = Array.isArray(gradient.colors) ? gradient.colors : []
  const rotate = toFiniteNumber(gradient.rotate ?? gradient.rot) ?? 0

  gradient.type = normalizeGradientType(gradient.type ?? gradient.path)
  gradient.rotate = rotate
  gradient.colors = sourceColors.map((stop) => {
    if (!isRecord(stop)) return stop
    const nextStop = cloneValue(stop)
    nextStop.pos = normalizeGradientStopPosition(nextStop.pos)
    return nextStop
  })

  delete gradient.rot
  delete gradient.path

  return gradient
}

function migrateFill(
  fill: unknown,
  options: {
    gradient?: unknown
    pattern?: unknown
  } = {}
): unknown {
  if (isRecord(options.gradient)) {
    return {
      type: 'gradient',
      gradient: migrateGradient(options.gradient)
    }
  }

  if (typeof options.pattern === 'string' && options.pattern.trim()) {
    return {
      type: 'image',
      src: options.pattern
    }
  }

  if (typeof fill === 'string') {
    if (!fill.trim()) return undefined
    return {
      type: 'solid',
      color: fill
    }
  }

  if (!isRecord(fill)) {
    return fill
  }

  if (fill.type === 'color' && typeof fill.value === 'string') {
    return {
      type: 'solid',
      color: fill.value
    }
  }

  if (isRecord(fill.gradient)) {
    return {
      type: 'gradient',
      gradient: migrateGradient(fill.gradient)
    }
  }

  if (fill.type === 'solid' || (fill.type === undefined && typeof fill.color === 'string')) {
    return {
      ...fill,
      type: 'solid',
      color: fill.color
    }
  }

  if (fill.type === 'gradient') {
    return {
      type: 'gradient',
      gradient: migrateGradient(fill.gradient ?? fill.value ?? fill)
    }
  }

  if (
    fill.type === 'image' ||
    fill.type === 'pattern' ||
    typeof fill.src === 'string' ||
    isRecord(fill.value)
  ) {
    const imageValue = isRecord(fill.value) ? fill.value : undefined
    const src =
      typeof fill.src === 'string'
        ? fill.src
        : typeof imageValue?.picBase64 === 'string'
        ? imageValue.picBase64
        : undefined
    const opacity = toFiniteNumber(fill.opacity ?? imageValue?.opacity)

    if (src) {
      return {
        type: 'image',
        src,
        ...(opacity === undefined ? {} : { opacity })
      }
    }
  }

  return fill
}

function migrateElement(element: unknown): unknown {
  if (!isRecord(element)) return element

  const nextElement = cloneValue(element)
  nextElement.fill = migrateFill(nextElement.fill, {
    gradient: nextElement.gradient,
    pattern: nextElement.pattern
  })
  delete nextElement.gradient
  delete nextElement.pattern
  return nextElement
}

export function migrateDocument(
  input: unknown,
  toVersion: V1SchemaVersion = DEFAULT_SCHEMA_VERSION
): unknown {
  if (!isRecord(input)) return input

  const migrated = cloneValue(input) as UnknownRecord
  const incomingVersion = migrated.schemaVersion ?? migrated.version

  if (incomingVersion === undefined) {
    migrated.schemaVersion = toVersion
  } else {
    const normalizedVersion = normalizeVersion(incomingVersion)
    if (!normalizedVersion || normalizedVersion !== toVersion) {
      throw new UnsupportedSchemaVersionError(incomingVersion, toVersion)
    }
    migrated.schemaVersion = toVersion
  }

  delete migrated.version

  if (isRecord(migrated.theme)) {
    const theme = migrated.theme
    if (typeof theme.fontname === 'string' && theme.fontName === undefined) {
      theme.fontName = theme.fontname
      delete theme.fontname
    }
  }

  if (Array.isArray(migrated.slides)) {
    migrated.slides = migrated.slides.map((slide) => {
      if (!isRecord(slide)) return slide
      const nextSlide = cloneValue(slide)
      nextSlide.type = migrateSlideType(nextSlide.type)
      nextSlide.background = migrateFill(nextSlide.background)
      if (Array.isArray(nextSlide.elements)) {
        nextSlide.elements = nextSlide.elements.map((element) => migrateElement(element))
      }
      return nextSlide
    })
  }

  return migrated
}
