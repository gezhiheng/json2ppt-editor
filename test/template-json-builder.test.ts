import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCustomContent } from '../src/lib/pptx-custom'

function loadCustomContentFixture (): string {
  return readFileSync('src/mock/custom-content-example.txt', 'utf8')
}

describe('parseCustomContent', () => {
  it('parses NDJSON custom content format', () => {
    const slides = parseCustomContent(loadCustomContentFixture())

    expect(slides.length).toBeGreaterThan(1)
    expect(slides[0]).toEqual({
      type: 'cover',
      data: {
        title: '2025科技前沿动态',
        text: '洞察全球科技创新趋势，展望未来产业变革方向'
      }
    })
    expect(slides[slides.length - 1]).toEqual({ type: 'end' })
  })

  it('parses JSON array custom content format', () => {
    const raw = JSON.stringify([
      { type: 'cover', data: { title: 'T', text: 'D' } },
      { type: 'end' }
    ])

    const slides = parseCustomContent(raw)
    expect(slides).toEqual([
      { type: 'cover', data: { title: 'T', text: 'D' } },
      { type: 'end' }
    ])
  })

  it('parses wrapped slides format and normalizes alias types', () => {
    const raw = JSON.stringify({
      slides: [
        { type: 'agenda', data: { items: ['A', 'B'] } },
        { type: 'section', data: { title: 'S1', text: 'desc' } },
        { type: 'ending' }
      ]
    })

    const slides = parseCustomContent(raw)
    expect(slides).toEqual([
      { type: 'contents', data: { items: ['A', 'B'] } },
      { type: 'transition', data: { title: 'S1', text: 'desc' } },
      { type: 'end' }
    ])
  })

  it('throws on invalid custom content shape', () => {
    expect(() =>
      parseCustomContent(
        JSON.stringify([{ type: 'content', data: { title: 'T', items: [] } }, { foo: 'bar' }])
      )
    ).toThrow('Invalid custom content format')
  })
})
