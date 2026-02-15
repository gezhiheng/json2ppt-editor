import type { Slide } from './types'
import { flattenElements, normalizeElement } from './element-mapper'
import { mapFill } from './utils'

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

  const elements = flattenElements(orderedElements).map((element, elementIndex) => {
    if (!element.id) {
      element.id = makeId(`slide-${index}-element-${elementIndex}-${element.type}`);
    }
    return normalizeElement(element);
  });

  return {
    id: slide?.id ?? slide?.slideId ?? makeId(`slide-${index}`),
    background: backgroundFill.fill
      ? { type: "solid", color: backgroundFill.fill }
      : backgroundFill.pattern
        ? { type: "image", src: backgroundFill.pattern }
        : undefined,
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
