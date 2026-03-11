import type PptxGenJS from "pptxgenjs";

import type { Presentation } from "../types/ppt";
import { getFillFallbackColor } from "./fill-patch";
import { formatColor } from "./shared";

export function applySlideBackground(
  slide: PptxGenJS.Slide,
  slideJson: NonNullable<Presentation["slides"]>[number],
  theme: Presentation["theme"]
): void {
  const backgroundColor = slideJson.background
    ? getFillFallbackColor(slideJson.background, theme?.backgroundColor ?? "#FFFFFF")
    : theme?.backgroundColor;
  if (!backgroundColor) return;
  const c = formatColor(backgroundColor);
  slide.background = { color: c.color, transparency: (1 - c.alpha) * 100 };
}
