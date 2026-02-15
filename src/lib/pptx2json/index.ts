import JSZip from 'jszip'
import {
  ENABLE_DECK_JSON,
  PPTX_JSON_PAYLOAD_PATH,
  PPTX_JSON_PAYLOAD_VERSION
} from 'json2pptx'
import type { Deck } from './types'
import { parse } from './parser/pptxtojson'
import type { PptxParseResult } from './parser/pptxtojson'
import { normalizeSlide } from './slide-normalizer'
import { mapColor, toPx } from './utils'

export type ParsedResult = {
  deck: Deck
  warnings: string[]
}

type EmbeddedDeckPayload =
  | Deck
  | {
      version?: number
      deck?: Deck
    }

type EmbeddedDeckResolution = {
  deck?: Deck
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
  const zip = await JSZip.loadAsync(fileBuffer)

  const embedded = ENABLE_DECK_JSON ? await resolveEmbeddedDeck(zip) : null
  if (embedded?.deck) {
    return {
      deck: embedded.deck,
      warnings: embedded.warnings
    }
  }

  return {
    deck: await buildDeckFromPptx(fileBuffer),
    warnings: embedded?.warnings ?? []
  }
}

async function resolveEmbeddedDeck(zip: JSZip): Promise<EmbeddedDeckResolution | null> {
  const embeddedFile =
    zip.file(PPTX_JSON_PAYLOAD_PATH) ??
    Object.values(zip.files).find((entry) =>
      entry.name.endsWith(`/${PPTX_JSON_PAYLOAD_PATH}`)
    ) ??
    null

  if (!embeddedFile) {
    return null
  }

  const payloadText = await embeddedFile.async('string')

  try {
    const parsed = JSON.parse(payloadText) as EmbeddedDeckPayload

    if (isDeckEnvelope(parsed) && parsed.deck) {
      return {
        deck: parsed.deck,
        warnings:
          parsed.version && parsed.version !== PPTX_JSON_PAYLOAD_VERSION
            ? [
                `Embedded JSON payload version ${parsed.version} differs from ${PPTX_JSON_PAYLOAD_VERSION}.`
              ]
            : []
      }
    }

    return {
      deck: parsed as Deck,
      warnings: []
    }
  } catch {
    return {
      warnings: ['Embedded JSON payload could not be parsed. Falling back to PPTX parsing.']
    }
  }
}

function isDeckEnvelope(payload: EmbeddedDeckPayload): payload is { version?: number; deck?: Deck } {
  return typeof payload === 'object' && payload !== null && 'deck' in payload
}

async function buildDeckFromPptx(buffer: ArrayBuffer): Promise<Deck> {
  const pptxJson = await parse(buffer)
  const width = toPx(pptxJson.size?.width)
  const height = toPx(pptxJson.size?.height)
  const themeColors = mapThemeColors(pptxJson)
  const slides = (Array.isArray(pptxJson.slides) ? pptxJson.slides : []).map(
    (slide, index) => normalizeSlide(slide, index)
  )

  return {
    title: DEFAULT_DECK_TITLE,
    width,
    height,
    theme: {
      ...DEFAULT_THEME,
      themeColors
    },
    slides
  }
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

export type { Deck, Slide, SlideElement } from './types'
