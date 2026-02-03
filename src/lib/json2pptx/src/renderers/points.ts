import type { SvgPoints } from "../svgPathParser";

type Points = Array<
  | { x: number; y: number; moveTo?: boolean }
  | { x: number; y: number; curve: { type: "arc"; hR: number; wR: number; stAng: number; swAng: number } }
  | { x: number; y: number; curve: { type: "quadratic"; x1: number; y1: number } }
  | { x: number; y: number; curve: { type: "cubic"; x1: number; y1: number; x2: number; y2: number } }
  | { close: true }
>;

export function formatPoints(
  points: SvgPoints,
  ratioPx2Inch: number,
  scale = { x: 1, y: 1 }
): Points {
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
}
