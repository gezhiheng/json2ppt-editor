import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import tinycolor from "tinycolor2";

import type { Deck, SlideElement } from "./types/ppt";
import { resolveImageData } from "./resolveImageData";
import { toAST, type AST } from "./htmlParser";
import { toPoints, type SvgPoints } from "./svgPathParser";
import { getElementRange, getLineElementPath } from "./element";

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 562.5;
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FACE = "微软雅黑";
export const ENABLE_DECK_JSON = true;
export const PPTX_JSON_PAYLOAD_PATH = "json2ppt-editor.json";
export const PPTX_JSON_PAYLOAD_VERSION = 1;

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "presentation";
}

function formatColor(input: string) {
  if (!input) {
    return {
      alpha: 0,
      color: "#000000"
    };
  }

  const color = tinycolor(input);
  const alpha = color.getAlpha();
  const hex = alpha === 0 ? "#ffffff" : color.setAlpha(1).toHexString();
  return { alpha, color: hex };
}

type TextSlice = {
  text: string;
  options?: PptxGenJS.TextPropsOptions;
};

function formatHTML(html: string, ratioPx2Pt: number) {
  const ast = toAST(html);
  let bulletFlag = false;
  let indent = 0;

  const slices: TextSlice[] = [];
  const parse = (obj: AST[], baseStyleObj: Record<string, string> = {}) => {
    for (const item of obj) {
      const isBlockTag = "tagName" in item && ["div", "li", "p"].includes(item.tagName);

      if (isBlockTag && slices.length) {
        const lastSlice = slices[slices.length - 1];
        if (!lastSlice.options) lastSlice.options = {};
        lastSlice.options.breakLine = true;
      }

      const styleObj = { ...baseStyleObj };
      const styleAttr =
        "attributes" in item
          ? item.attributes.find((attr) => attr.key === "style")
          : null;
      if (styleAttr && styleAttr.value) {
        const styleArr = styleAttr.value.split(";");
        for (const styleItem of styleArr) {
          const match = styleItem.match(/([^:]+):\s*(.+)/);
          if (match) {
            const [key, value] = [match[1].trim(), match[2].trim()];
            if (key && value) styleObj[key] = value;
          }
        }
      }

      if ("tagName" in item) {
        if (item.tagName === "em") {
          styleObj["font-style"] = "italic";
        }
        if (item.tagName === "strong") {
          styleObj["font-weight"] = "bold";
        }
        if (item.tagName === "sup") {
          styleObj["vertical-align"] = "super";
        }
        if (item.tagName === "sub") {
          styleObj["vertical-align"] = "sub";
        }
        if (item.tagName === "a") {
          const attr = item.attributes.find((attr) => attr.key === "href");
          styleObj.href = attr?.value || "";
        }
        if (item.tagName === "ul") {
          styleObj["list-type"] = "ul";
        }
        if (item.tagName === "ol") {
          styleObj["list-type"] = "ol";
        }
        if (item.tagName === "li") {
          bulletFlag = true;
        }
        if (item.tagName === "p") {
          if ("attributes" in item) {
            const dataIndentAttr = item.attributes.find((attr) => attr.key === "data-indent");
            if (dataIndentAttr && dataIndentAttr.value) indent = +dataIndentAttr.value;
          }
        }
      }

      if ("tagName" in item && item.tagName === "br") {
        slices.push({ text: "", options: { breakLine: true } });
      } else if ("content" in item) {
        const text = item.content
          .replace(/&nbsp;/g, " ")
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&")
          .replace(/\n/g, "");
        const options: PptxGenJS.TextPropsOptions = {};

        if (styleObj["font-size"]) {
          options.fontSize = parseInt(styleObj["font-size"], 10) / ratioPx2Pt;
        }
        if (styleObj.color) {
          options.color = formatColor(styleObj.color).color;
        }
        if (styleObj["background-color"]) {
          options.highlight = formatColor(styleObj["background-color"]).color;
        }
        if (styleObj["text-decoration-line"]) {
          if (styleObj["text-decoration-line"].indexOf("underline") !== -1) {
            options.underline = {
              color: options.color || "#000000",
              style: "sng"
            };
          }
          if (styleObj["text-decoration-line"].indexOf("line-through") !== -1) {
            options.strike = "sngStrike";
          }
        }
        if (styleObj["text-decoration"]) {
          if (styleObj["text-decoration"].indexOf("underline") !== -1) {
            options.underline = {
              color: options.color || "#000000",
              style: "sng"
            };
          }
          if (styleObj["text-decoration"].indexOf("line-through") !== -1) {
            options.strike = "sngStrike";
          }
        }
        if (styleObj["vertical-align"]) {
          if (styleObj["vertical-align"] === "super") options.superscript = true;
          if (styleObj["vertical-align"] === "sub") options.subscript = true;
        }
        if (styleObj["text-align"]) options.align = styleObj["text-align"] as PptxGenJS.HAlign;
        if (styleObj["font-weight"]) options.bold = styleObj["font-weight"] === "bold";
        if (styleObj["font-style"]) options.italic = styleObj["font-style"] === "italic";
        if (styleObj["font-family"]) options.fontFace = styleObj["font-family"];
        if (styleObj.href) options.hyperlink = { url: styleObj.href };

        if (bulletFlag && styleObj["list-type"] === "ol") {
          options.bullet = {
            type: "number",
            indent: (options.fontSize || DEFAULT_FONT_SIZE) * 1.25
          };
          options.paraSpaceBefore = 0.1;
          bulletFlag = false;
        }
        if (bulletFlag && styleObj["list-type"] === "ul") {
          options.bullet = { indent: (options.fontSize || DEFAULT_FONT_SIZE) * 1.25 };
          options.paraSpaceBefore = 0.1;
          bulletFlag = false;
        }
        if (indent) {
          options.indentLevel = indent;
          indent = 0;
        }

        slices.push({ text, options });
      } else if ("children" in item) parse(item.children, styleObj);
    }
  };
  parse(ast);
  return slices;
}

