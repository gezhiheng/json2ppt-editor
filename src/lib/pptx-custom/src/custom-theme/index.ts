import { parseDocument } from 'json2pptx-schema'
import type { Deck, PptxCustomThemeInput } from '../types'
import { applyTheme2Json } from './theme-applier'

export function applyCustomTheme (
  deck: Deck,
  input: PptxCustomThemeInput
): Deck {
  const normalizedDeck = parseDocument(deck) as unknown as Deck
  const updated = applyTheme2Json(normalizedDeck, input)
  return parseDocument(updated) as unknown as Deck
}

export { applyTheme2Json }
