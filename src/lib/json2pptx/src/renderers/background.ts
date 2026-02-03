import type PptxGenJS from "pptxgenjs";

import type { Deck } from "../types/ppt";
import { formatColor } from "./shared";

export function applySlideBackground(
  slide: PptxGenJS.Slide,
  slideJson: Deck["slides"][number],
  theme: Deck["theme"]
): void {
  const backgroundColor = slideJson.background?.color ?? theme?.backgroundColor;
  if (!backgroundColor) return;
  const c = formatColor(backgroundColor);
  slide.background = { color: c.color, transparency: (1 - c.alpha) * 100 };
}
