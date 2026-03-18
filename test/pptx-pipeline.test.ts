import { describe, expect, it } from 'vitest'
import { validateDocument } from 'json2pptx-schema'
import { createPPTX } from '../src/lib/json2pptx/src/index'
import { parsePptxToJson } from '../src/lib/pptx2json/index'
import type { PresentationData, SlideElement } from '../src/types/ppt'

const PPTX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const INLINE_PNG =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

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

describe('ppt pipeline integration', () => {
  it('round-trips basic slide content through json2pptx and pptx2json', async () => {
    const source = {
      title: 'Pipeline Smoke',
      width: 960,
      height: 540,
      slides: [
        {
          background: {
            type: 'solid',
            color: '#FFFFFF'
          },
          elements: [
            {
              id: 'text-1',
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
              id: 'shape-1',
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
              },
              text: {
                content: '<p>Inside badge</p>',
                align: 'middle',
                defaultColor: '#FFFFFF',
                defaultFontName: 'Aptos'
              }
            },
            {
              id: 'image-1',
              type: 'image',
              src: INLINE_PNG,
              left: 620,
              top: 36,
              width: 120,
              height: 120,
              fixedRatio: true
            }
          ]
        }
      ]
    } satisfies PresentationData

    const { blob } = await createPPTX(source as any)
    const { presentation, warnings } = await parsePptxToJson(
      new File([blob], 'pipeline-smoke.pptx', { type: PPTX_MIME_TYPE })
    )

    expect(warnings).toEqual([])
    expect(() => validateDocument(presentation)).not.toThrow()
    expect(presentation.slides).toHaveLength(1)

    const slide = presentation.slides[0]
    expect(slide.elements).toHaveLength(3)
    expect(slide.elements.some((element) => getElementText(element) === 'Heading')).toBe(true)
    expect(slide.elements.some((element) => element.type === 'image')).toBe(true)

    const shape = slide.elements.find((element) => element.id === 'shape-1')
    expect(shape?.type).toBe('shape')
    if (shape?.type === 'shape') {
      expect(getElementText(shape)).toBe('Inside badge')
      expect(shape.path).toBeDefined()
    }
  })
})
