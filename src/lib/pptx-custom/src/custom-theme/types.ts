export type RGB = {
  r: number
  g: number
  b: number
}

export type ColorMapping = {
  fromRgb: RGB
  toRgb: RGB
  toHex?: string
}
