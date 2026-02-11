import { applyCustomContent, parseCustomContent, applyCustomContentToTemplate } from './custom-content/index'
import { applyCustomTheme } from './custom-theme/index'

export {
  parseCustomContent,
  applyCustomContent,

  applyCustomTheme,
}

export type {
  CustomSlide,
  Deck,
  PptxCustomContentInput,
  PptxCustomOptions,
  PptxCustomThemeInput,
  TemplateJson,
  TemplateJsonElement,
  TemplateJsonSlide,
  TemplateJsonTheme
} from './types'
