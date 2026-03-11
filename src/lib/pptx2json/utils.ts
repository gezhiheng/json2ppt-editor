import type { ElementFill, FillGradient } from './types'

const PT_TO_PX = 96 / 72;
const EXPORTED_OBJECT_NAME_RE = /^(shape-text|shape|text)-(\d+)-(.+)$/

export type ExportedObjectMeta = {
  kind: 'shape-text' | 'shape' | 'text'
  slideIndex: number
  refId: string
}

export function toPx(value?: number | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  return value * PT_TO_PX;
}

export function toPxPair(value?: [number, number] | null): [number, number] | undefined {
  if (!value) return undefined;
  return [toPx(value[0]) ?? 0, toPx(value[1]) ?? 0];
}

export function mapColor(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.startsWith("#") ? value : `#${value}`;
  return normalized.toUpperCase();
}

export function mapFillColor(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.startsWith("#") ? value : `#${value}`;
}

export function parseExportedObjectName(name?: string | null): ExportedObjectMeta | undefined {
  if (!name) return undefined

  const match = name.match(EXPORTED_OBJECT_NAME_RE)
  if (!match) return undefined

  const slideIndex = Number.parseInt(match[2], 10)
  if (!Number.isFinite(slideIndex)) return undefined

  return {
    kind: match[1] as ExportedObjectMeta['kind'],
    slideIndex,
    refId: match[3]
  }
}

function parseGradientPosition(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 100 ? value / 1000 : value
  }

  if (typeof value !== 'string') return 0
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return 0
  if (value.trim().endsWith('%')) return numeric
  return numeric > 100 ? numeric / 1000 : numeric
}

function mapGradient(value: any): FillGradient | undefined {
  if (!value || typeof value !== 'object') return undefined

  const colors = Array.isArray(value.colors)
    ? value.colors
        .filter((stop) => stop && typeof stop === 'object')
        .map((stop) => ({
          pos: parseGradientPosition(stop.pos),
          color: mapFillColor(stop.color) ?? '#FFFFFF'
        }))
    : []

  return {
    type:
      typeof value.type === 'string'
        ? value.type === 'line'
          ? 'linear'
          : value.type
        : typeof value.path === 'string'
        ? value.path === 'line'
          ? 'linear'
          : value.path
        : 'linear',
    rotate: typeof value.rotate === 'number' ? value.rotate : typeof value.rot === 'number' ? value.rot : 0,
    colors
  }
}

export function mapFill(fill: any): ElementFill | undefined {
  if (!fill) return undefined
  if (typeof fill === 'string') {
    const color = mapFillColor(fill)
    return color ? { type: 'solid', color } : undefined
  }

  if (typeof fill !== 'object') {
    return undefined
  }

  if (fill.type === 'color' && typeof fill.value === 'string') {
    const color = mapFillColor(fill.value)
    return color ? { type: 'solid', color } : undefined
  }

  if (fill.type === 'solid' || (fill.type === undefined && typeof fill.color === 'string')) {
    const color = mapFillColor(fill.color)
    return color ? { type: 'solid', color } : undefined
  }

  if (fill.type === 'gradient') {
    const gradient = mapGradient(fill.value ?? fill.gradient ?? fill)
    return gradient ? { type: 'gradient', gradient } : undefined
  }

  if ((fill.type === 'image' || fill.type === 'pattern') && fill.value?.picBase64) {
    return {
      type: 'image',
      src: fill.value.picBase64,
      ...(typeof fill.value.opacity === 'number' ? { opacity: fill.value.opacity } : {})
    }
  }

  if (fill.type === 'image' && typeof fill.src === 'string') {
    return {
      type: 'image',
      src: fill.src,
      ...(typeof fill.opacity === 'number' ? { opacity: fill.opacity } : {})
    }
  }

  if (fill.gradient || fill.colors) {
    const gradient = mapGradient(fill.gradient ?? fill)
    return gradient ? { type: 'gradient', gradient } : undefined
  }

  return undefined
}

function convertFontSizeToPx(content: string): string {
  return content.replace(/font-size:\s*([0-9.]+)pt/gi, (_, size) => {
    const px = Math.floor(Number.parseFloat(size) * PT_TO_PX);
    return `font-size: ${px}px`;
  });
}

