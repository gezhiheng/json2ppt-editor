export type TemplatePalette = {
  primary: string
  secondary: string
  accent: string
  neutral: string
  background: string
}

export type TemplateFonts = {
  head: string
  body: string
}

export type SlideScope = 'cover' | 'agenda' | 'section' | 'content' | 'ending'

export type TemplateImageAsset = {
  src: string
  scope: SlideScope[]
}

export type TemplateLogoAsset = TemplateImageAsset & {
  position: 'left-top' | 'right-top'
}

export type TemplateAssets = {
  background?: TemplateImageAsset
  logo?: TemplateLogoAsset
}

export type TemplateSettings = {
  id: string
  originFilename?: string
  name: string
  category: string
  description: string
  tags: string[]
  themeColors?: string[]
  fontColor?: string
  backgroundColor?: string
  fonts: TemplateFonts
  assets?: TemplateAssets
  createdAt: string
}

export type TemplateJsonTheme = {
  themeColors: string[]
  fontColor: string
  fontName: string
  backgroundColor: string
  shadow?: {
    h: number
    v: number
    blur: number
    color: string
  }
  outline?: {
    width: number
    color: string
    style: string
  }
}

export type TemplateJsonShadow = {
  h: number
  v: number
  blur: number
  color: string
}

export type TemplateJsonOutline = {
  width: number
  color: string
  style: string
}

export type TemplateJsonElementBase = {
  type: string
  id: string
  left: number
  top: number
  width?: number
  height?: number
  rotate?: number
  lock?: boolean
  opacity?: number
  flipH?: boolean
  flipV?: boolean
}

export type TemplateJsonShape = TemplateJsonElementBase & {
  type: 'shape'
  viewBox: [number, number]
  path: string
  fill: string
  fixedRatio?: boolean
  shadow?: TemplateJsonShadow
  outline?: TemplateJsonOutline
  pathFormula?: string
  keypoints?: number[]
  flipH?: boolean
  flipV?: boolean
}

export type TemplateJsonText = TemplateJsonElementBase & {
  type: 'text'
  content: string
  defaultFontName?: string
  defaultColor?: string
  vertical?: boolean
  textType?: string
}

export type TemplateJsonLine = TemplateJsonElementBase & {
  type: 'line'
  start: [number, number]
  end: [number, number]
  points: string[]
  color: string
  style: string
  width: number
}

export type TemplateJsonImage = TemplateJsonElementBase & {
  type: 'image'
  src: string
  fixedRatio?: boolean
  clip?: {
    shape: string
    range: [number, number][]
  }
  filters?: {
    grayscale?: string
    opacity?: string
  }
  imageType?: string
}

export type TemplateJsonElement =
  | TemplateJsonShape
  | TemplateJsonText
  | TemplateJsonLine
  | TemplateJsonImage

export type TemplateJsonSlide = {
  id: string
  elements: TemplateJsonElement[]
  background?: {
    type: string
    color: string
  }
  type?: string
}

export type TemplateJson = {
  title: string
  width: number
  height: number
  theme: TemplateJsonTheme
  slides: TemplateJsonSlide[]
}
