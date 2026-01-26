import PptxGenJS from "pptxgenjs";

import type { Deck, SlideElement } from "../types/ppt";
import { resolveImageData } from "./pptx-shared";

const PPTX_WIDTH = 13.33;
const PPTX_HEIGHT = 7.5;
const IMAGE_SIZE_CACHE = new Map<string, { width: number; height: number }>();

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "presentation";
}

function normalizeHex(hex: string): string {
  if (hex.length === 3) {
    return hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }
  return hex;
}

function parseColorToHex(value: string): string {
  if (value.startsWith("#")) return normalizeHex(value.replace("#", ""));
  const rgbMatch = value.replace(/\s+/g, "").match(/rgba?\((\d+),(\d+),(\d+)/i);
  if (!rgbMatch) return "000000";
  const [, r, g, b] = rgbMatch;
  const toHex = (num: string) => Number(num).toString(16).padStart(2, "0");
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHtmlText(content: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const text = doc.body.textContent?.trim() || "";
  const paragraph = doc.querySelector("p");
  const span = doc.querySelector("span");
  const strong = doc.querySelector("strong");
  const em = doc.querySelector("em");
  const fontSize = span?.style.fontSize;
  const color = span?.style.color;
  const align = paragraph?.style.textAlign || "left";
  const size = fontSize ? Number(fontSize.replace("px", "")) : undefined;
  return {
    text,
    fontSize: size,
    color,
    align,
    bold: Boolean(strong),
    italic: Boolean(em)
  };
}

function toPptxCoord(value: number, ratio: number): number {
  return value * ratio;
}

function getImageSize(data: string): Promise<{ width: number; height: number }> {
  const cached = IMAGE_SIZE_CACHE.get(data);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      IMAGE_SIZE_CACHE.set(data, size);
      resolve(size);
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = data;
  });
}

function fitImageInBox(
  boxWidth: number,
  boxHeight: number,
  imageWidth: number,
  imageHeight: number
) {
  if (boxWidth <= 0 || boxHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { width: boxWidth, height: boxHeight, offsetX: 0, offsetY: 0 };
  }
  const boxRatio = boxWidth / boxHeight;
  const imageRatio = imageWidth / imageHeight;
  let width = boxWidth;
  let height = boxHeight;
  if (imageRatio > boxRatio) {
    width = boxWidth;
    height = boxWidth / imageRatio;
  } else {
    height = boxHeight;
    width = boxHeight * imageRatio;
  }
  return {
    width,
    height,
    offsetX: (boxWidth - width) / 2,
    offsetY: (boxHeight - height) / 2
  };
}

function buildShapeSvg(shape: SlideElement & { path: string; viewBox?: number[] }) {
  const viewWidth = shape.viewBox?.[0] ?? shape.width ?? 0;
  const viewHeight = shape.viewBox?.[1] ?? shape.height ?? 0;
  const fill = shape.fill ? shape.fill : "none";
  const stroke = shape.outline?.color;
  const strokeWidth = shape.outline?.width;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${shape.width ?? viewWidth}" height="${
      shape.height ?? viewHeight
    }" viewBox="0 0 ${viewWidth} ${viewHeight}">`,
    `<path d="${shape.path}" fill="${fill}"`,
    stroke ? ` stroke="${stroke}"` : "",
    strokeWidth ? ` stroke-width="${strokeWidth}"` : "",
    " />",
    "</svg>"
  ].join("");
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function buildLineSvg(line: SlideElement & { start: [number, number]; end: [number, number] }) {
  const width = Math.max(Math.abs(line.end[0] - line.start[0]), 1);
  const height = Math.max(Math.abs(line.end[1] - line.start[1]), 1);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    `<line x1="${line.start[0]}" y1="${line.start[1]}" x2="${line.end[0]}" y2="${
      line.end[1]
    }" stroke="${line.color}" stroke-width="${line.width}" />`,
    "</svg>"
  ].join("");
  return { data: `data:image/svg+xml;base64,${btoa(svg)}`, width, height };
}

function addTextElement(
  slide: ReturnType<PptxGenJS["addSlide"]>,
  element: SlideElement & { content: string },
  scaleX: number,
  scaleY: number,
  defaultFont: string,
  defaultColor: string
) {
  const parsed = parseHtmlText(element.content);
  const width = element.width ?? 0;
  const height = element.height ?? 0;
  slide.addText(parsed.text, {
    x: toPptxCoord(element.left ?? 0, scaleX),
    y: toPptxCoord(element.top ?? 0, scaleY),
    w: toPptxCoord(width, scaleX),
    h: toPptxCoord(height, scaleY),
    fontFace: defaultFont,
    fontSize: parsed.fontSize,
    color: parseColorToHex(parsed.color || defaultColor),
    align: parsed.align as PptxGenJS.TEXT_HALIGN,
    bold: parsed.bold,
    italic: parsed.italic,
    rotate: element.rotate || 0
  });
}

