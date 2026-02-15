import type { SlideElement } from './types'
import {
  buildCutRectDiagonalPath,
  buildEllipsePath,
  buildRectPath,
  buildRoundRectPath,
  getPathBounds,
  hasMultiLineText,
  mapColor,
  mapFill,
  mapFillColor,
  mapKeypoints,
  mapPathFormula,
  normalizeColor,
  normalizeTextContent,
  normalizeTextHeight,
  normalizeVAlign,
  roundTo,
  toPx,
  toPxPair
} from "./utils";

export function mapElement(raw: any): SlideElement | null {
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
}

export function normalizeElement(element: SlideElement): SlideElement {
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
}

export function flattenElements(
  elements: any[],
  offsetX = 0,
  offsetY = 0
): SlideElement[] {
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
}

function mapShadow(shadow: any): SlideElement["shadow"] | undefined {
  if (!shadow) return undefined;
  return {
    h: toPx(shadow.h),
    v: toPx(shadow.v),
    blur: toPx(shadow.blur),
    color: mapColor(shadow.color) ?? shadow.color
  };
}

function mapOutline(raw: any): SlideElement["outline"] | undefined {
  if (!raw) return undefined;
  if (!raw.borderColor && !raw.borderWidth && !raw.borderType) return undefined;
  return {
    width: roundTo(toPx(raw.borderWidth)) ?? undefined,
    color: normalizeColor(raw.borderColor),
    style: raw.borderType
  };
}

function mapBaseElement(raw: any): SlideElement {
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
}
