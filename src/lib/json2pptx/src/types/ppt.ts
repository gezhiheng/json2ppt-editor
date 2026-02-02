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
  fill?: string
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
  fill?: string
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

export type SlideElement = TextElement | ImageElement | ShapeElement | LineElement

export type SlideBackground = {
  color?: string
}

export type Slide = {
  background?: SlideBackground
  elements?: SlideElement[]
}

export type DeckTheme = {
  fontName?: string
}

export type Deck = {
  title?: string
  width?: number
  height?: number
  slides?: Slide[]
  theme?: DeckTheme
}
