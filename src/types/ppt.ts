export type SlideElement = {
  type: string;
  id?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rotate?: number;
  fill?: string;
  path?: string;
  viewBox?: [number, number];
  opacity?: number;
  outline?: {
    width?: number;
    color?: string;
  };
  shadow?: {
    h?: number;
    v?: number;
    blur?: number;
    color?: string;
  };
  content?: string;
  defaultColor?: string;
  src?: string;
  imageType?: string;
  start?: [number, number];
  end?: [number, number];
  color?: string;
  clip?: {
    shape?: string;
  };
  filters?: {
    grayscale?: string;
    opacity?: string;
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
