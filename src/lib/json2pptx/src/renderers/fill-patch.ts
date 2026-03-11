import type { ElementFill, FillGradient } from '../types/ppt'
import { formatColor } from './shared'

function stripFillTags(value: string): string {
  return value
    .replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/g, '')
    .replace(/<a:gradFill[\s\S]*?<\/a:gradFill>/g, '')
    .replace(/<a:blipFill>[\s\S]*?<\/a:blipFill>/g, '')
    .replace(/<a:noFill\s*\/>/g, '')
    .replace(/<a:noFill><\/a:noFill>/g, '')
}

function buildColorXml(color: string): string {
  const normalized = formatColor(color)
  const alphaXml =
    normalized.alpha < 1
      ? `<a:alpha val="${Math.round(normalized.alpha * 100000)}"/>`
      : ''

  return `<a:srgbClr val="${normalized.color.replace('#', '').toUpperCase()}">${alphaXml}</a:srgbClr>`
}

function buildGradientFillXml(gradient?: FillGradient): string {
  const stops = gradient?.colors ?? []
  const colors = stops.length
    ? stops
    : [
        { pos: 0, color: '#FFFFFF' },
        { pos: 100, color: '#FFFFFF' }
      ]

  const gsLst = colors
    .map((stop) => {
      const pos = Math.max(0, Math.min(100, stop.pos ?? 0))
      return `<a:gs pos="${Math.round(pos * 1000)}">${buildColorXml(
        stop.color ?? '#FFFFFF'
      )}</a:gs>`
    })
    .join('')

  const rotate = Math.round((gradient?.rotate ?? 0) * 60000)

  return `<a:gradFill rotWithShape="1"><a:gsLst>${gsLst}</a:gsLst><a:lin ang="${rotate}" scaled="0"/></a:gradFill>`
}

function buildImageFillXml(relId: string, opacity?: number): string {
  const alphaXml =
    opacity !== undefined && Number.isFinite(opacity) && opacity >= 0 && opacity < 1
      ? `<a:alphaModFix amt="${Math.round(opacity * 100000)}"/>`
      : ''

  return `<a:blipFill><a:blip r:embed="${relId}">${alphaXml}</a:blip><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill>`
}

function insertFillXml(spPrInner: string, fillXml: string): string {
  const cleanedInner = stripFillTags(spPrInner)

  if (cleanedInner.includes('</a:custGeom>')) {
    return cleanedInner.replace('</a:custGeom>', `</a:custGeom>${fillXml}`)
  }

  if (cleanedInner.includes('</a:prstGeom>')) {
    return cleanedInner.replace('</a:prstGeom>', `</a:prstGeom>${fillXml}`)
  }

  const lineIndex = cleanedInner.indexOf('<a:ln')
  if (lineIndex === -1) {
    return `${cleanedInner}${fillXml}`
  }

  return `${cleanedInner.slice(0, lineIndex)}${fillXml}${cleanedInner.slice(lineIndex)}`
}

function buildFillXml(fill: ElementFill, relId?: string): string {
  if (fill.type === 'gradient') {
    return buildGradientFillXml(fill.gradient)
  }

  if (fill.type === 'image') {
    if (!relId) {
      throw new Error('Image fills require a relationship id')
    }
    return buildImageFillXml(relId, fill.opacity)
  }

  return `<a:solidFill>${buildColorXml(fill.color ?? '#FFFFFF')}</a:solidFill>`
}

export function fillRequiresXmlPatch(fill?: ElementFill): boolean {
  return fill?.type === 'gradient' || fill?.type === 'image'
}

export function getFillFallbackColor(fill?: ElementFill, fallback = '#FFFFFF'): string {
  if (!fill) return fallback
  if (fill.type === 'solid') return fill.color ?? fallback
  if (fill.type === 'gradient') {
    return fill.gradient?.colors?.[0]?.color ?? fallback
  }
  return fallback
}

export function applyShapeFillPatch(
  slideXml: string,
  objectName: string,
  fill: ElementFill,
  relId?: string
): string {
  const nameToken = `name="${objectName}"`
  let cursor = 0
  let result = slideXml

  while (true) {
    const nameIndex = result.indexOf(nameToken, cursor)
    if (nameIndex === -1) break

    const spStart = result.lastIndexOf('<p:sp', nameIndex)
    const spEnd = result.indexOf('</p:sp>', nameIndex)
    if (spStart === -1 || spEnd === -1) break

    const spXml = result.slice(spStart, spEnd + '</p:sp>'.length)
    const spPrStart = spXml.indexOf('<p:spPr>')
    const spPrEnd = spXml.indexOf('</p:spPr>')
    if (spPrStart === -1 || spPrEnd === -1) {
      cursor = spEnd + 1
      continue
    }

    const spPrOpenEnd = spXml.indexOf('>', spPrStart)
    const spPrInner = spXml.slice(spPrOpenEnd + 1, spPrEnd)
    const fillXml = buildFillXml(fill, relId)
    const nextInner = insertFillXml(spPrInner, fillXml)
    const updatedSpXml = spXml.slice(0, spPrOpenEnd + 1) + nextInner + spXml.slice(spPrEnd)

    result = result.slice(0, spStart) + updatedSpXml + result.slice(spEnd + '</p:sp>'.length)
    cursor = spStart + updatedSpXml.length
  }

  return result
}

export function applyBackgroundFillPatch(
  slideXml: string,
  fill: ElementFill,
  relId?: string
): string {
  const bgPrStart = slideXml.indexOf('<p:bgPr>')
  const bgPrEnd = slideXml.indexOf('</p:bgPr>')
  if (bgPrStart === -1 || bgPrEnd === -1) return slideXml

  const openEnd = slideXml.indexOf('>', bgPrStart)
  const bgPrInner = slideXml.slice(openEnd + 1, bgPrEnd)
  const fillXml = buildFillXml(fill, relId)
  const nextInner = `${stripFillTags(bgPrInner)}${fillXml}`

  return slideXml.slice(0, openEnd + 1) + nextInner + slideXml.slice(bgPrEnd)
}
