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

export type SlideElement = {
  type: string
  id?: string
  groupId?: string
  left?: number
  top?: number
  width?: number
  height?: number
  rotate?: number
  fill?: string
  pattern?: string
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
  background?: {
    type?: string
    color?: string
    src?: string
  }
  type?: string
}

export type Deck = {
  title?: string
  width?: number
  height?: number
  slides?: Slide[]
  theme?: {
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
}

export type BackendCoverData = {
  title: string
  text: string
}

export type BackendContentsData = {
  items: string[]
}

export type BackendTransitionData = {
  title: string
  text: string
}

export type BackendContentItem = {
  title: string
  text: string
}

export type BackendContentData = {
  title: string
  items: BackendContentItem[]
}

export type BackendSlide =
  | { type: 'cover'; data: BackendCoverData }
  | { type: 'contents'; data: BackendContentsData }
  | { type: 'transition'; data: BackendTransitionData }
  | { type: 'content'; data: BackendContentData }
  | { type: 'end'; data?: undefined }

export type PptxCustomContentInput = string | BackendSlide[]

export type PptxCustomThemeInput = {
  themeColors: string[]
  fontColor: string
  backgroundColor?: string
}

export type PptxCustomOptions = {
  customContent?: PptxCustomContentInput
  customTheme?: PptxCustomThemeInput
}