type Points = Array<
  | { x: number; y: number; moveTo?: boolean }
  | { x: number; y: number; curve: { type: "arc"; hR: number; wR: number; stAng: number; swAng: number } }
  | { x: number; y: number; curve: { type: "quadratic"; x1: number; y1: number } }
  | { x: number; y: number; curve: { type: "cubic"; x1: number; y1: number; x2: number; y2: number } }
  | { close: true }
>;

const formatPoints = (points: SvgPoints, ratioPx2Inch: number, scale = { x: 1, y: 1 }): Points => {
  return points.map((point) => {
    if ("close" in point) {
      return { close: true };
    }
    if (point.type === "M") {
      return {
        x: (point.x as number) / ratioPx2Inch * scale.x,
        y: (point.y as number) / ratioPx2Inch * scale.y,
        moveTo: true
      };
    }
    if (point.curve) {
      if (point.curve.type === "cubic") {
        return {
          x: (point.x as number) / ratioPx2Inch * scale.x,
          y: (point.y as number) / ratioPx2Inch * scale.y,
          curve: {
            type: "cubic",
            x1: (point.curve.x1 as number) / ratioPx2Inch * scale.x,
            y1: (point.curve.y1 as number) / ratioPx2Inch * scale.y,
            x2: (point.curve.x2 as number) / ratioPx2Inch * scale.x,
            y2: (point.curve.y2 as number) / ratioPx2Inch * scale.y
          }
        };
      }
      if (point.curve.type === "quadratic") {
        return {
          x: (point.x as number) / ratioPx2Inch * scale.x,
          y: (point.y as number) / ratioPx2Inch * scale.y,
          curve: {
            type: "quadratic",
            x1: (point.curve.x1 as number) / ratioPx2Inch * scale.x,
            y1: (point.curve.y1 as number) / ratioPx2Inch * scale.y
          }
        };
      }
    }
    return {
      x: (point.x as number) / ratioPx2Inch * scale.x,
      y: (point.y as number) / ratioPx2Inch * scale.y
    };
  });
};

const dashTypeMap: Record<string, "solid" | "dash" | "sysDot"> = {
  solid: "solid",
  dashed: "dash",
  dotted: "sysDot"
};

type PatternShape = {
  slideIndex: number;
  objectName: string;
  dataUrl: string;
};

