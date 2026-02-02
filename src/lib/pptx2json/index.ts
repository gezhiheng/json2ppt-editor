import JSZip from "jszip";
import { parse } from "./parser/pptxtojson";

import type { Deck, Slide, SlideElement } from "../../types/ppt";
import {
  ENABLE_DECK_JSON,
  PPTX_JSON_PAYLOAD_PATH,
  PPTX_JSON_PAYLOAD_VERSION
} from "json2pptx";

const PT_TO_PX = 96 / 72;
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

const toPx = (value?: number | null) => {
  if (value === undefined || value === null) return undefined;
  return value * PT_TO_PX;
};

const toPxPair = (value?: [number, number] | null) => {
  if (!value) return undefined;
  return [toPx(value[0]) ?? 0, toPx(value[1]) ?? 0] as [number, number];
};

const mapColor = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.startsWith("#") ? value : `#${value}`;
  return normalized.toUpperCase();
};

const mapFillColor = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("#") ? value : `#${value}`;
};

const mapFill = (fill: any): { fill?: string; pattern?: string } => {
  if (!fill) return {};
  if (typeof fill === "string") return { fill: mapFillColor(fill) ?? undefined };
  if (typeof fill === "object") {
    if (fill.type === "color" && typeof fill.value === "string") {
      return { fill: mapFillColor(fill.value) ?? undefined };
    }
    if (fill.type === "image" && fill.value?.picBase64) {
      return { fill: "", pattern: fill.value.picBase64 };
    }
  }
  return {};
};

const convertFontSizeToPx = (content: string) =>
  content.replace(/font-size:\s*([0-9.]+)pt/gi, (_, size) => {
    const px = Math.floor(parseFloat(size) * PT_TO_PX);
    return `font-size: ${px}px`;
  });

const normalizeTextContent = (content: string) =>
  convertFontSizeToPx(content).replace(/&nbsp;/g, " ");

const normalizeVAlign = (value?: string) => {
  if (!value) return undefined;
  if (value === "mid") return "middle";
  if (value === "up") return "top";
  if (value === "down") return "bottom";
  return value;
};

const roundTo = (value?: number | null, digits = 2) => {
  if (value === undefined || value === null) return undefined;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const normalizeColor = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("#") ? value.toUpperCase() : `#${value}`.toUpperCase();
};

const extractFirstFontSizePx = (content?: string) => {
  if (!content) return undefined;
  const match = content.match(/font-size:\s*([0-9.]+)px/i);
  if (!match) return undefined;
  const size = Number.parseFloat(match[1]);
  return Number.isFinite(size) ? size : undefined;
};

const normalizeTextHeight = (height?: number, content?: string, lineHeight?: number) => {
  if (height === undefined) return height;
  const fontSize = extractFirstFontSizePx(content);
  if (!fontSize) return height;
  const lh = lineHeight ?? 1;
  const base = fontSize * lh;
  const padding = fontSize < 40 ? 21 : 20.5;
  const target = Math.round((base + padding) * 2) / 2;
  if (height > base * 2) return height;
  return target;
};

const hasMultiLineText = (content?: string) => {
  if (!content) return false;
  if (content.includes("<br")) return true;
  const paragraphs = content.match(/<p\b/gi);
  return (paragraphs?.length ?? 0) > 1;
};

const getPathBounds = (path?: string) => {
  if (!path) return undefined;
  const nums = path.match(/-?\d+\.?\d*/g);
  if (!nums || nums.length < 2) return undefined;
  const values = nums.map((v) => Number.parseFloat(v)).filter((v) => Number.isFinite(v));
  if (!values.length) return undefined;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < values.length; i += 2) {
    const x = values[i];
    const y = values[i + 1];
    if (Number.isFinite(x)) maxX = Math.max(maxX, x);
    if (Number.isFinite(y)) maxY = Math.max(maxY, y);
  }
  if (maxX === 0 && maxY === 0) return undefined;
  return [maxX, maxY] as [number, number];
};

const buildEllipsePath = () =>
  "M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z";

