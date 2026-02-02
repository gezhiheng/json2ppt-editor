import * as txml from 'txml'
import type { AnyRecord, XmlNode } from './types'

let cust_attr_order = 0

type TxmlChild = {
  tagName?: string
  children?: Array<unknown>
  attributes?: AnyRecord
}

export function simplifyLostLess(children: Array<unknown>, parentAttributes: AnyRecord = {}): XmlNode {
  const out: AnyRecord = {}
  if (!children.length) return out

  if (children.length === 1 && typeof children[0] === 'string') {
    return Object.keys(parentAttributes).length ? {
      attrs: { order: cust_attr_order++, ...parentAttributes },
      value: children[0],
    } : children[0]
  }
  for (const child of children) {
    if (typeof child !== 'object' || child === null) return
    const typed = child as TxmlChild
    if (typed.tagName === '?xml') continue

    if (!typed.tagName) continue
    if (!out[typed.tagName]) out[typed.tagName] = []

    const kids = simplifyLostLess(typed.children || [], typed.attributes || {})
    
    if (typeof kids === 'object' && kids !== null) {
      const kidsObj = kids as AnyRecord
      if (!kidsObj.attrs) kidsObj.attrs = { order: cust_attr_order++ }
      else (kidsObj.attrs as AnyRecord).order = cust_attr_order++
    }
    if (Object.keys(typed.attributes || {}).length) {
      const kidsObj = kids as AnyRecord
      kidsObj.attrs = { ...(kidsObj.attrs as AnyRecord), ...(typed.attributes || {}) }
    }
    out[typed.tagName].push(kids)
  }
  for (const child in out) {
    if (out[child].length === 1) out[child] = out[child][0]
  }

  return out
}

export async function readXmlFile(zip: AnyRecord, filename: string): Promise<XmlNode | null> {
  try {
    const data = await (zip.file(filename) as AnyRecord).async('string')
    return simplifyLostLess(txml.parse(data) as Array<unknown>)
  }
  catch {
    return null
  }
}
