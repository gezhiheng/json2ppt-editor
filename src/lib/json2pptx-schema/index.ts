export { parseDocument } from './runtime/parse'
export { migrateDocument } from './runtime/migrate'
export { validateDocument } from './runtime/validate'
export { normalizeDocument } from './runtime/normalize'

export {
  SchemaValidationError,
  UnsupportedSchemaVersionError
} from './runtime/errors'

export {
  DEFAULT_SCHEMA_VERSION,
  DEFAULT_TITLE,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_THEME,
  DEFAULT_THEME_SHADOW,
  DEFAULT_THEME_OUTLINE,
  DEFAULT_SLIDE_TYPE,
  DEFAULT_SLIDE_REMARK,
  V1_DEFAULTS
} from './versions/v1/defaults'

export { V1_SCHEMA_VERSION } from './versions/v1/types'

export type {
  V1Document,
  V1DocumentInput,
  V1Element,
  V1ElementInput,
  V1Gradient,
  V1ImageElement,
  V1LineElement,
  V1Outline,
  V1SchemaVersion,
  V1Shadow,
  V1ShapeElement,
  V1Slide,
  V1SlideBackground,
  V1SlideInput,
  V1TextElement,
  V1Theme,
  V1ThemeInput
} from './versions/v1/types'

export type { SchemaValidationIssue } from './runtime/errors'