const buildRoundRectPath = (width: number, height: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, Math.min(width, height)));
  return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} ` +
    `L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} ` +
    `L ${r} ${height} Q 0 ${height} 0 ${height - r} ` +
    `L 0 ${r} Q 0 0 ${r} 0 Z`;
};

const buildRectPath = () => "M 0 0 L 200 0 L 200 200 L 0 200 Z";

const buildCutRectDiagonalPath = (width: number, height: number, adj: number) => {
  const cut = height * adj;
  return `M 0 ${height - cut} L 0 0 L ${width - cut} 0 L ${width} ${cut} L ${width} ${height} L ${cut} ${height} Z`;
};

const mapPathFormula = (shapeType?: string) => {
  switch (shapeType) {
    case "roundRect":
      return "roundRect";
    case "triangle":
      return "triangle";
    case "snip2DiagRect":
      return "cutRectDiagonal";
    default:
      return undefined;
  }
};

const parseKeypoints = (raw: any) => {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
};

const mapKeypoints = (pathFormula: string, raw: any): number[] | undefined => {
  const keypoints = parseKeypoints(raw);
  if (!keypoints) return undefined;
  if (pathFormula === "roundRect") {
    const adj = typeof keypoints.adj === "number" ? keypoints.adj : 0.5;
    return [Math.min(0.5, Math.max(0, adj))];
  }
  if (pathFormula === "triangle") return [typeof keypoints.adj === "number" ? keypoints.adj : 0];
  if (pathFormula === "cutRectDiagonal") {
    const adj2 = typeof keypoints.adj2 === "number" ? keypoints.adj2 : 0.62602;
    return [Number((adj2 / 2).toFixed(5))];
  }
  return undefined;
};

const hashSeed = (value: string) => {
  let hash = 1779033703 ^ value.length;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
};

const makeId = (seed: string) => {
  const next = hashSeed(seed);
  let state = next();
  let id = "";
  for (let i = 0; i < 10; i += 1) {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    const value = ((state ^ (state >>> 14)) >>> 0) / 4294967296;
    id += ID_ALPHABET[Math.floor(value * ID_ALPHABET.length)];
  }
  return id;
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
    width: roundTo(toPx(raw.borderWidth)) ?? undefined,
    color: normalizeColor(raw.borderColor),
    style: raw.borderType
  };
};

const mapBaseElement = (raw: any): SlideElement => {
  const outline = mapOutline(raw);
  const shadow = mapShadow(raw.shadow);
  const { fill } = mapFill(raw.fill);

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
    const content =
      raw.content !== undefined ? normalizeTextContent(raw.content) : raw.content;
    const fallbackLineHeight = hasMultiLineText(content) ? 1.5 : 1;
    const lineHeight = raw.lineHeight ?? fallbackLineHeight;
    const normalizedHeight = normalizeTextHeight(base.height, content, lineHeight);
    return {
      ...base,
      height: normalizedHeight,
      rotate: base.rotate ?? 0,
      flipH: undefined,
      flipV: undefined,
      content,
      defaultColor: normalizeColor(raw.defaultColor) ?? normalizeColor(raw.color) ?? "#333",
      defaultFontName: raw.fontName ?? "",
      wordSpace: raw.wordSpace,
      lineHeight,
      paragraphSpace: raw.paragraphSpace,
      vertical: raw.isVertical,
      fill: mapFill(raw.fill).fill ?? ""
    };
  }

  if (raw.type === "image") {
    const rect = raw.rect ?? {};
    const clipRange: [[number, number], [number, number]] = [
      [rect.l ?? 0, rect.t ?? 0],
      [rect.r ?? 100, rect.b ?? 100]
    ];
    if (rect.r !== undefined || rect.b !== undefined) {
      clipRange[1][0] = 100 - (rect.r ?? 0);
      clipRange[1][1] = 100 - (rect.b ?? 0);
    }
    return {
      ...base,
      rotate: base.rotate ?? 0,
      fixedRatio: true,
      src: raw.src,
      clip: {
        shape: raw.geom === "ellipse" ? "ellipse" : "rect",
        range: clipRange
      }
    };
  }

  if (raw.type === "shape") {
    const { fill, pattern } = mapFill(raw.fill);
    const pathFormula = mapPathFormula(raw.shapType);
    const keypoints = pathFormula ? mapKeypoints(pathFormula, raw.keypoints) : undefined;
    const hasText = raw.content !== undefined;
    let path = raw.path;
    let viewBox = raw.viewBox ?? [raw.width ?? 0, raw.height ?? 0];
    let special = false;
    if (raw.shapType === "rect") {
      path = buildRectPath();
      viewBox = [200, 200];
    }
    if (pathFormula && base.width && base.height) {
      if (pathFormula === "roundRect") {
        const radius = (keypoints?.[0] ?? 0.5) * Math.min(base.width, base.height);
        path = buildRoundRectPath(base.width, base.height, radius);
        viewBox = [base.width, base.height];
      } else if (pathFormula === "cutRectDiagonal") {
        const adj = keypoints?.[0] ?? 0.31301;
        path = buildCutRectDiagonalPath(base.width, base.height, adj);
        viewBox = [base.width, base.height];
      }
    } else if (raw.shapType === "ellipse") {
      path = buildEllipsePath();
      viewBox = [200, 200];
    } else if (raw.path) {
      const bounds = getPathBounds(raw.path);
      if (bounds) {
        const rectPath = buildRectPath();
        if (raw.path.trim() === rectPath) {
          viewBox = [200, 200];
        } else if (bounds[0] > viewBox[0] || bounds[1] > viewBox[1]) {
          const ratio = base.width ? bounds[0] / base.width : undefined;
          const nextHeight =
            ratio && base.height ? base.height * ratio : bounds[1];
          viewBox = [bounds[0], nextHeight];
          if (raw.shapType === "custom" && raw.path.length > 200) {
            special = true;
          }
        }
      }
    }
    return {
      ...base,
      rotate: base.rotate ?? 0,
      fixedRatio: false,
      path,
      viewBox,
      pathFormula: pathFormula ?? undefined,
      keypoints: keypoints ?? undefined,
      pattern,
      fill: fill ?? "",
      ...(special ? { special: true } : {}),
      text: hasText
        ? {
            content: normalizeTextContent(raw.content),
            align: normalizeVAlign(raw.vAlign) ?? "middle",
            defaultColor: normalizeColor(raw.defaultColor) ?? normalizeColor(raw.color) ?? "#333",
            defaultFontName: raw.fontName ?? "",
            lineHeight: raw.lineHeight ?? 1
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

const normalizeElement = (element: SlideElement): SlideElement => {
  if (
    element.type === "shape" &&
    element.outline &&
    ((element.height === 0 && element.width) || (element.width === 0 && element.height))
  ) {
    const isVertical = element.width === 0;
    return {
      type: "line",
      id: element.id,
      groupId: element.groupId,
      left: element.left,
      top: element.top,
      width: element.outline.width,
      start: [0, 0],
      end: isVertical ? [0, element.height ?? 0] : [element.width ?? 0, 0],
      style: element.outline.style,
      color: element.outline.color,
      points: ["", ""]
    };
  }

  if (element.type === "shape" && element.fill) {
    element.fill = mapFillColor(element.fill) ?? element.fill;
  }

  if (element.type === "text" && element.content) {
    element.content = normalizeTextContent(element.content);
  }

  if (element.type === "shape" && element.text?.content) {
    element.text.content = normalizeTextContent(element.text.content);
  }

  if (element.type === "image") {
    delete element.filters;
    delete element.imageType;
    delete element.outline;
  }

  return element;
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

const normalizeSlide = (slide: any, index: number): Slide => {
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
  const themeColors = Array.isArray(pptxJson?.themeColors)
    ? pptxJson.themeColors.map((color: string) => mapColor(color) ?? color)
    : undefined;
  const slides = Array.isArray(pptxJson?.slides)
    ? pptxJson.slides.map((slide: any, index: number) => normalizeSlide(slide, index))
    : [];

  return {
    title: pptxJson?.title ?? "未命名演示文稿",
    width,
    height,
    theme: {
      themeColors,
      fontColor: "#333",
      fontName: "",
      backgroundColor: "#fff",
      shadow: {
        h: 3,
        v: 3,
        blur: 2,
        color: "#808080"
      },
      outline: {
        width: 2,
        color: "#525252",
        style: "solid"
      }
    },
    slides
  };
}
