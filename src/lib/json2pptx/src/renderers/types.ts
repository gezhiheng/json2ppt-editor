import type { ElementFill } from '../types/ppt'

export type ShapeFillPatch = {
  kind: 'shape'
  slideIndex: number
  objectName: string
  fill: ElementFill
}

export type BackgroundFillPatch = {
  kind: 'background'
  slideIndex: number
  fill: ElementFill
}

export type FillPatch = ShapeFillPatch | BackgroundFillPatch
