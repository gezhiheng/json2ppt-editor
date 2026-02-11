import type { Deck, PptxCustomThemeInput } from '../types'
import { colorsEqual, isWhiteColor } from './color-utils'
import { buildColorMappings, buildSingleMapping } from './mappings'
import { replaceSlideColors } from './replacers'

export function applyTheme2Json (deck: Deck, update: PptxCustomThemeInput): Deck {
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
    const currentColor = nextSlide.background?.color
    const shouldUpdate =
      !currentColor ||
      (prevBackground && colorsEqual(currentColor, prevBackground)) ||
      (!prevBackground && isWhiteColor(currentColor))
    if (!shouldUpdate) return nextSlide
    return {
      ...nextSlide,
      background: {
        ...(nextSlide.background ?? {}),
        type: nextSlide.background?.type ?? 'solid',
        color: nextBackground
      }
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
