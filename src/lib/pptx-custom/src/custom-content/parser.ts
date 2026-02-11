import type { BackendContentItem, BackendSlide } from '../types'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null
  const normalized = value
    .map(item => asString(item))
    .filter((item): item is string => item !== null)
  return normalized.length === value.length ? normalized : null
}

const normalizeType = (value: unknown): BackendSlide['type'] | null => {
  const raw = asString(value)?.trim().toLowerCase()
  if (!raw) return null
  if (raw === 'agenda') return 'contents'
  if (raw === 'section') return 'transition'
  if (raw === 'ending') return 'end'
  if (
    raw === 'cover' ||
    raw === 'contents' ||
    raw === 'transition' ||
    raw === 'content' ||
    raw === 'end'
  ) {
    return raw
  }
  return null
}

const normalizeContentItems = (value: unknown): BackendContentItem[] | null => {
  if (!Array.isArray(value)) return null
  const normalized: BackendContentItem[] = []
  for (const item of value) {
    if (!isRecord(item)) return null
    const title = asString(item.title)
    const text = asString(item.text)
    if (title == null || text == null) return null
    normalized.push({ title, text })
  }
  return normalized
}

const normalizeSlide = (value: unknown): BackendSlide | null => {
  if (!isRecord(value)) return null
  const type = normalizeType(value.type)
  if (!type) return null

  const rawData = isRecord(value.data) ? value.data : {}

  if (type === 'cover') {
    const title = asString(rawData.title)
    const text = asString(rawData.text)
    if (title == null || text == null) return null
    return { type, data: { title, text } }
  }

  if (type === 'contents') {
    const items = asStringArray(rawData.items)
    if (!items) return null
    return { type, data: { items } }
  }

  if (type === 'transition') {
    const title = asString(rawData.title)
    const text = asString(rawData.text)
    if (title == null || text == null) return null
    return { type, data: { title, text } }
  }

  if (type === 'content') {
    const title = asString(rawData.title)
    const items = normalizeContentItems(rawData.items)
    if (title == null || !items) return null
    return { type, data: { title, items } }
  }

  return { type }
}

const parseNdJsonSlides = (raw: string): unknown[] =>
  raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as unknown)

const parseStructuredSlides = (raw: string): unknown[] | null => {
  const trimmed = raw.trim()
  if (!trimmed) return []
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
  if (Array.isArray(parsed)) return parsed
  if (!isRecord(parsed)) return null
  if (Array.isArray(parsed.slides)) return parsed.slides
  if ('type' in parsed) return [parsed]
  return null
}

export const parseCustomContent = (raw: string): BackendSlide[] => {
  const candidates = parseStructuredSlides(raw) ?? parseNdJsonSlides(raw)
  const slides = candidates
    .map(item => normalizeSlide(item))
    .filter((item): item is BackendSlide => item !== null)

  if (slides.length !== candidates.length) {
    throw new Error('Invalid custom content format')
  }
  return slides
}
