import type { Deck, PptxCustomThemeInput } from '../types'
import { applyTheme2Json } from './theme-applier'

export function applyCustomTheme (
  deck: Deck,
  input: PptxCustomThemeInput
): Deck {
  return applyTheme2Json(deck, input)
}
