import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseDocument, validateDocument } from 'json2pptx-schema'
import { parsePptxToJson } from '../src/lib/pptx2json'
import type { Deck, Slide, SlideElement } from '../src/types/ppt'

const FIXTURE_DIR = join(process.cwd(), 'src/lib/pptx2json/test/assets')
const SOURCE_PPTX = join(FIXTURE_DIR, 'template_1.pptx')
const EXPECTED_JSON = join(FIXTURE_DIR, 'template_1.json')
const PPTX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'

type SlideSummary = {
  textLike: number
  image: number
  line: number
  table: number
  chart: number
  media: number
}

function loadExpectedFixture(): Deck {
  return JSON.parse(readFileSync(EXPECTED_JSON, 'utf8')) as Deck
}

function createFixtureFile(): File {
  const source = readFileSync(SOURCE_PPTX)
  return new File([source], 'template_1.pptx', { type: PPTX_MIME_TYPE })
}

function normalizeText(content: string): string {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getElementText(element: SlideElement): string {
  if (element.type === 'text') {
    return normalizeText(element.content ?? '')
  }

  if (element.type === 'shape') {
    const content = element.text?.content ?? element.content ?? ''
    return normalizeText(content)
  }

  return ''
}

function summarizeSlide(slide?: Slide): SlideSummary {
  const elements = slide?.elements ?? []

  return {
    textLike: elements.filter((element) => getElementText(element).length > 0).length,
    image: elements.filter((element) => element.type === 'image').length,
    line: elements.filter((element) => element.type === 'line').length,
    table: elements.filter((element) => element.type === 'table').length,
    chart: elements.filter((element) => element.type === 'chart').length,
    media: elements.filter((element) => element.type === 'video' || element.type === 'audio')
      .length
  }
}

function firstSlideText(slide?: Slide): string {
  const elements = slide?.elements ?? []
  for (const element of elements) {
    const text = getElementText(element)
    if (text.length > 0) {
      return text
    }
  }
  return ''
}

describe('pptx2json conversion', () => {
  it('converts template_1.pptx into schema-valid JSON', async () => {
    const { deck, warnings } = await parsePptxToJson(createFixtureFile())

    expect(warnings).toEqual([])
    expect(() => validateDocument(deck)).not.toThrow()

    const parsed = parseDocument(deck)
    expect(parsed.schemaVersion).toBe('1.0.0')
    expect(parsed.slides.length).toBeGreaterThan(0)
  })

  it('matches template_1.json on structural conversion expectations', async () => {
    const expected = loadExpectedFixture()
    const { deck: actual } = await parsePptxToJson(createFixtureFile())

    expect(() => validateDocument(expected)).not.toThrow()
    expect(() => validateDocument(actual)).not.toThrow()

    const expectedSlides = expected.slides ?? []
    const actualSlides = actual.slides ?? []

    expect(actualSlides.length).toBe(expectedSlides.length)

    const expectedRatio = (expected.width ?? 1) / (expected.height ?? 1)
    const actualRatio = (actual.width ?? 1) / (actual.height ?? 1)
    expect(actualRatio).toBeCloseTo(expectedRatio, 6)

    for (let index = 0; index < expectedSlides.length; index += 1) {
      expect(summarizeSlide(actualSlides[index])).toEqual(summarizeSlide(expectedSlides[index]))
      expect(firstSlideText(actualSlides[index])).toBe(firstSlideText(expectedSlides[index]))
    }
  })
})
