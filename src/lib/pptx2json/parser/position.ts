import { RATIO_EMUs_Points } from './constants'
import { numberToFixed } from './utils'
import type { AnyRecord, XmlNode } from './types'

type Position = { top: number; left: number }
type Size = { width: number; height: number }

export function getPosition(slideSpNode: XmlNode, slideLayoutSpNode: XmlNode, slideMasterSpNode: XmlNode): Position {
  let off: AnyRecord | undefined

  if (slideSpNode) off = (slideSpNode as AnyRecord)?.['a:off']?.['attrs'] as AnyRecord
  else if (slideLayoutSpNode) off = (slideLayoutSpNode as AnyRecord)?.['a:off']?.['attrs'] as AnyRecord
  else if (slideMasterSpNode) off = (slideMasterSpNode as AnyRecord)?.['a:off']?.['attrs'] as AnyRecord

  if (!off) return { top: 0, left: 0 }

  return {
    top: numberToFixed(parseInt(String(off['y'])) * RATIO_EMUs_Points),
    left: numberToFixed(parseInt(String(off['x'])) * RATIO_EMUs_Points),
  }
}

export function getSize(slideSpNode: XmlNode, slideLayoutSpNode: XmlNode, slideMasterSpNode: XmlNode): Size {
  let ext: AnyRecord | undefined

  if (slideSpNode) ext = (slideSpNode as AnyRecord)?.['a:ext']?.['attrs'] as AnyRecord
  else if (slideLayoutSpNode) ext = (slideLayoutSpNode as AnyRecord)?.['a:ext']?.['attrs'] as AnyRecord
  else if (slideMasterSpNode) ext = (slideMasterSpNode as AnyRecord)?.['a:ext']?.['attrs'] as AnyRecord

  if (!ext) return { width: 0, height: 0 }

  return {
    width: numberToFixed(parseInt(String(ext['cx'])) * RATIO_EMUs_Points),
    height: numberToFixed(parseInt(String(ext['cy'])) * RATIO_EMUs_Points),
  }
}