const stripFillTags = (value: string) =>
  value
    .replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/g, "")
    .replace(/<a:gradFill>[\s\S]*?<\/a:gradFill>/g, "")
    .replace(/<a:blipFill>[\s\S]*?<\/a:blipFill>/g, "")
    .replace(/<a:noFill\s*\/>/g, "")
    .replace(/<a:noFill><\/a:noFill>/g, "");

const applyPatternFill = (slideXml: string, objectName: string, relId: string) => {
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
};

const parseDataUrlImage = (dataUrl: string) => {
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
};

const normalizeFontName = (value?: string) =>
  value ? value.replace(/^"+|"+$/g, "") : undefined;

const parseFontSize = (value?: string) => {
  if (!value) return undefined;
  const size = Number.parseFloat(value);
  return Number.isFinite(size) ? size : undefined;
};

const parseTableColor = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  const c = formatColor(normalized);
  return {
    color: c.color.replace("#", ""),
    transparency: (1 - c.alpha) * 100
  };
};

const isPlaceholderCell = (cell?: {
  colspan?: number;
  rowspan?: number;
  text?: string;
  style?: Record<string, string | undefined>;
}) => {
  if (!cell) return false;
  const colspan = cell.colspan ?? 1;
  const rowspan = cell.rowspan ?? 1;
  if (colspan !== 1 || rowspan !== 1) return false;
  const text = cell.text ?? "";
  const style = cell.style;
  const hasStyle =
    Boolean(style?.fontname) ||
    Boolean(style?.fontsize) ||
    Boolean(style?.color) ||
    Boolean(style?.backcolor);
  return text.trim() === "" && !hasStyle;
};

const buildTableRows = (
  element: SlideElement,
  ratioPx2Pt: number
): PptxGenJS.TableRow[] => {
  const data = (element as any).data as
    | Array<Array<{ id?: string; colspan?: number; rowspan?: number; text?: string; style?: any }>>
    | undefined;
  if (!data || !data.length) return [];

  const colCount =
    ((element as any).colWidths as number[] | undefined)?.length ??
    Math.max(...data.map((row) => row.length));

  const rows: PptxGenJS.TableRow[] = [];
  const skip = new Array(colCount).fill(0);

  data.forEach((row, rowIndex) => {
    const cells: PptxGenJS.TableCell[] = [];
    let colIndex = 0;
    let cellIndex = 0;

    while (colIndex < colCount) {
      if (skip[colIndex] > 0) {
        skip[colIndex] -= 1;
        if (isPlaceholderCell(row[cellIndex])) {
          cellIndex += 1;
        }
        colIndex += 1;
        continue;
      }

      const cell = row[cellIndex];
      if (!cell) break;
      cellIndex += 1;

      const colSpan = cell.colspan ?? 1;
      const rowSpan = cell.rowspan ?? 1;

      if (rowSpan > 1) {
        for (let i = 0; i < colSpan; i += 1) {
          skip[colIndex + i] = rowSpan - 1;
        }
      }

      if (colSpan > 1) {
        for (let i = 0; i < colSpan - 1; i += 1) {
          if (isPlaceholderCell(row[cellIndex])) {
            cellIndex += 1;
          }
        }
      }

      const style = cell.style ?? {};
      const fontSize = parseFontSize(style.fontsize);
      const fill = parseTableColor(style.backcolor);
      const color = parseTableColor(style.color);

      const options: PptxGenJS.TableCellProps = {
        colspan: colSpan > 1 ? colSpan : undefined,
        rowspan: rowSpan > 1 ? rowSpan : undefined,
        align: style.align as PptxGenJS.HAlign,
        valign: "middle",
        fontFace: normalizeFontName(style.fontname),
        fontSize: fontSize ? fontSize / ratioPx2Pt : undefined,
        color: color?.color,
        fill: fill ? { color: fill.color, transparency: fill.transparency } : undefined,
        margin: 0
      };

      cells.push({
        text: cell.text ?? "",
        options
      });

      colIndex += colSpan;
    }

    rows.push(cells);
  });

  return rows;
};

