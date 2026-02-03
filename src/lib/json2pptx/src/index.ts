import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";

import type { Deck } from "./types/ppt";
import { getElementRange, getLineElementPath } from "./element";
import { resolveImageData } from "./resolveImageData";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "./renderers/constants";
import { applySlideBackground } from "./renderers/background";
import { applyPptxLayout } from "./renderers/layout";
import {
  addImageElement,
  addLineElement,
  addShapeElement,
  addTableElement,
  addTextElement
} from "./renderers/elements";
import { type PatternShape } from "./renderers/types";
export const ENABLE_DECK_JSON = true;
export const PPTX_JSON_PAYLOAD_PATH = "json2ppt-editor.json";
export const PPTX_JSON_PAYLOAD_VERSION = 1;

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "presentation";
}

function stripFillTags(value: string): string {
  return value
    .replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/g, "")
    .replace(/<a:gradFill>[\s\S]*?<\/a:gradFill>/g, "")
    .replace(/<a:blipFill>[\s\S]*?<\/a:blipFill>/g, "")
    .replace(/<a:noFill\s*\/>/g, "")
    .replace(/<a:noFill><\/a:noFill>/g, "");
}

function applyPatternFill(slideXml: string, objectName: string, relId: string): string {
  const nameToken = `name="${objectName}"`;
  let cursor = 0;
  let result = slideXml;

  while (true) {
    const nameIndex = result.indexOf(nameToken, cursor);
    if (nameIndex === -1) break;

    const spStart = result.lastIndexOf("<p:sp", nameIndex);
    const spEnd = result.indexOf("</p:sp>", nameIndex);
    if (spStart === -1 || spEnd === -1) break;

    const spXml = result.slice(spStart, spEnd + "</p:sp>".length);
    const spPrStart = spXml.indexOf("<p:spPr>");
    const spPrEnd = spXml.indexOf("</p:spPr>");
    if (spPrStart === -1 || spPrEnd === -1) {
      cursor = spEnd + 1;
      continue;
    }

    const spPrOpenEnd = spXml.indexOf(">", spPrStart);
    const spPrInner = spXml.slice(spPrOpenEnd + 1, spPrEnd);
    const cleanedInner = stripFillTags(spPrInner);
    const blipFill = `<a:blipFill><a:blip r:embed="${relId}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill>`;
    let nextInner = cleanedInner;

    if (cleanedInner.includes("</a:custGeom>")) {
      nextInner = cleanedInner.replace("</a:custGeom>", `</a:custGeom>${blipFill}`);
    } else {
      const lnIndex = cleanedInner.indexOf("<a:ln");
      nextInner =
        lnIndex === -1
          ? `${cleanedInner}${blipFill}`
          : `${cleanedInner.slice(0, lnIndex)}${blipFill}${cleanedInner.slice(lnIndex)}`;
    }

    const updatedSpXml =
      spXml.slice(0, spPrOpenEnd + 1) +
      nextInner +
      spXml.slice(spPrEnd);

    result = result.slice(0, spStart) + updatedSpXml + result.slice(spEnd + "</p:sp>".length);
    cursor = spStart + updatedSpXml.length;
  }

  return result;
}

function parseDataUrlImage(
  dataUrl: string
): { mime: string; data: string; ext: string } | null {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const data = match[2];
  const extMap: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/bmp": "bmp"
  };
  return { mime, data, ext: extMap[mime] ?? "png" };
}

