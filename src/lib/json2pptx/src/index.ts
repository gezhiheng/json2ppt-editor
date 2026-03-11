import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { parseDocument } from "json2pptx-schema";

import type { Presentation } from "./types/ppt";
import { getElementRange, getLineElementPath } from "./element";
import { resolveImageData } from "./resolveImageData";
import { applySlideBackground } from "./renderers/background";
import {
  applyBackgroundFillPatch,
  applyShapeFillPatch,
  fillRequiresXmlPatch
} from "./renderers/fill-patch";
import { applyPptxLayout } from "./renderers/layout";
import {
  addImageElement,
  addLineElement,
  addShapeElement,
  addTableElement,
  addTextElement
} from "./renderers/elements";
import { type FillPatch } from "./renderers/types";

type PresentationDocument = ReturnType<typeof parseDocument>;

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "presentation";
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

export async function createPPTX(
  template: Presentation
): Promise<{ blob: Blob; fileName: string }> {
  const parsedTemplate: PresentationDocument = parseDocument(template);
  const renderTemplate = parsedTemplate as unknown as Presentation;

  const pptx = new PptxGenJS();
  const fillPatches: FillPatch[] = [];

  const width = parsedTemplate.width;
  const height = parsedTemplate.height;
  const ratioPx2Inch = 96 * (width / 960);
  const ratioPx2Pt = (96 / 72) * (width / 960);
  const textPadding = 10 / ratioPx2Pt;

  applyPptxLayout(pptx, width, height);

  for (const [slideIndex, slideJson] of (renderTemplate.slides ?? []).entries()) {
    const slide = pptx.addSlide();
    applySlideBackground(slide, slideJson, renderTemplate.theme);
    if (slideJson.background && fillRequiresXmlPatch(slideJson.background)) {
      fillPatches.push({
        kind: "background",
        slideIndex,
        fill: slideJson.background
      });
    }

    for (const [elementIndex, element] of (slideJson.elements ?? []).entries()) {
      addTextElement(
        slide,
        element,
        renderTemplate,
        slideIndex,
        elementIndex,
        ratioPx2Pt,
        ratioPx2Inch,
        textPadding,
        fillPatches
      );
      await addImageElement(slide, element, ratioPx2Inch);
      addShapeElement(
        slide,
        element,
        ratioPx2Pt,
        ratioPx2Inch,
        slideIndex,
        elementIndex,
        fillPatches
      );
      addLineElement(slide, element, ratioPx2Pt, ratioPx2Inch);
      addTableElement(slide, element, ratioPx2Pt, ratioPx2Inch);
    }
  }

  const fileName = `${sanitizeFileName(parsedTemplate.title || "presentation")}.pptx`;
  const pptxBuffer = (await pptx.write({
    outputType: "arraybuffer",
    compression: true
  })) as ArrayBuffer;

  if (!fillPatches.length) {
    return { blob: new Blob([pptxBuffer]), fileName };
  }

  const zip = await JSZip.loadAsync(pptxBuffer);
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

  for (const patch of fillPatches) {
    const slideNumber = patch.slideIndex + 1;
    const slidePath = `ppt/slides/slide${slideNumber}.xml`;
    const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
    let relId: string | undefined;

    if (patch.fill.type === "image" && patch.fill.src) {
      const dataUrl = await resolveImageData(patch.fill.src);
      const parsed = parseDataUrlImage(dataUrl);
      if (!parsed) continue;

      maxImageIndex += 1;
      const imageName = `image${maxImageIndex}.${parsed.ext}`;
      zip.file(`ppt/media/${imageName}`, parsed.data, { base64: true });

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
      relId = `rId${maxRelId + 1}`;
      const relEntry = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${imageName}"/>`;
      relsCache.set(slideNumber, relsXml.replace("</Relationships>", `${relEntry}</Relationships>`));
    }

    const slideXml =
      slideCache.get(slideNumber) ??
      (zip.file(slidePath) ? await zip.file(slidePath)!.async("string") : "");

    if (!slideXml) {
      continue;
    }

    const nextSlideXml =
      patch.kind === "background"
        ? applyBackgroundFillPatch(slideXml, patch.fill, relId)
        : applyShapeFillPatch(slideXml, patch.objectName, patch.fill, relId);

    slideCache.set(slideNumber, nextSlideXml);
  }

  for (const [slideNumber, xml] of slideCache.entries()) {
    zip.file(`ppt/slides/slide${slideNumber}.xml`, xml);
  }
  for (const [slideNumber, xml] of relsCache.entries()) {
    zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`, xml);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, fileName };
}

// Backwards compatibility alias
export const buildPptxBlob = createPPTX;

export { getElementRange, getLineElementPath };
export { resolveImageData };
export type {
  BaseElement,
  Deck,
  DeckTheme,
  Presentation,
  PresentationData,
  PresentationTheme,
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