function addShapeElement(
  slide: ReturnType<PptxGenJS["addSlide"]>,
  element: SlideElement & { path: string; viewBox?: number[] },
  scaleX: number,
  scaleY: number
) {
  const width = element.width ?? element.viewBox?.[0] ?? 0;
  const height = element.height ?? element.viewBox?.[1] ?? 0;
  slide.addImage({
    data: buildShapeSvg(element),
    x: toPptxCoord(element.left ?? 0, scaleX),
    y: toPptxCoord(element.top ?? 0, scaleY),
    w: toPptxCoord(width, scaleX),
    h: toPptxCoord(height, scaleY),
    rotate: element.rotate || 0
  });
}

function addLineElement(
  slide: ReturnType<PptxGenJS["addSlide"]>,
  element: SlideElement & { start: [number, number]; end: [number, number] },
  scaleX: number,
  scaleY: number
) {
  const lineSvg = buildLineSvg(element);
  slide.addImage({
    data: lineSvg.data,
    x: toPptxCoord(element.left ?? 0, scaleX),
    y: toPptxCoord(element.top ?? 0, scaleY),
    w: toPptxCoord(lineSvg.width, scaleX),
    h: toPptxCoord(lineSvg.height, scaleY),
    rotate: element.rotate || 0
  });
}

async function addImageElement(
  slide: ReturnType<PptxGenJS["addSlide"]>,
  element: SlideElement & { src: string },
  scaleX: number,
  scaleY: number
) {
  const data = await resolveImageData(element.src);
  const width = element.width ?? 0;
  const height = element.height ?? 0;
  let finalWidth = width;
  let finalHeight = height;
  let offsetX = 0;
  let offsetY = 0;
  if (element.imageType === "asset-logo" && width > 0 && height > 0) {
    try {
      const size = await getImageSize(data);
      const fitted = fitImageInBox(width, height, size.width, size.height);
      finalWidth = fitted.width;
      finalHeight = fitted.height;
      offsetX = fitted.offsetX;
      offsetY = fitted.offsetY;
    } catch (error) {
      console.warn("Failed to read logo size", error);
    }
  }
  slide.addImage({
    data,
    x: toPptxCoord((element.left ?? 0) + offsetX, scaleX),
    y: toPptxCoord((element.top ?? 0) + offsetY, scaleY),
    w: toPptxCoord(finalWidth, scaleX),
    h: toPptxCoord(finalHeight, scaleY),
    rotate: element.rotate || 0
  });
}

async function addElement(
  slide: ReturnType<PptxGenJS["addSlide"]>,
  element: SlideElement,
  scaleX: number,
  scaleY: number,
  defaultFont: string,
  defaultColor: string
) {
  if (element.type === "text" && element.content) {
    addTextElement(slide, element, scaleX, scaleY, defaultFont, defaultColor);
    return;
  }
  if (element.type === "shape" && element.path) {
    addShapeElement(slide, element, scaleX, scaleY);
    return;
  }
  if (element.type === "line" && element.start && element.end) {
    addLineElement(slide, element, scaleX, scaleY);
    return;
  }
  if (element.type === "image" && element.src) {
    await addImageElement(slide, element, scaleX, scaleY);
  }
}

export async function buildPptx(template: Deck): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Shangtie Smart PPT";
  pptx.title = template.title;
  pptx.theme = {
    headFontFace: template.theme?.fontName || "Microsoft YaHei",
    bodyFontFace: template.theme?.fontName || "Microsoft YaHei"
  };

  const scaleX = PPTX_WIDTH / (template.width ?? 1);
  const scaleY = PPTX_HEIGHT / (template.height ?? 1);
  const defaultFont = template.theme?.fontName || "Microsoft YaHei";
  const defaultColor = template.theme?.fontColor || "#333333";

  for (const slideJson of template.slides ?? []) {
    const slide = pptx.addSlide();
    const backgroundColor = slideJson.background?.color;
    if (backgroundColor) {
      slide.background = { color: parseColorToHex(backgroundColor) };
    }
    for (const element of slideJson.elements ?? []) {
      await addElement(slide, element, scaleX, scaleY, defaultFont, defaultColor);
    }
  }

  const fileName = `${sanitizeFileName(template.title ?? "presentation")}.pptx`;
  await pptx.writeFile({ fileName });
}
