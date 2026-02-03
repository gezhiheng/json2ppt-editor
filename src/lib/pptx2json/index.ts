import JSZip from "jszip";
import {
  ENABLE_DECK_JSON,
  PPTX_JSON_PAYLOAD_PATH,
  PPTX_JSON_PAYLOAD_VERSION
} from "json2pptx";
import type { Deck } from "../../types/ppt";
import { parse } from "./parser/pptxtojson";
import { normalizeSlide } from "./slide-normalizer";
import { mapColor, toPx } from "./utils";

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
