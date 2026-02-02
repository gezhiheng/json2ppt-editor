import { getSolidFill } from './fill'
import { RATIO_EMUs_Points } from './constants'
import type { AnyRecord, XmlNode } from './types'

type ShadowResult = {
  h: number
  v: number
  blur: number | ''
  color: string | undefined
}

export function getShadow(node: XmlNode, warpObj: AnyRecord): ShadowResult {
  const chdwClrNode = getSolidFill(node, undefined, undefined, warpObj) as string | undefined
  const outerShdwAttrs = (node as AnyRecord)['attrs'] as AnyRecord
  const dir = outerShdwAttrs['dir'] ? (parseInt(String(outerShdwAttrs['dir'])) / 60000) : 0
  const dist = outerShdwAttrs['dist'] ? parseInt(String(outerShdwAttrs['dist'])) * RATIO_EMUs_Points : 0
  const blurRad = outerShdwAttrs['blurRad'] ? parseInt(String(outerShdwAttrs['blurRad'])) * RATIO_EMUs_Points : ''
  const vx = dist * Math.sin(dir * Math.PI / 180)
  const hx = dist * Math.cos(dir * Math.PI / 180)

  return {
    h: hx,
    v: vx,
    blur: blurRad,
    color: chdwClrNode,
  }
}