const getShadowOption = (
  shadow: NonNullable<SlideElement["shadow"]>,
  ratioPx2Pt: number
): PptxGenJS.ShadowProps => {
  const c = formatColor(shadow.color ?? "#000000");
  const { h = 0, v = 0 } = shadow;

  let offset = 4;
  let angle = 45;

  if (h === 0 && v === 0) {
    offset = 4;
    angle = 45;
  } else if (h === 0) {
    if (v > 0) {
      offset = v;
      angle = 90;
    } else {
      offset = -v;
      angle = 270;
    }
  } else if (v === 0) {
    if (h > 0) {
      offset = h;
      angle = 1;
    } else {
      offset = -h;
      angle = 180;
    }
  } else if (h > 0 && v > 0) {
    offset = Math.max(h, v);
    angle = 45;
  } else if (h > 0 && v < 0) {
    offset = Math.max(h, -v);
    angle = 315;
  } else if (h < 0 && v > 0) {
    offset = Math.max(-h, v);
    angle = 135;
  } else if (h < 0 && v < 0) {
    offset = Math.max(-h, -v);
    angle = 225;
  }

  return {
    type: "outer",
    color: c.color.replace("#", ""),
    opacity: c.alpha,
    blur: (shadow.blur ?? 0) / ratioPx2Pt,
    offset,
    angle
  };
};

const getOutlineOption = (
  outline: NonNullable<SlideElement["outline"]>,
  ratioPx2Pt: number
): PptxGenJS.ShapeLineProps => {
  const c = formatColor(outline.color || "#000000");
  return {
    color: c.color,
    transparency: (1 - c.alpha) * 100,
    width: (outline.width || 1) / ratioPx2Pt,
    dashType: outline.style ? dashTypeMap[outline.style] : "solid"
  };
};

const isBase64Image = (url: string) => {
  const regex = /^data:image\/[^;]+;base64,/;
  return regex.test(url);
};

