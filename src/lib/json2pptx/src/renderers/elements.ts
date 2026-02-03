import type PptxGenJS from "pptxgenjs";

import type { Deck, SlideElement } from "../types/ppt";
import { resolveImageData } from "../resolveImageData";
import { toPoints } from "../svgPathParser";
import { getElementRange, getLineElementPath } from "../element";
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from "./constants";
import { formatPoints } from "./points";
import { getLineArrowType, isBase64Image } from "./utils";
import { type PatternShape } from "./types";
import {
  buildTableRows,
  formatColor,
  formatHTML,
  getDashTypeMap,
  getElementOpacity,
  getFilterOpacity,
  getOutlineOption,
  getShadowOption
} from "./shared";

export function addTextElement(
  slide: PptxGenJS.Slide,
  element: SlideElement,
  template: Deck,
  ratioPx2Pt: number,
  ratioPx2Inch: number,
  textPadding: number
): void {
  if (element.type !== "text" || !element.content) return;
  const textProps = formatHTML(element.content, ratioPx2Pt);
  const opacity = getElementOpacity(element.opacity);

  const options: PptxGenJS.TextPropsOptions = {
    x: (element.left ?? 0) / ratioPx2Inch,
    y: (element.top ?? 0) / ratioPx2Inch,
    w: (element.width ?? 0) / ratioPx2Inch,
    h: (element.height ?? 0) / ratioPx2Inch,
    fontSize: DEFAULT_FONT_SIZE / ratioPx2Pt,
    fontFace: element.defaultFontName || template.theme?.fontName || DEFAULT_FONT_FACE,
    color: "#000000",
    valign: "top",
    margin: textPadding,
    paraSpaceBefore: 0,
    lineSpacingMultiple: 1.5,
    fit: "none"
  };
  if (element.rotate) options.rotate = element.rotate;
  if (element.wordSpace) options.charSpacing = element.wordSpace / ratioPx2Pt;
  if (element.lineHeight) options.lineSpacingMultiple = element.lineHeight;
  if (element.fill) {
    const c = formatColor(element.fill);
    options.fill = {
      color: c.color,
      transparency: (1 - c.alpha * opacity) * 100
    };
  } else {
    options.fill = { color: "FFFFFF", transparency: 100 };
  }
  if (element.defaultColor) options.color = formatColor(element.defaultColor).color;
  if (element.shadow) options.shadow = getShadowOption(element.shadow, ratioPx2Pt);
  if (element.outline?.width) {
    options.line = getOutlineOption(element.outline, ratioPx2Pt, opacity);
  }
  if (element.opacity !== undefined) options.transparency = (1 - opacity) * 100;
  if (element.paragraphSpace !== undefined) {
    options.paraSpaceBefore = element.paragraphSpace / ratioPx2Pt;
  }
  if (element.vertical) options.vert = "eaVert";
  if (element.flipH) options.flipH = element.flipH;
  if (element.flipV) options.flipV = element.flipV;

  slide.addText(textProps, options);
}

