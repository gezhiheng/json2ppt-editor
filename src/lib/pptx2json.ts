import JSZip from "jszip";

import type { Deck, Slide, SlideElement } from "../types/ppt";
import { PPTX_JSON_PAYLOAD_PATH, PPTX_JSON_PAYLOAD_VERSION } from "./json2pptx";

const EMU_PER_INCH = 914400;
const PX_PER_INCH = 96;
const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 562.5;

type ParsedResult = {
  deck: Deck;
  warnings: string[];
};

function emuToPx(value: number): number {
  return Math.round(((value / EMU_PER_INCH) * PX_PER_INCH) * 100) / 100;
}

function safeNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function firstByTagNS(node: ParentNode, tagName: string): Element | null {
  const list = node.getElementsByTagNameNS("*", tagName);
  return list.length ? (list[0] as Element) : null;
}

function listByTagNS(node: ParentNode, tagName: string): Element[] {
  return Array.from(node.getElementsByTagNameNS("*", tagName)) as Element[];
}

function getAttrNumber(node: Element | null, name: string): number | null {
  if (!node) return null;
  return safeNumber(node.getAttribute(name));
}

function formatHtmlText(text: string, options: { fontSize?: number; color?: string; align?: string }) {
  const safeText = escapeHtml(text.trim());
  const size = options.fontSize ? `font-size:${options.fontSize}px;` : "";
  const color = options.color ? `color:${options.color};` : "";
  const align = options.align ? `text-align:${options.align};` : "text-align:left;";
  return `<p style="${align}"><span style="${size}${color}">${safeText}</span></p>`;
}

function extractSlideBackground(slideDoc: Document): string | undefined {
  const bg = firstByTagNS(slideDoc, "bg");
  const bgPr = bg ? firstByTagNS(bg, "bgPr") : null;
  const solidFill = bgPr ? firstByTagNS(bgPr, "solidFill") : null;
  const srgb = solidFill ? firstByTagNS(solidFill, "srgbClr") : null;
  const val = srgb?.getAttribute("val");
  return val ? `#${val}` : undefined;
}

function extractSlideSize(presentationDoc: Document): { width: number; height: number } {
  const sldSz = firstByTagNS(presentationDoc, "sldSz");
  const cx = getAttrNumber(sldSz, "cx");
  const cy = getAttrNumber(sldSz, "cy");
  if (!cx || !cy) {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  }
  return {
    width: emuToPx(cx),
    height: emuToPx(cy)
  };
}

function extractTitle(coreDoc: Document): string | undefined {
  const titleNode = firstByTagNS(coreDoc, "title");
  const title = titleNode?.textContent?.trim();
  return title || undefined;
}

function extractTextElements(slideDoc: Document): SlideElement[] {
  const elements: SlideElement[] = [];
  const shapes = listByTagNS(slideDoc, "sp");

  shapes.forEach((shape) => {
    const txBody = firstByTagNS(shape, "txBody");
    const paragraphs = txBody ? listByTagNS(txBody, "p") : [];
    const textRuns = txBody ? listByTagNS(txBody, "t") : [];
    const text = textRuns.map((node) => node.textContent ?? "").join("");
    if (!text.trim()) return;

    const xfrm = firstByTagNS(firstByTagNS(shape, "spPr") ?? shape, "xfrm");
    const off = xfrm ? firstByTagNS(xfrm, "off") : null;
    const ext = xfrm ? firstByTagNS(xfrm, "ext") : null;
    const left = emuToPx(getAttrNumber(off, "x") ?? 0);
    const top = emuToPx(getAttrNumber(off, "y") ?? 0);
    const width = emuToPx(getAttrNumber(ext, "cx") ?? 0);
    const height = emuToPx(getAttrNumber(ext, "cy") ?? 0);
    const rotateRaw = getAttrNumber(xfrm, "rot");
    const rotate = rotateRaw ? rotateRaw / 60000 : 0;

    const firstRun = listByTagNS(shape, "rPr")[0];
    const fontSizeRaw = firstRun?.getAttribute("sz");
    const fontSizePt = fontSizeRaw ? Number(fontSizeRaw) / 100 : undefined;
    const fontSizePx =
      fontSizePt !== undefined ? Math.round((fontSizePt * PX_PER_INCH) / 72) : undefined;

    const colorNode = firstRun ? firstByTagNS(firstRun, "srgbClr") : null;
    const colorVal = colorNode?.getAttribute("val");
    const color = colorVal ? `#${colorVal}` : undefined;

    const align = paragraphs.length
      ? paragraphs
          .map((p) => firstByTagNS(p, "pPr")?.getAttribute("algn"))
          .find((value) => Boolean(value))
      : null;
    const mappedAlign = align ? align.toLowerCase() : "left";

    elements.push({
      type: "text",
      left,
      top,
      width,
      height,
      rotate,
      content: formatHtmlText(text, {
        fontSize: fontSizePx,
        color,
        align: mappedAlign
      })
    });
  });

  return elements;
}

