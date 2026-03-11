import { parseDocument } from 'json2pptx-schema'
import type { PresentationData } from './types'
import { parse } from './parser/parse'
import type { PptxParseResult } from './parser/parse'
import { normalizeSlide } from './slide-normalizer'
import { mapColor, toPx } from './utils'

type PresentationDocument = ReturnType<typeof parseDocument>

export type ParsedResult = {
  deck: PresentationData
  warnings: string[]
}

const DEFAULT_DECK_TITLE = '未命名演示文稿'
const DEFAULT_THEME = {
  fontColor: '#333',
  fontName: '',
  backgroundColor: '#fff',
  shadow: {
    h: 3,
    v: 3,
    blur: 2,
    color: '#808080'
  },
  outline: {
    width: 2,
    color: '#525252',
    style: 'solid'
  }
} as const

export async function parsePptxToJson(file: File): Promise<ParsedResult> {
  const fileBuffer = await file.arrayBuffer()

  return {
    deck: await buildDeckFromPptx(fileBuffer),
    warnings: []
  }
}

function normalizeDeck(value: unknown): PresentationData {
  const document: PresentationDocument = parseDocument(value)
  return document as unknown as PresentationData
}

async function buildDeckFromPptx(buffer: ArrayBuffer): Promise<PresentationData> {
  const pptxJson = await parse(buffer)
  const width = toPx(pptxJson.size?.width)
  const height = toPx(pptxJson.size?.height)
  const themeColors = mapThemeColors(pptxJson)
  const slides = (Array.isArray(pptxJson.slides) ? pptxJson.slides : []).map(
    (slide, index) => normalizeSlide(slide, index)
  )

  return normalizeDeck({
    title: DEFAULT_DECK_TITLE,
    width,
    height,
    theme: {
      ...DEFAULT_THEME,
      themeColors
    },
    slides
  })
}

function mapThemeColors(pptxJson: PptxParseResult): string[] | undefined {
  if (!Array.isArray(pptxJson.themeColors)) {
    return undefined
  }

  return pptxJson.themeColors.map((color) => normalizeThemeColor(color))
}

function normalizeThemeColor(color: string): string {
  const mapped = mapColor(color)
  if (!mapped) {
    return color
  }

  return /^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(mapped) ? mapped : color
}

export type { Deck, Presentation, PresentationData, PresentationTheme, Slide, SlideElement } from './types'
