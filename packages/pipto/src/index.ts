import * as schema from 'json2pptx-schema'
import * as json2pptx from 'json2pptx'
import * as ppt2json from 'ppt2json'
import * as pptxCustom from 'pptx-custom'

export { schema, json2pptx, ppt2json, pptxCustom }

export {
  parseDocument,
  migrateDocument,
  validateDocument,
  normalizeDocument,
  SchemaValidationError,
  UnsupportedSchemaVersionError,
  DEFAULT_SCHEMA_VERSION,
  DEFAULT_TITLE,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_THEME,
  DEFAULT_THEME_SHADOW,
  DEFAULT_THEME_OUTLINE,
  DEFAULT_SLIDE_TYPE,
  DEFAULT_SLIDE_REMARK,
  V1_DEFAULTS,
  V1_SCHEMA_VERSION
} from 'json2pptx-schema'
export {
  createPPTX,
  buildPptxBlob,
  getElementRange,
  getLineElementPath,
  resolveImageData
} from 'json2pptx'
export { parsePptxToJson } from 'ppt2json'
export {
  parseCustomContent,
  applyCustomContent,
  applyCustomContentToTemplate,
  applyCustomTheme
} from 'pptx-custom'

export type {
  PPTXPreviewerProps,
  Slide as PreviewSlide,
  SlideElement as PreviewSlideElement
} from 'pptx-previewer'

export function importPPTXPreviewer() {
  return import('pptx-previewer')
}