function getMimeType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function extractImageElements(
  zip: JSZip,
  slideDoc: Document,
  slideRels: Record<string, string>
): Promise<SlideElement[]> {
  const pics = listByTagNS(slideDoc, "pic");
  const elements: SlideElement[] = [];

  for (const pic of pics) {
    const blip = firstByTagNS(pic, "blip");
    const embed = blip?.getAttribute("r:embed") ?? blip?.getAttribute("embed");
    const target = embed ? slideRels[embed] : null;
    if (!target) continue;
    const normalizedTarget = target.startsWith("..")
      ? target.replace("../", "")
      : target;
    const filePath = normalizedTarget.startsWith("ppt/")
      ? normalizedTarget
      : `ppt/${normalizedTarget}`;
    const file = zip.file(filePath);
    if (!file) continue;
    const base64 = await file.async("base64");
    const mime = getMimeType(filePath);
    const dataUrl = `data:${mime};base64,${base64}`;

    const xfrm = firstByTagNS(firstByTagNS(pic, "spPr") ?? pic, "xfrm");
    const off = xfrm ? firstByTagNS(xfrm, "off") : null;
    const ext = xfrm ? firstByTagNS(xfrm, "ext") : null;
    const left = emuToPx(getAttrNumber(off, "x") ?? 0);
    const top = emuToPx(getAttrNumber(off, "y") ?? 0);
    const width = emuToPx(getAttrNumber(ext, "cx") ?? 0);
    const height = emuToPx(getAttrNumber(ext, "cy") ?? 0);
    const rotateRaw = getAttrNumber(xfrm, "rot");
    const rotate = rotateRaw ? rotateRaw / 60000 : 0;

    elements.push({
      type: "image",
      left,
      top,
      width,
      height,
      rotate,
      src: dataUrl
    });
  }

  return elements;
}

async function buildFallbackDeck(zip: JSZip): Promise<ParsedResult> {
  const warnings: string[] = [];
  const presentationFile = zip.file("ppt/presentation.xml");
  const presentationDoc = presentationFile
    ? parseXml(await presentationFile.async("string"))
    : null;

  const { width, height } = presentationDoc
    ? extractSlideSize(presentationDoc)
    : { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

  const coreFile = zip.file("docProps/core.xml");
  const coreDoc = coreFile ? parseXml(await coreFile.async("string")) : null;
  const title = coreDoc ? extractTitle(coreDoc) : undefined;

  const slideFiles = Object.keys(zip.files)
    .filter((path) => path.startsWith("ppt/slides/slide") && path.endsWith(".xml"))
    .sort((a, b) => {
      const getIndex = (value: string) =>
        Number(value.match(/slide(\\d+)\\.xml$/)?.[1] ?? 0);
      return getIndex(a) - getIndex(b);
    });

  const slides: Slide[] = [];

  for (const slidePath of slideFiles) {
    const slideFile = zip.file(slidePath);
    if (!slideFile) continue;
    const slideDoc = parseXml(await slideFile.async("string"));
    const backgroundColor = extractSlideBackground(slideDoc);

    const relPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
    const relFile = zip.file(relPath);
    const rels: Record<string, string> = {};
    if (relFile) {
      const relDoc = parseXml(await relFile.async("string"));
      listByTagNS(relDoc, "Relationship").forEach((rel) => {
        const id = rel.getAttribute("Id");
        const target = rel.getAttribute("Target");
        if (id && target) rels[id] = target;
      });
    }

    const textElements = extractTextElements(slideDoc);
    const imageElements = await extractImageElements(zip, slideDoc, rels);

    slides.push({
      background: backgroundColor ? { type: "solid", color: backgroundColor } : undefined,
      elements: [...textElements, ...imageElements]
    });
  }

  return {
    deck: {
      title,
      width,
      height,
      slides
    },
    warnings
  };
}

export async function parsePptxToJson(file: File): Promise<ParsedResult> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const embedded = zip.file(PPTX_JSON_PAYLOAD_PATH);

  if (embedded) {
    const payloadText = await embedded.async("string");
    try {
      const parsed = JSON.parse(payloadText) as { version?: number; deck?: Deck } | Deck;
      if ("deck" in parsed && parsed.deck) {
        return {
          deck: parsed.deck,
          warnings:
            parsed.version && parsed.version !== PPTX_JSON_PAYLOAD_VERSION
              ? [`Embedded JSON payload version ${parsed.version} differs from ${PPTX_JSON_PAYLOAD_VERSION}.`]
              : []
        };
      }
      return { deck: parsed as Deck, warnings: [] };
    } catch {
      const fallback = await buildFallbackDeck(zip);
      return {
        deck: fallback.deck,
        warnings: [
          "Embedded JSON payload could not be parsed. Falling back to PPTX parsing.",
          ...fallback.warnings
        ]
      };
    }
  }

  return buildFallbackDeck(zip);
}
