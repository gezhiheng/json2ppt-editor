import { parseDocument } from 'json2pptx-schema'
import type { PptxCustomContentInput, TemplateJson } from '../types'
import { parseCustomContent } from './parser'
import { applyCustomContentToTemplate } from './template-builder'

export function applyCustomContent (
  template: TemplateJson,
  input: PptxCustomContentInput
): TemplateJson {
  const normalizedTemplate = parseDocument(template) as unknown as TemplateJson
  const CustomSlides = typeof input === 'string' ? parseCustomContent(input) : input
  const updated = applyCustomContentToTemplate(normalizedTemplate, CustomSlides)
  return parseDocument(updated) as unknown as TemplateJson
}

export { parseCustomContent, applyCustomContentToTemplate }
