import type {
  Presentation,
  PptxCustomThemeInput,
  Slide,
  SlideElement,
  ThemeScope
} from '../types'
import { parseColorToRgb } from './color-utils'
import type {
  BackgroundElementInput,
  LogoElementInput,
  LogoSize,
  MediaElementType,
  SlideScopeKey
} from './types'

const FALLBACK_SLIDE_WIDTH = 1000
const FALLBACK_SLIDE_HEIGHT = 562.5
const LOGO_MARGIN_X = 24
const LOGO_MARGIN_Y = 18
const LOGO_MAX_WIDTH_RATIO = 0.34
const LOGO_MAX_HEIGHT_RATIO = 0.16
const DEFAULT_LOGO_ASPECT_RATIO = 3.2

function mapSlideTypeToScopeKey (type?: string): SlideScopeKey {
  const normalized = type?.trim().toLowerCase()
  if (!normalized) return null

  if (normalized === 'cover') return 'cover'
  if (normalized === 'contents' || normalized === 'agenda') return 'contents'
  if (normalized === 'transition' || normalized === 'section') return 'transition'
  if (normalized === 'content') return 'content'
  if (normalized === 'end' || normalized === 'ending') return 'end'

  return null
}

function isSlideInScope (slide: Slide, scope: ThemeScope): boolean {
  const key = mapSlideTypeToScopeKey(slide.type)
  if (!key) return false
  return Boolean(scope[key])
}

function createElementId (
  prefix: MediaElementType,
  slideIndex: number
): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${slideIndex}-${random}`
}

function toHalfOpacityColor (value: string): string {
  const rgb = parseColorToRgb(value)
  if (!rgb) return value
  return `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`
}

function buildBackgroundElement (input: BackgroundElementInput): SlideElement {
  const { src, slideWidth, slideHeight, slideIndex } = input
  return {
    type: 'image',
    id: createElementId('background', slideIndex),
    src,
    width: slideWidth,
    height: slideHeight,
    left: 0,
    top: 0,
    fixedRatio: true,
    rotate: 0,
    imageType: 'background',
    filters: {
      opacity: '100%'
    }
  }
}

function resolveLogoAspectRatio (
  width?: number,
  height?: number
): number {
  if (
    typeof width === 'number' &&
    typeof height === 'number' &&
    width > 0 &&
    height > 0
  ) {
    return width / height
  }
  return DEFAULT_LOGO_ASPECT_RATIO
}

function resolveLogoSize (input: LogoElementInput): LogoSize {
  const {
    slideWidth,
    slideHeight,
    logoWidth,
    logoHeight
  } = input

  const aspectRatio = resolveLogoAspectRatio(logoWidth, logoHeight)
  const maxWidth = slideWidth * LOGO_MAX_WIDTH_RATIO
  const maxHeight = slideHeight * LOGO_MAX_HEIGHT_RATIO
  let width = maxWidth
  let height = width / aspectRatio

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return { width, height }
}

function buildLogoElement (input: LogoElementInput): SlideElement {
  const { src, slideWidth, slideIndex, position } = input
  const { width, height } = resolveLogoSize(input)

  const left =
    position === 'left'
      ? LOGO_MARGIN_X
      : Math.max(LOGO_MARGIN_X, slideWidth - width - LOGO_MARGIN_X)

  return {
    type: 'image',
    id: createElementId('logo', slideIndex),
    src,
    width,
    height,
    left,
    top: LOGO_MARGIN_Y,
    fixedRatio: true,
    rotate: 0,
    imageType: 'logo'
  }
}

export function replaceScopedMedia (
  deck: Presentation,
  input: PptxCustomThemeInput
): Presentation {
  if (!deck.slides?.length) return deck

  const slideWidth = deck.width ?? FALLBACK_SLIDE_WIDTH
  const slideHeight = deck.height ?? FALLBACK_SLIDE_HEIGHT
  const backgroundInput = input.backgroundImage
  const logoInput = input.logoImage
  const shouldClearBackground = Boolean(input.clearBackgroundImage)
  const shouldClearLogo = Boolean(input.clearLogoImage || shouldClearBackground)

  if (
    !backgroundInput?.src &&
    !logoInput?.src &&
    !shouldClearBackground &&
    !shouldClearLogo
  ) {
    return deck
  }

  const slides = deck.slides.map((slide, slideIndex) => {
    let nextElements = slide.elements ? [...slide.elements] : []
    let nextBackground = slide.background
    let changed = false

    if (shouldClearBackground) {
      const before = nextElements.length
      nextElements = nextElements.filter(
        element => !(element.type === 'image' && element.imageType === 'background')
      )
      if (nextElements.length !== before) {
        changed = true
        if (input.backgroundColor) {
          nextBackground = {
            ...(nextBackground ?? {}),
            type: 'solid',
            color: input.backgroundColor
          }
        }
      }
    }

    if (shouldClearLogo) {
      const before = nextElements.length
      nextElements = nextElements.filter(
        element => !(element.type === 'image' && element.imageType === 'logo')
      )
      if (nextElements.length !== before) {
        changed = true
      }
    }

    if (backgroundInput?.src && isSlideInScope(slide, backgroundInput.scope)) {
      const withoutBackground = nextElements.filter(
        element => !(element.type === 'image' && element.imageType === 'background')
      )
      nextElements = [
        buildBackgroundElement({
          src: backgroundInput.src,
          slideWidth,
          slideHeight,
          slideIndex
        }),
        ...withoutBackground
      ]
      changed = true

      if (input.backgroundColor) {
        nextBackground = {
          ...(nextBackground ?? {}),
          type: 'solid',
          color: toHalfOpacityColor(input.backgroundColor)
        }
      }
    }

    if (logoInput?.src && isSlideInScope(slide, logoInput.scope)) {
      const withoutLogo = nextElements.filter(
        element => !(element.type === 'image' && element.imageType === 'logo')
      )
      nextElements = [
        ...withoutLogo,
        buildLogoElement({
          src: logoInput.src,
          slideWidth,
          slideHeight,
          slideIndex,
          position: logoInput.position,
          logoWidth: logoInput.width,
          logoHeight: logoInput.height
        })
      ]
      changed = true
    }

    if (!changed && nextBackground === slide.background) return slide

    return {
      ...slide,
      ...(changed ? { elements: nextElements } : {}),
      ...(nextBackground ? { background: nextBackground } : {})
    }
  })

  return { ...deck, slides }
}
