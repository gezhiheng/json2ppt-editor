import { parseDocument } from 'json2pptx-schema'
import type {
  PptxCustomContentInput,
  TemplateJson,
  TemplateJsonElement,
  TemplateJsonImage
} from '../types'
import { parseCustomContent } from './parser'
import { applyCustomContentToTemplate } from './template-builder'

const FALLBACK_SLIDE_WIDTH = 1000
const FALLBACK_SLIDE_HEIGHT = 562.5
const LOGO_MARGIN_X = 24
const LOGO_MARGIN_Y = 18
const LOGO_MAX_WIDTH_RATIO = 0.34
const LOGO_MAX_HEIGHT_RATIO = 0.16

function isLogoImageElement (
  element: TemplateJsonElement
): element is TemplateJsonImage {
  return element.type === 'image' && element.imageType === 'logo'
}

function fitSize (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const safeWidth = width > 0 ? width : maxWidth
  const safeHeight = height > 0 ? height : maxHeight
  const scale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight)
  return {
    width: safeWidth * scale,
    height: safeHeight * scale
  }
}

function normalizeLogoElements (deck: TemplateJson): TemplateJson {
  const slideWidth = deck.width || FALLBACK_SLIDE_WIDTH
  const slideHeight = deck.height || FALLBACK_SLIDE_HEIGHT
  const logoMaxWidth = slideWidth * LOGO_MAX_WIDTH_RATIO
  const logoMaxHeight = slideHeight * LOGO_MAX_HEIGHT_RATIO

  const slides = deck.slides.map(slide => {
    let changed = false
    const elements = slide.elements.map(element => {
      if (!isLogoImageElement(element)) return element

      const size = fitSize(
        element.width ?? logoMaxWidth,
        element.height ?? logoMaxHeight,
        logoMaxWidth,
        logoMaxHeight
      )
      const isLeft = (element.left ?? 0) < slideWidth / 2
      const left = isLeft
        ? LOGO_MARGIN_X
        : Math.max(LOGO_MARGIN_X, slideWidth - size.width - LOGO_MARGIN_X)
      const top = LOGO_MARGIN_Y
      const { clip: _clip, ...rest } = element

      changed = true
      return {
        ...rest,
        left,
        top,
        width: size.width,
        height: size.height,
        fixedRatio: true
      }
    })

    return changed ? { ...slide, elements } : slide
  })

  return { ...deck, slides }
}

export function applyCustomContent (
  template: TemplateJson,
  input: PptxCustomContentInput
): TemplateJson {
  const normalizedTemplate = parseDocument(template) as unknown as TemplateJson
  const CustomSlides = typeof input === 'string' ? parseCustomContent(input) : input
  const updated = applyCustomContentToTemplate(normalizedTemplate, CustomSlides)
  const withNormalizedLogo = normalizeLogoElements(updated)
  return parseDocument(withNormalizedLogo) as unknown as TemplateJson
}

export { parseCustomContent, applyCustomContentToTemplate }
