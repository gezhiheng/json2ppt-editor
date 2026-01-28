export type SlideElement = {
  type: string;
  id?: string;
  groupId?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rotate?: number;
  fill?: string;
  path?: string;
  viewBox?: [number, number];
  pathFormula?: string;
  keypoints?: string;
  opacity?: number;
  outline?: {
    width?: number;
    color?: string;
    style?: string;
  };
  shadow?: {
    h?: number;
    v?: number;
    blur?: number;
    color?: string;
  };
  content?: string;
  defaultColor?: string;
  defaultFontName?: string;
  wordSpace?: number;
  lineHeight?: number;
  paragraphSpace?: number;
  vertical?: boolean;
  src?: string;
  imageType?: string;
  flipH?: boolean;
  flipV?: boolean;
  start?: [number, number];
  end?: [number, number];
  broken?: [number, number];
  broken2?: [number, number];
  curve?: [number, number];
  cubic?: [[number, number], [number, number]];
  color?: string;
  points?: string[];
  style?: string;
  clip?: {
    shape?: string;
    range?: [[number, number], [number, number]];
  };
  filters?: {
    grayscale?: string;
    opacity?: string;
  };
  text?: {
    content: string;
    defaultColor?: string;
    defaultFontName?: string;
    align?: string;
  };
};

export type Slide = {
  id?: string;
  elements?: SlideElement[];
  background?: {
    type?: string;
    color?: string;
  };
  type?: string;
};

export type Deck = {
  title?: string;
  width?: number;
  height?: number;
  slides?: Slide[];
  theme?: {
    fontName?: string;
    fontColor?: string;
    backgroundColor?: string;
  };
};
