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
  start?: [number, number];
  end?: [number, number];
  color?: string;
  clip?: {
    shape?: string;
  };
  filters?: {
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
    backgroundColor?: string;
  };
};
