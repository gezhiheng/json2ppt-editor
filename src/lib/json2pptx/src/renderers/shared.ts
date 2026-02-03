import tinycolor from "tinycolor2";
import type PptxGenJS from "pptxgenjs";

import type { SlideElement } from "../types/ppt";
import { toAST, type AST } from "../htmlParser";
import { DEFAULT_FONT_SIZE } from "./constants";

type TextSlice = {
  text: string;
  options?: PptxGenJS.TextPropsOptions;
};

const dashTypeMap: Record<string, "solid" | "dash" | "sysDot"> = {
  solid: "solid",
  dashed: "dash",
  dotted: "sysDot"
};

export function formatColor(input: string): { alpha: number; color: string } {
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

export function formatHTML(html: string, ratioPx2Pt: number): TextSlice[] {
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

function normalizeFontName(value?: string): string | undefined {
  return value ? value.replace(/^"+|"+$/g, "") : undefined;
}

function clampOpacity(value?: number): number {
  if (value === undefined) return 1;
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function getOpacityRatio(value?: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.endsWith("%")) {
    const percent = Number.parseFloat(normalized);
    return Number.isFinite(percent) ? Math.min(1, Math.max(0, percent / 100)) : undefined;
  }
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric)) return undefined;
  return numeric > 1 ? Math.min(1, Math.max(0, numeric / 100)) : Math.min(1, Math.max(0, numeric));
}

function parseFontSize(value?: string): number | undefined {
  if (!value) return undefined;
  const size = Number.parseFloat(value);
  return Number.isFinite(size) ? size : undefined;
}

function parseTableColor(
  value?: string
): { color: string; transparency: number } | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  const c = formatColor(normalized);
  return {
    color: c.color.replace("#", ""),
    transparency: (1 - c.alpha) * 100
  };
}

function isPlaceholderCell(cell?: {
  colspan?: number;
  rowspan?: number;
  text?: string;
  style?: Record<string, string | undefined>;
}): boolean {
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
}

export function buildTableRows(
  element: SlideElement,
  ratioPx2Pt: number,
  ratioPx2Inch: number
): PptxGenJS.TableRow[] {
  const data = (element as any).data as
    | Array<Array<{ id?: string; colspan?: number; rowspan?: number; text?: string; style?: any }>>
    | undefined;
  if (!data || !data.length) return [];

  const colCount =
    ((element as any).colWidths as number[] | undefined)?.length ??
    Math.max(...data.map((row) => row.length));

  const rows: PptxGenJS.TableRow[] = [];
  const skip = new Array(colCount).fill(0);

  data.forEach((row) => {
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
      const cellMargin = [
        6 / ratioPx2Inch,
        8 / ratioPx2Inch,
        6 / ratioPx2Inch,
        8 / ratioPx2Inch
      ] as [number, number, number, number];

      const options: PptxGenJS.TableCellProps = {
        colspan: colSpan > 1 ? colSpan : undefined,
        rowspan: rowSpan > 1 ? rowSpan : undefined,
        align: style.align as PptxGenJS.HAlign,
        valign: "middle",
        fontFace: normalizeFontName(style.fontname),
        fontSize: fontSize ? fontSize / ratioPx2Pt : undefined,
        color: color?.color,
        fill: fill ? { color: fill.color, transparency: fill.transparency } : undefined,
        margin: cellMargin
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
}

export function getShadowOption(
  shadow: NonNullable<SlideElement["shadow"]>,
  ratioPx2Pt: number
): PptxGenJS.ShadowProps {
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
    color: c.color,
    transparency: (1 - c.alpha) * 100,
    blur: (shadow.blur ?? 0) / ratioPx2Pt,
    offset,
    angle
  };
}

export function getOutlineOption(
  outline: NonNullable<SlideElement["outline"]>,
  ratioPx2Pt: number,
  opacity = 1
): PptxGenJS.ShapeLineProps {
  const c = formatColor(outline.color || "#000000");
  const alpha = c.alpha * clampOpacity(opacity);
  return {
    color: c.color,
    transparency: (1 - alpha) * 100,
    width: (outline.width || 1) / ratioPx2Pt,
    dashType: outline.style ? dashTypeMap[outline.style] : "solid"
  };
}

export function getElementOpacity(value?: number): number {
  return clampOpacity(value);
}

export function getFilterOpacity(value?: string): number | undefined {
  return getOpacityRatio(value);
}

export function getDashTypeMap(): Record<string, "solid" | "dash" | "sysDot"> {
  return dashTypeMap;
}
