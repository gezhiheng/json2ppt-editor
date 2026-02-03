import type PptxGenJS from "pptxgenjs";

export function applyPptxLayout(pptx: PptxGenJS, width: number, height: number): void {
  const viewportRatio = height / width;
  if (Math.abs(viewportRatio - 0.625) < 0.001) {
    pptx.layout = "LAYOUT_16x10";
    return;
  }
  if (Math.abs(viewportRatio - 0.75) < 0.001) {
    pptx.layout = "LAYOUT_4x3";
    return;
  }
  if (Math.abs(viewportRatio - 0.70710678) < 0.0001) {
    pptx.defineLayout({ name: "A3", width: 10, height: 7.0710678 });
    pptx.layout = "A3";
    return;
  }
  if (Math.abs(viewportRatio - 1.41421356) < 0.0001) {
    pptx.defineLayout({ name: "A3_V", width: 10, height: 14.1421356 });
    pptx.layout = "A3_V";
    return;
  }
  pptx.layout = "LAYOUT_16x9";
}
