import PptxGenJS from "pptxgenjs";
import type { Deck } from "../types/ppt";

type ParsedText = {
  text: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
};

type ColorPayload = {
  color: string;
  transparency: number;
};

const PX_TO_IN = 0.01;

function toHexColor(color?: string): string {
  if (!color) return "000000";
  if (color.startsWith("#")) {
    const normalized = color.replace("#", "").trim();
    if (normalized.length >= 6) {
      return normalized.slice(0, 6);
    }
    return normalized.padEnd(6, "0");
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgbMatch) return "000000";
  const [r, g, b] = rgbMatch.slice(1, 4).map((value) => Number(value));
  return [r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function parseColor(color?: string, opacity?: number): ColorPayload {
  let transparency = opacity !== undefined ? Math.max(0, Math.min(100, 100 - opacity * 100)) : 0;
  if (!color) {
    return { color: "000000", transparency };
  }

  if (color.startsWith("#")) {
    const normalized = color.replace("#", "").trim();
    if (normalized.length === 8) {
      const alpha = Number.parseInt(normalized.slice(6, 8), 16) / 255;
      transparency = Math.max(transparency, 100 - alpha * 100);
      return { color: normalized.slice(0, 6), transparency };
    }
    return { color: toHexColor(color), transparency };
  }

  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/i);
  if (rgbaMatch) {
    const alpha = rgbaMatch[4] ? Number(rgbaMatch[4]) : 1;
    transparency = Math.max(transparency, 100 - alpha * 100);
  }

  return { color: toHexColor(color), transparency };
}

function parseTextContent(html: string): ParsedText {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const text = doc.body.textContent?.trim() ?? "";
  const fontSizeMatch = html.match(/font-size:\s*(\d+)px/i);
  const colorMatch = html.match(/color:\s*([^;\"]+)/i);
  const alignMatch = html.match(/text-align:\s*(left|center|right)/i);
  const bold = /<strong>/i.test(html);
  const italic = /<em>/i.test(html);
  return {
    text,
    fontSize: fontSizeMatch ? Number(fontSizeMatch[1]) : 16,
    color: colorMatch ? colorMatch[1] : "#333",
    align: alignMatch?.[1] ?? "left",
    bold,
    italic
  };
}

export async function buildPptx(deck: Deck): Promise<void> {
  const pptx = new PptxGenJS();
  const slideWidth = deck.width ?? 1000;
  const slideHeight = deck.height ?? 562.5;
  const layoutName = "JSON2PPT_LAYOUT";
  pptx.defineLayout({
    name: layoutName,
    width: slideWidth * PX_TO_IN,
    height: slideHeight * PX_TO_IN
  });
  pptx.layout = layoutName;
  pptx.author = "JSON2PPT Studio";

  deck.slides?.forEach((slideDef) => {
    const slide = pptx.addSlide();
    const background = slideDef.background?.color;
    if (background) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: slideWidth * PX_TO_IN,
        h: slideHeight * PX_TO_IN,
        fill: { color: toHexColor(background) },
        line: { color: toHexColor(background) }
      });
    }

    slideDef.elements?.forEach((element) => {
      const x = (element.left ?? 0) * PX_TO_IN;
      const y = (element.top ?? 0) * PX_TO_IN;
      const w = (element.width ?? 0) * PX_TO_IN;
      const h = (element.height ?? 0) * PX_TO_IN;
      const rotate = element.rotate ?? 0;

      if (element.type === "text" && element.content) {
        const parsed = parseTextContent(element.content);
        slide.addText(parsed.text || " ", {
          x,
          y,
          w,
          h,
          color: toHexColor(parsed.color),
          fontSize: parsed.fontSize,
          bold: parsed.bold,
          italic: parsed.italic,
          align: parsed.align
        });
        return;
      }

      if (element.type === "image" && element.src) {
        slide.addImage({
          path: element.src,
          x,
          y,
          w,
          h
        });
        return;
      }

      if (element.type === "line") {
        const lineWidth = (element.end?.[0] ?? element.width ?? 1) * PX_TO_IN;
        const lineHeight = (element.end?.[1] ?? 0) * PX_TO_IN;
        slide.addShape(pptx.ShapeType.line, {
          x,
          y,
          w: lineWidth,
          h: lineHeight,
          line: {
            color: toHexColor(element.color),
            width: element.width ?? 1
          },
          rotate
        });
        return;
      }

      if (element.type === "shape") {
        const fillColor = parseColor(element.fill, element.opacity);
        slide.addShape(pptx.ShapeType.rect, {
          x,
          y,
          w,
          h,
          fill: { color: fillColor.color, transparency: fillColor.transparency },
          line: element.outline?.color
            ? { color: toHexColor(element.outline.color), width: element.outline.width ?? 1 }
            : { color: "FFFFFF", transparency: 100 },
          rotate
        });
      }
    });
  });

  await pptx.writeFile({ fileName: `${deck.title ?? "json2ppt"}.pptx` });
}
