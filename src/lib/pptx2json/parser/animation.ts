import { getTextByPathList } from './utils'
import type { AnyRecord, XmlNode } from './types'

export function findTransitionNode(content: XmlNode, rootElement: string): XmlNode | null {
  if (!content || !rootElement) return null

  const path1 = [rootElement, 'p:transition']
  let transitionNode = getTextByPathList(content, path1)
  if (transitionNode) return transitionNode

  const path2 = [rootElement, 'mc:AlternateContent', 'mc:Choice', 'p:transition']
  transitionNode = getTextByPathList(content, path2)
  if (transitionNode) return transitionNode

  const path3 = [rootElement, 'mc:AlternateContent', 'mc:Fallback', 'p:transition']
  transitionNode = getTextByPathList(content, path3)
  
  return transitionNode
}

type TransitionResult = {
  type: string
  duration: number
  direction: string | null
  autoNextAfter?: number
}

export function parseTransition(transitionNode: XmlNode): TransitionResult | null {
  if (!transitionNode) return null

  const transition: TransitionResult = {
    type: 'none',
    duration: 1000,
    direction: null,
  }

  const attrs = ((transitionNode as AnyRecord).attrs || {}) as AnyRecord

  let durationFound = false
  const durRegex = /^p\d{2}:dur$/ 
  for (const key in attrs) {
    if (durRegex.test(key) && !isNaN(parseInt(attrs[key], 10))) {
      transition.duration = parseInt(attrs[key], 10)
      durationFound = true
      break
    }
  }

  if (!durationFound && attrs.spd) {
    switch (attrs.spd) {
      case 'slow':
        transition.duration = 1000
        break
      case 'med':
        transition.duration = 800
        break
      case 'fast':
        transition.duration = 500
        break
      default:
        transition.duration = 1000
        break
    }
  }

  if (attrs.advClick === '0' && attrs.advTm) {
    transition.autoNextAfter = parseInt(attrs.advTm, 10)
  }

  const effectRegex = /^(p|p\d{2}):/ 
  for (const key in transitionNode as AnyRecord) {
    if (key !== 'attrs' && effectRegex.test(key)) {
      const effectNode = (transitionNode as AnyRecord)[key] as AnyRecord
      transition.type = key.substring(key.indexOf(':') + 1)

      if (effectNode && effectNode.attrs) {
        const effectAttrs = effectNode.attrs as AnyRecord
        
        if (effectAttrs.dur && !isNaN(parseInt(effectAttrs.dur, 10))) {
          if (!durationFound) transition.duration = parseInt(effectAttrs.dur, 10)
        }
        if (effectAttrs.dir) transition.direction = effectAttrs.dir
      }
      break
    }
  }

  return transition
}
