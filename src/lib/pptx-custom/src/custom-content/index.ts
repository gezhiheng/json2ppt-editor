import type { PptxCustomContentInput, TemplateJson } from '../types'
import { parseCustomContent } from './parser'
import { applyCustomContentToTemplate } from './template-builder'

export function applyCustomContent (
  template: TemplateJson,
  input: PptxCustomContentInput
): TemplateJson {
  const backendSlides = typeof input === 'string' ? parseCustomContent(input) : input
  return applyCustomContentToTemplate(template, backendSlides)
}