export async function addImageElement(
  slide: PptxGenJS.Slide,
  element: SlideElement,
  ratioPx2Inch: number
): Promise<void> {
  if (element.type !== "image" || !element.src) return;

  const options: PptxGenJS.ImageProps = {
    x: (element.left ?? 0) / ratioPx2Inch,
    y: (element.top ?? 0) / ratioPx2Inch,
    w: (element.width ?? 0) / ratioPx2Inch,
    h: (element.height ?? 0) / ratioPx2Inch
  };

  if (isBase64Image(element.src)) options.data = element.src;
  else options.data = await resolveImageData(element.src);

  if (element.flipH) options.flipH = element.flipH;
  if (element.flipV) options.flipV = element.flipV;
  if (element.rotate) options.rotate = element.rotate;
  const filterOpacity = getFilterOpacity(element.filters?.opacity) ?? 1;
  const elementOpacity = getElementOpacity(element.opacity);
  const imageOpacity = filterOpacity * elementOpacity;
  if (imageOpacity !== 1) {
    options.transparency = (1 - imageOpacity) * 100;
  }
  if (element.clip?.range) {
    if (element.clip.shape === "ellipse") options.rounding = true;

    const [start, end] = element.clip.range;
    const [startX, startY] = start;
    const [endX, endY] = end;

    const originW = (element.width ?? 0) / ((endX - startX) / ratioPx2Inch);
    const originH = (element.height ?? 0) / ((endY - startY) / ratioPx2Inch);

    options.w = originW / ratioPx2Inch;
    options.h = originH / ratioPx2Inch;

    options.sizing = {
      type: "crop",
      x: (startX / ratioPx2Inch) * (originW / ratioPx2Inch),
      y: (startY / ratioPx2Inch) * (originH / ratioPx2Inch),
      w: ((endX - startX) / ratioPx2Inch) * (originW / ratioPx2Inch),
      h: ((endY - startY) / ratioPx2Inch) * (originH / ratioPx2Inch)
    };
  }

  slide.addImage(options);
}

export function addShapeElement(
  slide: PptxGenJS.Slide,
  element: SlideElement,
  ratioPx2Pt: number,
  ratioPx2Inch: number,
  slideIndex: number,
  elementIndex: number,
  patternShapes: PatternShape[]
): void {
  if (element.type !== "shape" || !element.path || !element.viewBox) return;
  const scale = {
    x: (element.width ?? 0) / element.viewBox[0],
    y: (element.height ?? 0) / element.viewBox[1]
  };
  const rawPoints = toPoints(element.path);
  if (!rawPoints.length) return;
  const points = formatPoints(rawPoints, ratioPx2Inch, scale);
  const pattern = (element as any).pattern as string | undefined;
  const hasFill = typeof element.fill === "string" ? element.fill.trim().length > 0 : false;
  const opacity = getElementOpacity(element.opacity);

  const options: PptxGenJS.ShapeProps = {
    x: (element.left ?? 0) / ratioPx2Inch,
    y: (element.top ?? 0) / ratioPx2Inch,
    w: (element.width ?? 0) / ratioPx2Inch,
    h: (element.height ?? 0) / ratioPx2Inch,
    points
  };

  if (pattern) {
    const objectName = `pattern-${slideIndex}-${element.id ?? elementIndex}`;
    options.objectName = objectName;
    options.fill = { color: "FFFFFF", transparency: 100 };
    patternShapes.push({ slideIndex, objectName, dataUrl: pattern });
  } else if (hasFill) {
    const fillColor = formatColor(element.fill || "#000000");
    options.fill = {
      color: fillColor.color,
      transparency: (1 - fillColor.alpha * opacity) * 100
    };
  } else {
    options.fill = { color: "FFFFFF", transparency: 100 };
  }

  if (element.flipH) options.flipH = element.flipH;
  if (element.flipV) options.flipV = element.flipV;
  if (element.shadow) options.shadow = getShadowOption(element.shadow, ratioPx2Pt);
  if (element.outline?.width) {
    options.line = getOutlineOption(element.outline, ratioPx2Pt, opacity);
  }
  if (element.rotate) options.rotate = element.rotate;

  slide.addShape("custGeom" as PptxGenJS.ShapeType, options);

  if (!element.text?.content) return;
  const textProps = formatHTML(element.text.content, ratioPx2Pt);
  const textOptions: PptxGenJS.TextPropsOptions = {
    x: (element.left ?? 0) / ratioPx2Inch,
    y: (element.top ?? 0) / ratioPx2Inch,
    w: (element.width ?? 0) / ratioPx2Inch,
    h: (element.height ?? 0) / ratioPx2Inch,
    fontSize: DEFAULT_FONT_SIZE / ratioPx2Pt,
    fontFace: element.text.defaultFontName || DEFAULT_FONT_FACE,
    color: "#000000",
    paraSpaceBefore: 0,
    valign: element.text.align as PptxGenJS.VAlign,
    fill: { color: "FFFFFF", transparency: 100 },
    fit: "none"
  };
  textOptions.margin = 0;
  if (element.rotate) textOptions.rotate = element.rotate;
  if (element.text.defaultColor) {
    textOptions.color = formatColor(element.text.defaultColor).color;
  }
  if (element.opacity !== undefined) {
    textOptions.transparency = (1 - opacity) * 100;
  }
  if (element.flipH) textOptions.flipH = element.flipH;
  if (element.flipV) textOptions.flipV = element.flipV;

  slide.addText(textProps, textOptions);
}

