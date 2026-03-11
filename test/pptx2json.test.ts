import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { parseDocument, validateDocument } from 'json2pptx-schema'
import { createPPTX } from '../src/lib/json2pptx/src/index'
import { parsePptxToJson } from '../src/lib/pptx2json'
import type { PresentationData, Slide, SlideElement } from '../src/types/ppt'

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

function loadExpectedFixture(): PresentationData {
  return JSON.parse(readFileSync(EXPECTED_JSON, 'utf8')) as PresentationData
}

function createFixtureFile(): File {
  const source = readFileSync(SOURCE_PPTX)
  return new File([source], 'template_1.pptx', { type: PPTX_MIME_TYPE })
}

async function createGeneratedBlob(deck: PresentationData): Promise<Blob> {
  const { blob } = await createPPTX(deck as any)
  return blob
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
    const expected = parseDocument(loadExpectedFixture()) as unknown as PresentationData
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

  it('exports PPTX without embedding custom JSON payloads', async () => {
    const source = {
      title: 'Round Trip Visual',
      width: 960,
      height: 540,
      slides: [
        {
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              rotate: 0,
              colors: [
                { pos: 0, color: '#EFEFEF' },
                { pos: 100, color: '#D6E4FF' }
              ]
            }
          },
          elements: [
            {
              id: 'text-1',
              type: 'text',
              left: 40,
              top: 60,
              width: 320,
              height: 70,
              content: '<p><strong>Round trip</strong> visual</p>',
              defaultColor: '#123456',
              defaultFontName: 'Aptos',
              fill: {
                type: 'solid',
                color: '#FFFFFF'
              },
              paragraphSpace: 0.5
            },
            {
              id: 'shape-1',
              type: 'shape',
              left: 420,
              top: 90,
              width: 180,
              height: 100,
              path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
              viewBox: [200, 200] as [number, number],
              fill: {
                type: 'gradient',
                gradient: {
                  type: 'linear',
                  rotate: 0,
                  colors: [
                    { pos: 0, color: '#FFDD00' },
                    { pos: 100, color: '#FFA000' }
                  ]
                }
              },
              text: {
                content: '<p>Shape text</p>',
                align: 'middle',
                defaultColor: '#654321',
                defaultFontName: 'Aptos'
              }
            }
          ]
        }
      ]
    } satisfies PresentationData

    const blob = await createGeneratedBlob(source)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const { deck, warnings } = await parsePptxToJson(
      new File([blob], 'generated.pptx', { type: PPTX_MIME_TYPE })
    )

    expect(zip.file('json2ppt-editor.json')).toBeNull()
    expect(warnings).toEqual([])
    expect(() => validateDocument(deck)).not.toThrow()
    expect(parseDocument(deck).slides).toHaveLength(1)
  })

  it('round-trips exported visual primitives through native PPT XML', async () => {
    const source = {
      title: 'Round Trip Primitives',
      width: 960,
      height: 540,
      slides: [
        {
          elements: [
            {
              id: 'txt1',
              type: 'text',
              left: 32,
              top: 24,
              width: 240,
              height: 72,
              content: '<p><strong>Heading</strong></p>',
              fill: {
                type: 'solid',
                color: '#FFFFFF'
              }
            },
            {
              id: 'shape1',
              type: 'shape',
              left: 320,
              top: 40,
              width: 180,
              height: 120,
              path: 'M 0 0 L 200 0 L 100 200 Z',
              viewBox: [200, 200] as [number, number],
              fill: {
                type: 'solid',
                color: '#FF7043'
              }
            },
            {
              id: 'badge1',
              type: 'shape',
              left: 560,
              top: 40,
              width: 220,
              height: 120,
              path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
              viewBox: [200, 200] as [number, number],
              fill: {
                type: 'solid',
                color: '#0F766E'
              },
              text: {
                content: '<p>Inside badge</p>',
                align: 'middle',
                defaultColor: '#FFFFFF',
                defaultFontName: 'Aptos'
              }
            }
          ]
        }
      ]
    } satisfies PresentationData

    const { blob } = await createPPTX(source as any)
    const { deck, warnings } = await parsePptxToJson(
      new File([blob], 'round-trip-primitives.pptx', { type: PPTX_MIME_TYPE })
    )

    expect(warnings).toEqual([])
    expect(() => validateDocument(deck)).not.toThrow()

    const slide = deck.slides[0]
    expect(slide.elements).toHaveLength(3)

    const textElement = slide.elements.find((element) => element.id === 'txt1')
    expect(textElement?.type).toBe('text')
    expect(getElementText(textElement as SlideElement)).toBe('Heading')

    const customShape = slide.elements.find((element) => element.id === 'shape1')
    expect(customShape?.type).toBe('shape')
    if (customShape?.type === 'shape') {
      expect(customShape.path).toBeDefined()
      expect(customShape.path).not.toMatch(/NaN/i)
      expect(customShape.text).toBeUndefined()
    }

    const badgeShape = slide.elements.find((element) => element.id === 'badge1')
    expect(badgeShape?.type).toBe('shape')
    if (badgeShape?.type === 'shape') {
      expect(normalizeText(badgeShape.text?.content ?? '')).toBe('Inside badge')
      expect(badgeShape.text?.align).toBe('middle')
    }
  })
})
