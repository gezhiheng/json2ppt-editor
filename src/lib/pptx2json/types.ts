export type FillGradientStop = {
  pos?: number
  color?: string
}

export type FillGradient = {
  type?: string
  rotate?: number
  colors?: FillGradientStop[]
}

export type ElementFill =
  | {
      type: 'solid'
      color?: string
    }
  | {
      type: 'gradient'
      gradient?: FillGradient
    }
  | {
      type: 'image'
      src?: string
      opacity?: number
    }

export type SlideElement = {
  type: string
  id?: string
  groupId?: string
  left?: number
  top?: number
  width?: number
  height?: number
  rotate?: number
  fill?: ElementFill
  path?: string
  viewBox?: [number, number]
  pathFormula?: string
  keypoints?: number[]
  special?: boolean
  opacity?: number
  fixedRatio?: boolean
  outline?: {
    width?: number
    color?: string
    style?: string
  }
  shadow?: {
    h?: number
    v?: number
    blur?: number
    color?: string
  }
  content?: string
  defaultColor?: string
  defaultFontName?: string
  wordSpace?: number
  lineHeight?: number
  paragraphSpace?: number
  vertical?: boolean
  src?: string
  imageType?: string
  flipH?: boolean
  flipV?: boolean
  start?: [number, number]
  end?: [number, number]
  broken?: [number, number]
  broken2?: [number, number]
  curve?: [number, number]
  cubic?: [[number, number], [number, number]]
  color?: string
  points?: string[]
  style?: string
  clip?: {
    shape?: string
    range?: [[number, number], [number, number]]
  }
  filters?: {
    grayscale?: string
    opacity?: string
  }
  colWidths?: number[]
  data?: Array<
    Array<{
      id?: string
      colspan?: number
      rowspan?: number
      text?: string
      style?: {
        fontname?: string
        color?: string
        align?: string
        fontsize?: string
        backcolor?: string
      }
    }>
  >
  cellMinHeight?: number
  text?: {
    content: string
    defaultColor?: string
    defaultFontName?: string
    align?: string
    lineHeight?: number
  }
}

export type Slide = {
  id?: string
  elements?: SlideElement[]
  remark?: string
  background?: ElementFill
  type?: string
}

export type PresentationTheme = {
  themeColors?: string[]
  fontName?: string
  fontColor?: string
  backgroundColor?: string
  shadow?: {
    h?: number
    v?: number
    blur?: number
    color?: string
  }
  outline?: {
    width?: number
    color?: string
    style?: string
  }
}

export type PresentationData = {
  title?: string
  width?: number
  height?: number
  slides?: Slide[]
  theme?: PresentationTheme
}

export type Presentation = PresentationData

export type Deck = PresentationData