export function addLineElement(
  slide: PptxGenJS.Slide,
  element: SlideElement,
  ratioPx2Pt: number,
  ratioPx2Inch: number
): void {
  if (element.type !== "line" || !element.start || !element.end) return;
  const path = getLineElementPath(element);
  const rawPoints = toPoints(path);
  if (!rawPoints.length) return;
  const points = formatPoints(rawPoints, ratioPx2Inch);
  const { minX, maxX, minY, maxY } = getElementRange(element);
  const c = formatColor(element.color || "#000000");
  const opacity = getElementOpacity(element.opacity);
  const pointsMeta = element.points ?? [];
  const dashTypeMap = getDashTypeMap();

  const options: PptxGenJS.ShapeProps = {
    x: (element.left ?? 0) / ratioPx2Inch,
    y: (element.top ?? 0) / ratioPx2Inch,
    w: (maxX - minX) / ratioPx2Inch,
    h: (maxY - minY) / ratioPx2Inch,
    line: {
      color: c.color,
      transparency: (1 - c.alpha * opacity) * 100,
      width: (element.width ?? 1) / ratioPx2Pt,
      dashType: element.style ? dashTypeMap[element.style] : "solid",
      beginArrowType: getLineArrowType(pointsMeta[0]),
      endArrowType: getLineArrowType(pointsMeta[1])
    },
    points
  };
  if (element.flipH) options.flipH = element.flipH;
  if (element.flipV) options.flipV = element.flipV;
  if (element.shadow) options.shadow = getShadowOption(element.shadow, ratioPx2Pt);

  slide.addShape("custGeom" as PptxGenJS.ShapeType, options);
}

export function addTableElement(
  slide: PptxGenJS.Slide,
  element: SlideElement,
  ratioPx2Pt: number,
  ratioPx2Inch: number
): void {
  if (element.type !== "table") return;
  const rows = buildTableRows(element, ratioPx2Pt, ratioPx2Inch);
  if (!rows.length) return;

  const colWidths = (element as any).colWidths as number[] | undefined;
  const colW = colWidths
    ? colWidths.map((ratio) => ((element.width ?? 0) * ratio) / ratioPx2Inch)
    : undefined;

  const rowCount = rows.length || 1;
  const baseRowHeight = ((element.height ?? 0) / rowCount) / ratioPx2Inch;
  const minRowHeight = (element as any).cellMinHeight
    ? (element as any).cellMinHeight / ratioPx2Inch
    : undefined;
  const rowH = minRowHeight
    ? new Array(rowCount).fill(Math.max(minRowHeight, baseRowHeight))
    : undefined;

  const outline = element.outline;
  const border =
    outline?.width || outline?.color
      ? {
          pt: (outline.width ?? 1) / ratioPx2Pt,
          color: formatColor(outline.color || "#000000").color.replace("#", "")
        }
      : {
          pt: 1 / ratioPx2Pt,
          color: "DDDDDD"
        };

  slide.addTable(rows, {
    x: (element.left ?? 0) / ratioPx2Inch,
    y: (element.top ?? 0) / ratioPx2Inch,
    w: (element.width ?? 0) / ratioPx2Inch,
    h: (element.height ?? 0) / ratioPx2Inch,
    colW,
    rowH,
    border,
    margin: 0
  });
}
