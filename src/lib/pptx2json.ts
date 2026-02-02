import JSZip from "jszip";
import { parse } from "pptxtojson";

import type { Deck, Slide, SlideElement } from "../types/ppt";
import {
  ENABLE_DECK_JSON,
  PPTX_JSON_PAYLOAD_PATH,
  PPTX_JSON_PAYLOAD_VERSION
} from "json2pptx";

const PT_TO_PX = 96 / 72;

const toPx = (value?: number | null) => {
  if (value === undefined || value === null) return undefined;
  return Math.round(value * PT_TO_PX * 100) / 100;
};

const toPxPair = (value?: [number, number] | null) => {
  if (!value) return undefined;
  return [toPx(value[0]) ?? 0, toPx(value[1]) ?? 0] as [number, number];
};

const mapColor = (value?: string | null) => {
  if (!value) return undefined;
  if (value.startsWith("#")) return value;
  return `#${value}`;
};

const mapFill = (fill: any): string | undefined => {
  if (!fill) return undefined;
  if (typeof fill === "string") return mapColor(fill) ?? undefined;
  if (typeof fill === "object" && fill.type === "color") {
    if (typeof fill.value === "string") return mapColor(fill.value) ?? undefined;
  }
  return undefined;
};

const mapShadow = (shadow: any): SlideElement["shadow"] | undefined => {
  if (!shadow) return undefined;
  return {
    h: toPx(shadow.h),
    v: toPx(shadow.v),
    blur: toPx(shadow.blur),
    color: mapColor(shadow.color) ?? shadow.color
  };
};

const mapOutline = (raw: any): SlideElement["outline"] | undefined => {
  if (!raw) return undefined;
  if (!raw.borderColor && !raw.borderWidth && !raw.borderType) return undefined;
  return {
    width: toPx(raw.borderWidth),
    color: mapColor(raw.borderColor),
    style: raw.borderType
  };
};

const mapBaseElement = (raw: any): SlideElement => {
  const outline = mapOutline(raw);
  const shadow = mapShadow(raw.shadow);
  const fill = mapFill(raw.fill);

  return {
    type: raw.type,
    id: raw.id,
    groupId: raw.groupId,
    left: toPx(raw.left),
    top: toPx(raw.top),
    width: toPx(raw.width),
    height: toPx(raw.height),
    rotate: raw.rotate,
    fill: fill ?? undefined,
    opacity: raw.opacity,
    outline: outline ?? undefined,
    shadow: shadow ?? undefined,
    flipH: raw.isFlipH,
    flipV: raw.isFlipV
  };
};

const mapElement = (raw: any): SlideElement | null => {
  if (!raw || !raw.type) return null;
  const base = mapBaseElement(raw);

  if (raw.type === "text") {
    return {
      ...base,
      content: raw.content,
      defaultColor: mapColor(raw.defaultColor) ?? mapColor(raw.color),
      defaultFontName: raw.fontName,
      wordSpace: raw.wordSpace,
      lineHeight: raw.lineHeight,
      paragraphSpace: raw.paragraphSpace,
      vertical: raw.isVertical
    };
  }

  if (raw.type === "image") {
    return {
      ...base,
      src: raw.src,
      imageType: raw.geom,
      filters: raw.filters,
      clip: raw.rect
        ? {
            shape: raw.geom === "ellipse" ? "ellipse" : undefined,
            range: [
              [raw.rect.l ?? 0, raw.rect.t ?? 0],
              [raw.rect.r ?? 0, raw.rect.b ?? 0]
            ]
          }
        : undefined
    };
  }

  if (raw.type === "shape") {
    return {
      ...base,
      path: raw.path,
      viewBox: raw.viewBox ?? [raw.width ?? 0, raw.height ?? 0],
      pathFormula: raw.shapType,
      keypoints: raw.keypoints ? JSON.stringify(raw.keypoints) : undefined,
      text: raw.content
        ? {
            content: raw.content,
            align: raw.vAlign,
            defaultColor: mapColor(raw.defaultColor) ?? mapColor(raw.color),
            defaultFontName: raw.fontName
          }
        : undefined
    };
  }

  if (raw.type === "line") {
    return {
      ...base,
      start: toPxPair(raw.start),
      end: toPxPair(raw.end),
      broken: toPxPair(raw.broken),
      broken2: toPxPair(raw.broken2),
      curve: toPxPair(raw.curve),
      cubic: raw.cubic
        ? (raw.cubic.map((point: [number, number]) => toPxPair(point)) as [
            [number, number],
            [number, number]
          ])
        : undefined,
      color: mapColor(raw.color),
      points: raw.points,
      style: raw.style
    };
  }

  return {
    ...base,
    content: raw.content,
    path: raw.path,
    viewBox: raw.viewBox,
    text: raw.text
  };
};

const flattenElements = (elements: any[], offsetX = 0, offsetY = 0): SlideElement[] => {
  const result: SlideElement[] = [];

  for (const element of elements) {
    if (element?.type === "group" && Array.isArray(element.elements)) {
      const groupLeft = toPx(element.left) ?? 0;
      const groupTop = toPx(element.top) ?? 0;
      result.push(...flattenElements(element.elements, offsetX + groupLeft, offsetY + groupTop));
      continue;
    }

    const mapped = mapElement(element);
    if (!mapped) continue;

    if (offsetX || offsetY) {
      if (mapped.left !== undefined) mapped.left = mapped.left + offsetX;
      if (mapped.top !== undefined) mapped.top = mapped.top + offsetY;
    }

    result.push(mapped);
  }

  return result;
};

const normalizeSlide = (slide: any): Slide => {
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

  return {
    background: backgroundFill ? { type: "solid", color: backgroundFill } : undefined,
    elements: flattenElements(orderedElements)
  };
};

type ParsedResult = {
  deck: Deck;
  warnings: string[];
};

export async function parsePptxToJson(file: File): Promise<ParsedResult> {
  const fileBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(fileBuffer);

  if (ENABLE_DECK_JSON) {
    const embedded =
      zip.file(PPTX_JSON_PAYLOAD_PATH) ??
      Object.values(zip.files).find((entry) =>
        entry.name.endsWith(`/${PPTX_JSON_PAYLOAD_PATH}`)
      ) ??
      null;
    if (embedded) {
      const payloadText = await embedded.async("string");
      try {
        const parsed = JSON.parse(payloadText) as { version?: number; deck?: Deck } | Deck;
        if ("deck" in parsed && parsed.deck) {
          return {
            deck: parsed.deck,
            warnings:
              parsed.version && parsed.version !== PPTX_JSON_PAYLOAD_VERSION
                ? [
                    `Embedded JSON payload version ${parsed.version} differs from ${PPTX_JSON_PAYLOAD_VERSION}.`
                  ]
                : []
          };
        }
        return { deck: parsed as Deck, warnings: [] };
      } catch {
        return {
          deck: await buildDeckFromPptx(fileBuffer),
          warnings: [
            "Embedded JSON payload could not be parsed. Falling back to PPTX parsing."
          ]
        };
      }
    }
  }

  return {
    deck: await buildDeckFromPptx(fileBuffer),
    warnings: []
  };
}

async function buildDeckFromPptx(buffer: ArrayBuffer): Promise<Deck> {
  const pptxJson = await parse(buffer);
  const width = toPx(pptxJson?.size?.width) ?? undefined;
  const height = toPx(pptxJson?.size?.height) ?? undefined;
  const slides = Array.isArray(pptxJson?.slides)
    ? pptxJson.slides.map((slide: any) => normalizeSlide(slide))
    : [];

  return {
    width,
    height,
    slides
  };
}
