export type FillGradientStop = {
  pos?: number
  color?: string
}

export type FillGradient = {
  type?: string
  rotate?: number
  colors?: FillGradientStop[]
}

export type SolidFill = {
  type: 'solid'
  color?: string
}

export type GradientFill = {
  type: 'gradient'
  gradient?: FillGradient
}

export type ImageFill = {
  type: 'image'
  src?: string
  opacity?: number
}

export type ElementFill = SolidFill | GradientFill | ImageFill

export type ElementShadow = {
  color?: string
  h?: number
  v?: number
  blur?: number
}

export type ElementOutline = {
  width?: number
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
}

export type ElementFilters = {
  opacity?: string
}

export type ElementClip = {
  shape?: 'ellipse' | string
  range?: [[number, number], [number, number]]
}

export type TextContent = {
  content?: string
  defaultFontName?: string
  defaultColor?: string
  align?: string
}

export type BaseElement<T extends string = string> = {
  id?: string
  type: T
  left?: number
  top?: number
  width?: number
  height?: number
  rotate?: number
  opacity?: number
  flipH?: boolean
  flipV?: boolean
  shadow?: ElementShadow
  outline?: ElementOutline
}

export type TextElement = BaseElement<'text'> & {
  type: 'text'
  content?: string
  defaultFontName?: string
  defaultColor?: string
  fill?: ElementFill
  wordSpace?: number
  lineHeight?: number
  paragraphSpace?: number
  vertical?: boolean
}

export type ImageElement = BaseElement<'image'> & {
  type: 'image'
  src?: string
  filters?: ElementFilters
  clip?: ElementClip
}

export type ShapeElement = BaseElement<'shape'> & {
  type: 'shape'
  path?: string
  viewBox?: [number, number]
  fill?: ElementFill
  text?: TextContent
}

export type LineElement = BaseElement<'line'> & {
  type: 'line'
  start?: [number, number]
  end?: [number, number]
  broken?: [number, number]
  broken2?: [number, number]
  curve?: [number, number]
  cubic?: [[number, number], [number, number]]
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  points?: [unknown, unknown]
}

export type TableCellStyle = {
  fontname?: string
  color?: string
  align?: string
  fontsize?: string
  backcolor?: string
}

export type TableCellData = {
  id?: string
  colspan?: number
  rowspan?: number
  text?: string
  style?: TableCellStyle
}

export type TableElement = BaseElement<'table'> & {
  type: 'table'
  colWidths?: number[]
  data?: TableCellData[][]
  cellMinHeight?: number
}

export type SlideElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | LineElement
  | TableElement

export type SlideBackground = ElementFill

export type Slide = {
  background?: SlideBackground
  elements?: SlideElement[]
}

export type PresentationTheme = {
  themeColors?: string[]
  fontName?: string
  fontColor?: string
  backgroundColor?: string
  shadow?: ElementShadow
  outline?: ElementOutline
}

export type Presentation = {
  title?: string
  width?: number
  height?: number
  slides?: Slide[]
  theme?: PresentationTheme
}

export type PresentationData = Presentation

export type DeckTheme = PresentationTheme

export type Deck = Presentation