export function normalizeTextContent(content: string): string {
  return convertFontSizeToPx(content).replace(/&nbsp;/g, " ");
}

export function normalizeVAlign(value?: string): string | undefined {
  if (!value) return undefined;
  if (value === "mid") return "middle";
  if (value === "up") return "top";
  if (value === "down") return "bottom";
  return value;
}

export function roundTo(value?: number | null, digits = 2): number | undefined {
  if (value === undefined || value === null) return undefined;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeColor(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.startsWith("#") ? value.toUpperCase() : `#${value}`.toUpperCase();
}

function extractFirstFontSizePx(content?: string): number | undefined {
  if (!content) return undefined;
  const match = content.match(/font-size:\s*([0-9.]+)px/i);
  if (!match) return undefined;
  const size = Number.parseFloat(match[1]);
  return Number.isFinite(size) ? size : undefined;
}

export function normalizeTextHeight(
  height?: number,
  content?: string,
  lineHeight?: number
): number | undefined {
  if (height === undefined) return height;
  const fontSize = extractFirstFontSizePx(content);
  if (!fontSize) return height;
  const lh = lineHeight ?? 1;
  const base = fontSize * lh;
  const padding = fontSize < 40 ? 21 : 20.5;
  const target = Math.round((base + padding) * 2) / 2;
  if (height > base * 2) return height;
  return target;
}

export function hasMultiLineText(content?: string): boolean {
  if (!content) return false;
  if (content.includes("<br")) return true;
  const paragraphs = content.match(/<p\b/gi);
  return (paragraphs?.length ?? 0) > 1;
}

export function getPathBounds(path?: string): [number, number] | undefined {
  if (!path) return undefined;
  const nums = path.match(/-?\d+\.?\d*/g);
  if (!nums || nums.length < 2) return undefined;
  const values = nums.map((value) => Number.parseFloat(value)).filter(Number.isFinite);
  if (!values.length) return undefined;
  let maxX = 0;
  let maxY = 0;
  for (let index = 0; index < values.length; index += 2) {
    const x = values[index];
    const y = values[index + 1];
    if (Number.isFinite(x)) maxX = Math.max(maxX, x);
    if (Number.isFinite(y)) maxY = Math.max(maxY, y);
  }
  if (maxX === 0 && maxY === 0) return undefined;
  return [maxX, maxY];
}

export function buildEllipsePath(): string {
  return "M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z";
}

export function buildRoundRectPath(width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, Math.min(width, height)));
  return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} ` +
    `L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} ` +
    `L ${r} ${height} Q 0 ${height} 0 ${height - r} ` +
    `L 0 ${r} Q 0 0 ${r} 0 Z`;
}

export function buildRectPath(): string {
  return "M 0 0 L 200 0 L 200 200 L 0 200 Z";
}

export function buildCutRectDiagonalPath(
  width: number,
  height: number,
  adj: number
): string {
  const cut = height * adj;
  return `M 0 ${height - cut} L 0 0 L ${width - cut} 0 L ${width} ${cut} L ${width} ${height} L ${cut} ${height} Z`;
}

export function mapPathFormula(
  shapeType?: string
): "roundRect" | "triangle" | "cutRectDiagonal" | undefined {
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
}

function parseKeypoints(raw: any): any | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
}

export function mapKeypoints(pathFormula: string, raw: any): number[] | undefined {
  const keypoints = parseKeypoints(raw);
  if (!keypoints) return undefined;
  if (pathFormula === "roundRect") {
    const adj = typeof keypoints.adj === "number" ? keypoints.adj : 0.5;
    return [Math.min(0.5, Math.max(0, adj))];
  }
  if (pathFormula === "triangle") {
    return [typeof keypoints.adj === "number" ? keypoints.adj : 0];
  }
  if (pathFormula === "cutRectDiagonal") {
    const adj2 = typeof keypoints.adj2 === "number" ? keypoints.adj2 : 0.62602;
    return [Number((adj2 / 2).toFixed(5))];
  }
  return undefined;
}
