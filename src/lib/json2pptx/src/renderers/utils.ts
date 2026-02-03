import type PptxGenJS from "pptxgenjs";

export function isBase64Image(url: string): boolean {
  const regex = /^data:image\/[^;]+;base64,/;
  return regex.test(url);
}

export function getLineArrowType(
  value?: unknown
): PptxGenJS.ShapeLineProps["beginArrowType"] {
  if (value === "arrow") return "arrow";
  if (value === "dot") return "oval";
  return "none";
}
