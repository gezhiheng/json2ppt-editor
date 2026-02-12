import { describe, expect, it } from 'vitest'
import { SchemaValidationError } from 'json2pptx-schema'
import { createPPTX } from '../src/lib/json2pptx/src/index'
import { preparePreviewSlide } from '../src/lib/pptx-previewer/src/PPTXPreviewer'
import { applyCustomTheme } from '../src/lib/pptx-custom/src/custom-theme/index'

describe('schema integration', () => {
  it('json2pptx.createPPTX validates input via parse pipeline', async () => {
    await expect(
      createPPTX({
        title: 'broken',
        theme: {}
      } as any)
    ).rejects.toBeInstanceOf(SchemaValidationError)
  })

  it('pptx-previewer prepares slide through parse pipeline', () => {
    const slide = {
      id: 'slide-1',
      type: 'agenda',
      elements: [],
      background: {
        type: 'solid',
        color: '#ffffff'
      }
    }

    const prepared = preparePreviewSlide(slide as any)
    expect(prepared.type).toBe('contents')
  })

  it('pptx-custom.applyCustomTheme routes through parse pipeline', () => {
    const result = applyCustomTheme(
      {
        slides: [
          {
            id: 'slide-1',
            type: 'agenda',
            elements: []
          }
        ],
        theme: {}
      } as any,
      {
        themeColors: ['#111111', '#333333'],
        fontColor: '#222222'
      }
    ) as any

    expect(result.schemaVersion).toBe('1.0.0')
    expect(result.slides?.[0]?.type).toBe('contents')
  })
})