export async function buildPptxBlob(
  template: Deck
): Promise<{ blob: Blob; fileName: string }> {
  const pptx = new PptxGenJS();
  const patternShapes: PatternShape[] = [];

  const width = template.width ?? DEFAULT_WIDTH;
  const height = template.height ?? DEFAULT_HEIGHT;
  const viewportRatio = height / width;
  const ratioPx2Inch = 96 * (width / 960);
  const ratioPx2Pt = (96 / 72) * (width / 960);

  if (Math.abs(viewportRatio - 0.625) < 0.001) pptx.layout = "LAYOUT_16x10";
  else if (Math.abs(viewportRatio - 0.75) < 0.001) pptx.layout = "LAYOUT_4x3";
  else if (Math.abs(viewportRatio - 0.70710678) < 0.0001) {
    pptx.defineLayout({ name: "A3", width: 10, height: 7.0710678 });
    pptx.layout = "A3";
  } else if (Math.abs(viewportRatio - 1.41421356) < 0.0001) {
    pptx.defineLayout({ name: "A3_V", width: 10, height: 14.1421356 });
    pptx.layout = "A3_V";
  } else pptx.layout = "LAYOUT_16x9";

  for (const [slideIndex, slideJson] of (template.slides ?? []).entries()) {
    const slide = pptx.addSlide();
    const backgroundColor = slideJson.background?.color;
    if (backgroundColor) {
      const c = formatColor(backgroundColor);
      slide.background = { color: c.color, transparency: (1 - c.alpha) * 100 };
    }

    for (const [elementIndex, element] of (slideJson.elements ?? []).entries()) {
      if (element.type === "text" && element.content) {
        const textProps = formatHTML(element.content, ratioPx2Pt);

        const options: PptxGenJS.TextPropsOptions = {
          x: (element.left ?? 0) / ratioPx2Inch,
          y: (element.top ?? 0) / ratioPx2Inch,
          w: (element.width ?? 0) / ratioPx2Inch,
          h: (element.height ?? 0) / ratioPx2Inch,
          fontSize: DEFAULT_FONT_SIZE / ratioPx2Pt,
          fontFace: element.defaultFontName || template.theme?.fontName || DEFAULT_FONT_FACE,
          color: "#000000",
          valign: "top",
          margin: 0,
          paraSpaceBefore: 5 / ratioPx2Pt,
          lineSpacingMultiple: 1.5 / 1.25,
          autoFit: true
        };
        if (element.rotate) options.rotate = element.rotate;
        if (element.wordSpace) options.charSpacing = element.wordSpace / ratioPx2Pt;
        if (element.lineHeight) options.lineSpacingMultiple = element.lineHeight / 1.25;
        if (element.fill) {
          const c = formatColor(element.fill);
          const opacity = element.opacity === undefined ? 1 : element.opacity;
          options.fill = {
            color: c.color,
            transparency: (1 - c.alpha * opacity) * 100
          };
        } else {
          options.fill = { color: "FFFFFF", transparency: 100 };
        }
        if (element.defaultColor) options.color = formatColor(element.defaultColor).color;
        if (element.shadow) options.shadow = getShadowOption(element.shadow, ratioPx2Pt);
        if (element.outline?.width) options.line = getOutlineOption(element.outline, ratioPx2Pt);
        if (element.opacity !== undefined) options.transparency = (1 - element.opacity) * 100;
        if (element.paragraphSpace !== undefined) {
          options.paraSpaceBefore = element.paragraphSpace / ratioPx2Pt;
        }
        if (element.vertical) options.vert = "eaVert";

        slide.addText(textProps, options);
        continue;
      }

      if (element.type === "image" && element.src) {
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
        if (element.filters?.opacity) {
          options.transparency = 100 - parseInt(element.filters.opacity, 10);
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
        continue;
      }

      if (element.type === "shape" && element.path && element.viewBox) {
        const scale = {
          x: (element.width ?? 0) / element.viewBox[0],
          y: (element.height ?? 0) / element.viewBox[1]
        };
        const points = formatPoints(toPoints(element.path), ratioPx2Inch, scale);
        const pattern = (element as any).pattern as string | undefined;
        const hasFill =
          typeof element.fill === "string" ? element.fill.trim().length > 0 : false;
        const opacity = element.opacity === undefined ? 1 : element.opacity;

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
        if (element.outline?.width) options.line = getOutlineOption(element.outline, ratioPx2Pt);
        if (element.rotate) options.rotate = element.rotate;

        slide.addShape("custGeom" as PptxGenJS.ShapeType, options);

        if (element.text?.content) {
          const textProps = formatHTML(element.text.content, ratioPx2Pt);
          const textOptions: PptxGenJS.TextPropsOptions = {
            x: (element.left ?? 0) / ratioPx2Inch,
            y: (element.top ?? 0) / ratioPx2Inch,
            w: (element.width ?? 0) / ratioPx2Inch,
            h: (element.height ?? 0) / ratioPx2Inch,
            fontSize: DEFAULT_FONT_SIZE / ratioPx2Pt,
            fontFace: element.text.defaultFontName || DEFAULT_FONT_FACE,
            color: "#000000",
            paraSpaceBefore: 5 / ratioPx2Pt,
            valign: element.text.align as PptxGenJS.VAlign,
            fill: { color: "FFFFFF", transparency: 100 }
          };
          textOptions.margin = 0;
          if (element.rotate) textOptions.rotate = element.rotate;
          if (element.text.defaultColor) {
            textOptions.color = formatColor(element.text.defaultColor).color;
          }

          slide.addText(textProps, textOptions);
        }
        continue;
      }

      if (element.type === "line" && element.start && element.end) {
        const path = getLineElementPath(element);
        const points = formatPoints(toPoints(path), ratioPx2Inch);
        const { minX, maxX, minY, maxY } = getElementRange(element);
        const c = formatColor(element.color || "#000000");

        const options: PptxGenJS.ShapeProps = {
          x: (element.left ?? 0) / ratioPx2Inch,
          y: (element.top ?? 0) / ratioPx2Inch,
          w: (maxX - minX) / ratioPx2Inch,
          h: (maxY - minY) / ratioPx2Inch,
          line: {
            color: c.color,
            transparency: (1 - c.alpha) * 100,
            width: (element.width ?? 1) / ratioPx2Pt,
            dashType: element.style ? dashTypeMap[element.style] : "solid",
            beginArrowType: element.points?.[0] ? "arrow" : "none",
            endArrowType: element.points?.[1] ? "arrow" : "none"
          },
          points
        };
        if (element.shadow) options.shadow = getShadowOption(element.shadow, ratioPx2Pt);

        slide.addShape("custGeom" as PptxGenJS.ShapeType, options);
      }

      if (element.type === "table") {
        const rows = buildTableRows(element, ratioPx2Pt);
        if (!rows.length) continue;

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
            : undefined;

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
