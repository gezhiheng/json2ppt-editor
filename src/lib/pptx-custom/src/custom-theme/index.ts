import { parseDocument } from 'json2pptx-schema'
import type { Presentation, PptxCustomThemeInput } from '../types'
import { replaceScopedMedia } from './media'
import { applyTheme2Json } from './theme-applier'

type PresentationDocument = ReturnType<typeof parseDocument>

export function applyCustomTheme (
  deck: Presentation,
  input: PptxCustomThemeInput
): Presentation {
  const normalizedDeck: PresentationDocument = parseDocument(deck)
  const withColors = applyTheme2Json(normalizedDeck as unknown as Presentation, input)
  const withMedia = replaceScopedMedia(withColors, input)
  return parseDocument(withMedia) as unknown as Presentation
}

export { applyTheme2Json }
