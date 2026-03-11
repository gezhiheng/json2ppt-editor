import type { Presentation, PptxCustomThemeInput } from '../types'
import { colorsEqual, isWhiteColor } from './color-utils'
import { buildColorMappings, buildSingleMapping } from './mappings'
import { replaceSlideColors } from './replacers'

type SolidBackground = Extract<NonNullable<Presentation['slides']>[number]['background'], { type: 'solid' }>

export function applyTheme2Json (deck: Presentation, update: PptxCustomThemeInput): Presentation {
  const previousTheme = deck.theme ?? {}
  const themeColors = update.themeColors.slice(0, 6)
  const themeMappings = buildColorMappings(
    previousTheme.themeColors ?? [],
    themeColors
  )
  const fontMapping = buildSingleMapping(
    previousTheme.fontColor,
    update.fontColor
  )
  const fontMappings = fontMapping ? [fontMapping] : []

  const nextBackground = update.backgroundColor ?? previousTheme.backgroundColor
  const prevBackground = previousTheme.backgroundColor
  const slides = deck.slides?.map((slide) => {
    const nextSlide = replaceSlideColors(
      slide,
      themeMappings,
      fontMappings,
      update.fontColor
    )
    if (!nextBackground) return nextSlide
    const currentColor =
      nextSlide.background?.type === 'solid' ? nextSlide.background.color : undefined
    const shouldUpdate =
      !currentColor ||
      (prevBackground && colorsEqual(currentColor, prevBackground)) ||
      (!prevBackground && isWhiteColor(currentColor))
    if (!shouldUpdate) return nextSlide
    return {
      ...nextSlide,
      background: createSolidBackground(nextBackground)
    }
  })

  return {
    ...deck,
    theme: {
      ...previousTheme,
      themeColors,
      fontColor: update.fontColor,
      backgroundColor: update.backgroundColor ?? previousTheme.backgroundColor
    },
    slides
  }
}

function createSolidBackground (color: string): SolidBackground {
  return {
    type: 'solid',
    color
  }
}
