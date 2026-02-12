import type {
  V1Document,
  V1Outline,
  V1SchemaVersion,
  V1Shadow,
  V1Theme
} from './types'

export const DEFAULT_SCHEMA_VERSION: V1SchemaVersion = '1.0.0'
export const DEFAULT_TITLE = '未命名演示文稿'
export const DEFAULT_WIDTH = 1000
export const DEFAULT_HEIGHT = 562.5

export const DEFAULT_THEME_SHADOW: V1Shadow = {
  h: 3,
  v: 3,
  blur: 2,
  color: '#808080'
}

export const DEFAULT_THEME_OUTLINE: V1Outline = {
  width: 2,
  color: '#525252',
  style: 'solid'
}

export const DEFAULT_THEME: V1Theme = {
  themeColors: [],
  fontColor: '#333',
  fontName: '',
  backgroundColor: '#fff',
  shadow: DEFAULT_THEME_SHADOW,
  outline: DEFAULT_THEME_OUTLINE
}

export const DEFAULT_SLIDE_TYPE = 'content'
export const DEFAULT_SLIDE_REMARK = ''

export const DEFAULT_TEXT_COLOR = '#333'
export const DEFAULT_ELEMENT_ROTATE = 0
export const DEFAULT_IMAGE_FIXED_RATIO = true
export const DEFAULT_SHAPE_FIXED_RATIO = false
export const DEFAULT_LINE_STYLE = 'solid'
export const DEFAULT_LINE_WIDTH = 2

export const LEGACY_SLIDE_TYPE_MAP: Record<string, string> = {
  agenda: 'contents',
  section: 'transition',
  ending: 'end'
}

export const V1_DEFAULTS: Pick<
  V1Document,
  'schemaVersion' | 'title' | 'width' | 'height'
> & {
  theme: V1Theme
} = {
  schemaVersion: DEFAULT_SCHEMA_VERSION,
  title: DEFAULT_TITLE,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  theme: DEFAULT_THEME
}