export async function buildPptxBlob(
  template: Deck
): Promise<{ blob: Blob; fileName: string }> {
  const pptx = new PptxGenJS();
  const patternShapes: PatternShape[] = [];

  const width = template.width ?? DEFAULT_WIDTH;
  const height = template.height ?? DEFAULT_HEIGHT;
  const ratioPx2Inch = 96 * (width / 960);
  const ratioPx2Pt = (96 / 72) * (width / 960);
  const textPadding = 10 / ratioPx2Pt;

  applyPptxLayout(pptx, width, height);

  for (const [slideIndex, slideJson] of (template.slides ?? []).entries()) {
    const slide = pptx.addSlide();
    applySlideBackground(slide, slideJson, template.theme);

    for (const [elementIndex, element] of (slideJson.elements ?? []).entries()) {
      addTextElement(slide, element, template, ratioPx2Pt, ratioPx2Inch, textPadding);
      await addImageElement(slide, element, ratioPx2Inch);
      addShapeElement(
        slide,
        element,
        ratioPx2Pt,
        ratioPx2Inch,
        slideIndex,
        elementIndex,
        patternShapes
      );
      addLineElement(slide, element, ratioPx2Pt, ratioPx2Inch);
      addTableElement(slide, element, ratioPx2Pt, ratioPx2Inch);
    }
  }

  const fileName = `${sanitizeFileName(template.title ?? "presentation")}.pptx`;
  const pptxBuffer = (await pptx.write({
    outputType: "arraybuffer",
    compression: true
  })) as ArrayBuffer;

  const needsZip = ENABLE_DECK_JSON || patternShapes.length > 0;
  if (!needsZip) {
    return { blob: new Blob([pptxBuffer]), fileName };
  }

  const zip = await JSZip.loadAsync(pptxBuffer);
  if (patternShapes.length) {
    const mediaFiles = Object.keys(zip.files).filter((name) => name.startsWith("ppt/media/"));
    let maxImageIndex = 0;
    for (const name of mediaFiles) {
      const match = name.match(/ppt\/media\/image(\d+)/);
      if (match) {
        const index = Number.parseInt(match[1], 10);
        if (Number.isFinite(index)) maxImageIndex = Math.max(maxImageIndex, index);
      }
    }

    const slideCache = new Map<number, string>();
    const relsCache = new Map<number, string>();

    for (const pattern of patternShapes) {
      const parsed = parseDataUrlImage(pattern.dataUrl);
      if (!parsed) continue;

      maxImageIndex += 1;
      const imageName = `image${maxImageIndex}.${parsed.ext}`;
      zip.file(`ppt/media/${imageName}`, parsed.data, { base64: true });

      const slideNumber = pattern.slideIndex + 1;
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;

      const relsXml =
        relsCache.get(slideNumber) ??
        (zip.file(relsPath)
          ? await zip.file(relsPath)!.async("string")
          : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);

      let maxRelId = 0;
      relsXml.replace(/Id="rId(\d+)"/g, (_, id) => {
        const value = Number.parseInt(id, 10);
        if (Number.isFinite(value)) maxRelId = Math.max(maxRelId, value);
        return "";
      });
      const relId = `rId${maxRelId + 1}`;
      const relEntry = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${imageName}"/>`;
      const nextRelsXml = relsXml.replace(
        "</Relationships>",
        `${relEntry}</Relationships>`
      );
      relsCache.set(slideNumber, nextRelsXml);

      const slideXml =
        slideCache.get(slideNumber) ??
        (zip.file(slidePath) ? await zip.file(slidePath)!.async("string") : "");
      const nextSlideXml = slideXml
        ? applyPatternFill(slideXml, pattern.objectName, relId)
        : slideXml;
      slideCache.set(slideNumber, nextSlideXml);
    }

    for (const [slideNumber, xml] of slideCache.entries()) {
      zip.file(`ppt/slides/slide${slideNumber}.xml`, xml);
    }
    for (const [slideNumber, xml] of relsCache.entries()) {
      zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`, xml);
    }
  }

  if (ENABLE_DECK_JSON) {
    zip.file(
      PPTX_JSON_PAYLOAD_PATH,
      JSON.stringify(
        {
          version: PPTX_JSON_PAYLOAD_VERSION,
          deck: template
        },
        null,
        2
      )
    );
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, fileName };
}

export { getElementRange, getLineElementPath };
export { resolveImageData };
export type {
  BaseElement,
  Deck,
  DeckTheme,
  ElementClip,
  ElementFilters,
  ElementOutline,
  ElementShadow,
  ImageElement,
  LineElement,
  ShapeElement,
  Slide,
  SlideBackground,
  SlideElement,
  TextContent,
  TextElement
} from "./types/ppt";
