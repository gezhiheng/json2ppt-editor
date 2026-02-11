import type { TemplateJson, TemplateJsonElement, TemplateJsonSlide } from './template-types'

export type BackendCoverData = {
  title: string
  text: string
}

export type BackendContentsData = {
  items: string[]
}

export type BackendTransitionData = {
  title: string
  text: string
}

export type BackendContentItem = {
  title: string
  text: string
}

export type BackendContentData = {
  title: string
  items: BackendContentItem[]
}

export type BackendSlide =
  | { type: 'cover'; data: BackendCoverData }
  | { type: 'contents'; data: BackendContentsData }
  | { type: 'transition'; data: BackendTransitionData }
  | { type: 'content'; data: BackendContentData }
  | { type: 'end'; data?: undefined }

type UnknownRecord = Record<string, unknown>

const updateHtmlContent = (html: string, text: string) => {
  if (typeof DOMParser === 'undefined') {
    return `<p>${text}</p>`
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const spans = Array.from(doc.querySelectorAll('span'))
  if (spans.length > 0) {
    spans.forEach((span, index) => {
      span.textContent = index === 0 ? text : ''
    })
  } else {
    const paragraph = doc.querySelector('p')
    if (paragraph) {
      paragraph.textContent = text
    } else {
      doc.body.textContent = text
    }
  }
  return doc.body.innerHTML
}

const setElementText = (element: TemplateJsonElement, text: string) => {
  if (element.type !== 'text') return
  element.content = updateHtmlContent(element.content, text)
}

const applyCoverData = (slide: TemplateJsonSlide, data: BackendCoverData) => {
  const title = slide.elements.find(
    element => element.type === 'text' && element.textType === 'title'
  )
  const content = slide.elements.find(
    element => element.type === 'text' && element.textType === 'content'
  )
  if (title) setElementText(title, data.title)
  if (content) setElementText(content, data.text)
}

const applyContentsData = (
  slide: TemplateJsonSlide,
  data: BackendContentsData
) => {
  const items = slide.elements.filter(
    element => element.type === 'text' && element.textType === 'item'
  )
  items.forEach((element, index) => {
    const text = data.items[index]
    if (text) setElementText(element, text)
  })
}

const applyTransitionData = (
  slide: TemplateJsonSlide,
  data: BackendTransitionData,
  sectionIndex: number
) => {
  const title = slide.elements.find(
    element => element.type === 'text' && element.textType === 'title'
  )
  const content = slide.elements.find(
    element => element.type === 'text' && element.textType === 'content'
  )
  const partNumber = slide.elements.find(
    element => element.type === 'text' && element.textType === 'partNumber'
  )
  if (title) setElementText(title, data.title)
  if (content) setElementText(content, data.text)
  if (partNumber) setElementText(partNumber, `${sectionIndex}`.padStart(2, '0'))
}

const applyContentData = (slide: TemplateJsonSlide, data: BackendContentData) => {
  const title = slide.elements.find(
    element => element.type === 'text' && element.textType === 'title'
  )
  if (title) setElementText(title, data.title)

  const itemTitles = slide.elements.filter(
    element => element.type === 'text' && element.textType === 'itemTitle'
  )
  const items = slide.elements.filter(
    element => element.type === 'text' && element.textType === 'item'
  )

  data.items.forEach((item, index) => {
    const titleEl = itemTitles[index]
    const textEl = items[index]
    if (titleEl) setElementText(titleEl, item.title)
    if (textEl) setElementText(textEl, item.text)
  })
}

const cloneSlide = (slide: TemplateJsonSlide): TemplateJsonSlide =>
  JSON.parse(JSON.stringify(slide)) as TemplateJsonSlide

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

export const parseBackendOutput = (raw: string): BackendSlide[] => {
  const candidates = parseStructuredSlides(raw) ?? parseNdJsonSlides(raw)
  const slides = candidates
    .map(item => normalizeSlide(item))
    .filter((item): item is BackendSlide => item !== null)

  if (slides.length !== candidates.length) {
    throw new Error('Invalid custom content format')
  }
  return slides
}

export const buildTemplateFromBackend = (
  template: TemplateJson,
  backendSlides: BackendSlide[]
): TemplateJson => {
  const grouped = template.slides.reduce<Record<string, TemplateJsonSlide[]>>(
    (acc, slide) => {
      const key = slide.type || 'default'
      if (!acc[key]) acc[key] = []
      acc[key].push(slide)
      return acc
    },
    {}
  )

  const usage = new Map<string, number>()
  const getTextTypeCount = (slide: TemplateJsonSlide, textType: string) =>
    slide.elements.filter(
      element => element.type === 'text' && element.textType === textType
    ).length

  const getContentCapacity = (slide: TemplateJsonSlide) => {
    const titleSlots = getTextTypeCount(slide, 'itemTitle')
    const itemSlots = getTextTypeCount(slide, 'item')
    return Math.min(titleSlots, itemSlots)
  }

  const pickFromPool = (key: string, pool: TemplateJsonSlide[]) => {
    const index = usage.get(key) ?? 0
    usage.set(key, index + 1)
    return cloneSlide(pool[index % pool.length])
  }

  const pickSlide = (type: string, desiredCount?: number) => {
    const pool = grouped[type] || grouped.default || template.slides
    if (desiredCount == null || pool.length === 1) {
      return pickFromPool(type, pool)
    }

    const scored = pool.map(slide => {
      const capacity =
        type === 'content'
          ? getContentCapacity(slide)
          : getTextTypeCount(slide, 'item')
      return { slide, capacity }
    })
    const eligible = scored.filter(item => item.capacity >= desiredCount)
    if (eligible.length > 0) {
      const minCapacity = Math.min(...eligible.map(item => item.capacity))
      const best = eligible
        .filter(item => item.capacity === minCapacity)
        .map(item => item.slide)
      return pickFromPool(`${type}:${desiredCount}`, best)
    }
    const maxCapacity = Math.max(...scored.map(item => item.capacity))
    const fallback = scored
      .filter(item => item.capacity === maxCapacity)
      .map(item => item.slide)
    return pickFromPool(`${type}:${desiredCount}`, fallback)
  }

  let transitionIndex = 0
  const slides = backendSlides.map(item => {
    const desiredCount =
      item.type === 'contents'
        ? item.data.items.length
        : item.type === 'content'
        ? item.data.items.length
        : undefined
    const slide = pickSlide(item.type, desiredCount)
    if (item.type === 'cover') {
      applyCoverData(slide, item.data)
    } else if (item.type === 'contents') {
      applyContentsData(slide, item.data)
    } else if (item.type === 'transition') {
      transitionIndex += 1
      applyTransitionData(slide, item.data, transitionIndex)
    } else if (item.type === 'content') {
      applyContentData(slide, item.data)
    }
    return slide
  })

  return {
    ...template,
    slides
  }
}
