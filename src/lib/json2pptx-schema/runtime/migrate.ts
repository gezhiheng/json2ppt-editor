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
      return nextSlide
    })
  }

  return migrated
}
