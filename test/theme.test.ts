import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { applyThemeToDeck } from '../src/lib/theme'
import type { Deck } from '../src/types/ppt'

function loadSlideFixture () {
  const raw = readFileSync('test/assets/json/debug-source-1.json', 'utf8')
  return JSON.parse(raw)
}

function loadFontColorFixture () {
  const raw = readFileSync('test/assets/json/debug-font-color.json', 'utf8')
  return JSON.parse(raw)
}

function buildDeck (slide: unknown): Deck {
  return {
    slides: [slide],
    theme: {
      themeColors: ['rgb(155, 0, 0)'],
      fontColor: 'rgb(51, 51, 51)'
    }
  }
}

function findElementContent (deck: Deck, id: string): string {
  const slide = deck.slides?.[0]
  const element = slide?.elements?.find(item => item?.id === id)
  return element?.content ?? ''
}

describe('applyThemeToDeck', () => {
  it('does not replace rich text content with a pure color string', () => {
    const slide = loadSlideFixture()
    const deck = buildDeck(slide)

    const updated = applyThemeToDeck(deck, {
      themeColors: ['#E87D7D'],
      fontColor: 'rgb(51, 51, 51)'
  })

  const titleContent = findElementContent(updated, 'oceR4eX40A')
  const bodyContent = findElementContent(updated, 'NRraxaj2D1')
  const footerContent = findElementContent(updated, 'cIC8jvn_Z4')

    expect(titleContent).toContain('模板封面标题')
    expect(titleContent).toContain('color: rgb(51,51,51)')
    expect(titleContent).not.toBe('#E87D7D')

    expect(bodyContent).toContain('模板封面正文')
    expect(bodyContent).not.toBe('rgb(128,128,128)')

  expect(footerContent).toContain('演讲人：XXX')
  expect(footerContent).not.toBe('rgb(128,128,128)')
})

it('applies font color to html content and defaultColor', () => {
  const slide = loadFontColorFixture()
  const deck = buildDeck(slide)

  const updated = applyThemeToDeck(deck, {
    themeColors: ['rgb(155, 0, 0)'],
    fontColor: '#123456'
  })

  const titleContent = findElementContent(updated, 'oceR4eX40A')
  const bodyContent = findElementContent(updated, 'NRraxaj2D1')
  const footerContent = findElementContent(updated, 'cIC8jvn_Z4')

  expect(titleContent).toContain('color: #123456')
  expect(bodyContent).toContain('color: #123456')
  expect(footerContent).toContain('color: #123456')

  const slideElements = updated.slides?.[0]?.elements ?? []
  for (const element of slideElements) {
    if (element.type === 'text') {
      expect(element.defaultColor).toBe('#123456')
    }
  }
})
})
