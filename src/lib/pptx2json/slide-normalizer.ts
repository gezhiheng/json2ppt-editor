import type { Slide } from './types'
import { flattenElements, normalizeElement } from './element-mapper'
import { mapFill, parseExportedObjectName } from './utils'

const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

export function normalizeSlide(slide: any, index: number): Slide {
  const backgroundFill = mapFill(slide?.fill);
  const rawElements = [
    ...(Array.isArray(slide?.layoutElements) ? slide.layoutElements : []),
    ...(Array.isArray(slide?.elements) ? slide.elements : [])
  ];

  const orderedElements = rawElements.slice().sort((a, b) => {
    const orderA = typeof a?.order === "number" ? a.order : 0;
    const orderB = typeof b?.order === "number" ? b.order : 0;
    return orderA - orderB;
  });

  const restoredElements = restoreExportedRoundTripElements(orderedElements);

  const elements = flattenElements(restoredElements).map((element, elementIndex) => {
    if (!element.id) {
      element.id = makeId(`slide-${index}-element-${elementIndex}-${element.type}`);
    }
    return normalizeElement(element);
  });

  return {
    id: slide?.id ?? slide?.slideId ?? makeId(`slide-${index}`),
    background: backgroundFill,
    elements,
    remark: slide?.remark ?? ""
  };
}

function makeId(seed: string): string {
  const next = hashSeed(seed);
  let state = next();
  let id = "";
  for (let index = 0; index < 10; index += 1) {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    const value = ((state ^ (state >>> 14)) >>> 0) / 4294967296;
    id += ID_ALPHABET[Math.floor(value * ID_ALPHABET.length)];
  }
  return id;
}

function restoreExportedRoundTripElements(elements: any[]): any[] {
  const restored = elements.map((element) => {
    if (element?.type === 'group' && Array.isArray(element.elements)) {
      return {
        ...element,
        elements: restoreExportedRoundTripElements(element.elements)
      }
    }
    return element
  })

  const shapesByRefId = new Map<string, any>()
  for (const element of restored) {
    const meta = parseExportedObjectName(element?.name)
    if (meta?.kind === 'shape') {
      shapesByRefId.set(meta.refId, element)
    }
  }

  return restored.filter((element) => {
    const meta = parseExportedObjectName(element?.name)
    if (meta?.kind !== 'shape-text') {
      return true
    }

    const targetShape = shapesByRefId.get(meta.refId)
    if (!targetShape || targetShape.type !== 'shape') {
      return true
    }

    mergeShapeText(targetShape, element)
    return false
  })
}

function mergeShapeText(targetShape: any, textShape: any) {
  if (!targetShape.content && textShape?.content) {
    targetShape.content = textShape.content
  }
  if (textShape?.vAlign) {
    targetShape.vAlign = textShape.vAlign
  }
}

function hashSeed(value: string): () => number {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}
