import { applyCustomContent, parseCustomContent, applyCustomContentToTemplate } from './custom-content/index'
import { applyCustomTheme } from './custom-theme/index'

export {
  parseCustomContent,
  applyCustomContent,
  applyCustomContentToTemplate,

  applyCustomTheme,
}

export type {
  CustomSlide,
  Deck,
  Presentation,
  PresentationData,
  PresentationTheme,
  PptxCustomContentInput,
  PptxCustomOptions,
  PptxCustomThemeInput,
  TemplateJson,
  TemplateJsonElement,
  TemplateJsonSlide,
  TemplateJsonTheme
} from './types'
