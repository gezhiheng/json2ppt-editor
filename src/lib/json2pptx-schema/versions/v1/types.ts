export const V1_SCHEMA_VERSION = '1.0.0' as const

export type V1SchemaVersion = typeof V1_SCHEMA_VERSION

export type V1Outline = {
  width: number
  color: string
  style: string
  [key: string]: unknown
}

export type V1Shadow = {
  h: number
  v: number
  blur: number
  color: string
  [key: string]: unknown
}

export type V1GradientStop = {
  pos: number
  color: string
  [key: string]: unknown
}

export type V1Gradient = {
  type: string
  rotate: number
  colors: V1GradientStop[]
  [key: string]: unknown
}

export type V1ThemeInput = {
  themeColors?: string[]
  fontColor?: string
  fontName?: string
  backgroundColor?: string
  shadow?: Partial<V1Shadow>
  outline?: Partial<V1Outline>
  [key: string]: unknown
}

export type V1Theme = {
  themeColors: string[]
  fontColor: string
  fontName: string
  backgroundColor: string
  shadow: V1Shadow
  outline: V1Outline
  [key: string]: unknown
}

export type V1SlideBackgroundInput = {
  type?: string
  color?: string
  src?: string
  gradient?: V1Gradient
  [key: string]: unknown
}

export type V1SlideBackground = {
  type: string
  color?: string
  src?: string
  gradient?: V1Gradient
  [key: string]: unknown
}

export type V1ElementBaseInput<T extends string = string> = {
  type: T
  id?: string
  groupId?: string
  left?: number
  top?: number
  width?: number
  height?: number
  rotate?: number
  lock?: boolean
  opacity?: number
  flipH?: boolean
  flipV?: boolean
  outline?: Partial<V1Outline>
  shadow?: Partial<V1Shadow>
  [key: string]: unknown
}

export type V1ElementBase<T extends string = string> = V1ElementBaseInput<T> & {
  id: string
  left: number
  top: number
  rotate: number
}

export type V1ShapeText = {
  content: string
  defaultColor?: string
  defaultFontName?: string
  align?: string
  lineHeight?: number
  type?: string
  [key: string]: unknown
}

export type V1TextElementInput = V1ElementBaseInput<'text'> & {
  content?: string
  defaultColor?: string
  defaultFontName?: string
  fill?: string
  lineHeight?: number
  paragraphSpace?: number
  textType?: string
  vertical?: boolean
  wordSpace?: number
}

export type V1TextElement = V1ElementBase<'text'> & {
  width: number
  height: number
  content: string
  defaultColor: string
  defaultFontName: string
  fill?: string
  lineHeight?: number
  paragraphSpace?: number
  textType?: string
  vertical: boolean
  wordSpace?: number
}

export type V1ShapeElementInput = V1ElementBaseInput<'shape'> & {
  path?: string
  viewBox?: [number, number]
  fill?: string
  fixedRatio?: boolean
  keypoints?: number[]
  pathFormula?: string
  gradient?: V1Gradient
  special?: boolean
  text?: V1ShapeText
}

export type V1ShapeElement = V1ElementBase<'shape'> & {
  width: number
  height: number
  path: string
  viewBox: [number, number]
  fill: string
  fixedRatio: boolean
  keypoints?: number[]
  pathFormula?: string
  gradient?: V1Gradient
  special?: boolean
  text?: V1ShapeText
}

export type V1LineElementInput = V1ElementBaseInput<'line'> & {
  start?: [number, number]
  end?: [number, number]
  points?: string[]
  broken?: [number, number]
  color?: string
  style?: string
  width?: number
}

export type V1LineElement = V1ElementBase<'line'> & {
  start: [number, number]
  end: [number, number]
  points: [string, string]
  broken?: [number, number]
  color: string
  style: string
  width: number
}

export type V1ImageClip = {
  shape: string
  range: [[number, number], [number, number]]
  [key: string]: unknown
}

export type V1ImageFilters = {
  opacity?: string | number
  grayscale?: string | number
  blur?: string | number
  sepia?: string | number
  saturate?: string | number
  [key: string]: unknown
}

export type V1ImageElementInput = V1ElementBaseInput<'image'> & {
  src?: string
  fixedRatio?: boolean
  clip?: V1ImageClip
  filters?: V1ImageFilters
  imageType?: string
  radius?: number
  colorMask?: string
}

export type V1ImageElement = V1ElementBase<'image'> & {
  width: number
  height: number
  src: string
  fixedRatio: boolean
  clip?: V1ImageClip
  filters?: V1ImageFilters
  imageType?: string
  radius?: number
  colorMask?: string
}

export type V1UnknownElementInput = V1ElementBaseInput<string>

export type V1UnknownElement = V1ElementBase<string>

export type V1ElementInput =
  | V1TextElementInput
  | V1ShapeElementInput
  | V1LineElementInput
  | V1ImageElementInput
  | V1UnknownElementInput

export type V1Element =
  | V1TextElement
  | V1ShapeElement
  | V1LineElement
  | V1ImageElement
  | V1UnknownElement

export type V1SlideInput = {
  id?: string
  type?: string
  remark?: string
  background?: V1SlideBackgroundInput
  elements?: V1ElementInput[]
  [key: string]: unknown
}

export type V1Slide = {
  id: string
  type: string
  remark: string
  background?: V1SlideBackground
  elements: V1Element[]
  [key: string]: unknown
}

export type V1DocumentInput = {
  schemaVersion?: string
  version?: string | number
  title?: string
  width?: number
  height?: number
  theme?: V1ThemeInput
  slides: V1SlideInput[]
  [key: string]: unknown
}

export type V1Document = {
  schemaVersion: V1SchemaVersion
  title: string
  width: number
  height: number
  theme: V1Theme
  slides: V1Slide[]
  [key: string]: unknown
}
