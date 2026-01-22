import type { Slide } from "../types/ppt";

type SlidePreviewProps = {
  slide: Slide;
  baseWidth: number;
  baseHeight: number;
  previewWidth: number;
  index: number;
  slideLabel: string;
  layoutLabel: string;
};

export function SlidePreview({
  slide,
  baseWidth,
  baseHeight,
  previewWidth,
  index,
  slideLabel,
  layoutLabel
}: SlidePreviewProps): JSX.Element {
  const elements = slide.elements ?? [];
  const backgroundColor = slide.background?.color ?? "#ffffff";
  const scale = previewWidth / baseWidth;
  const previewHeight = baseHeight * scale;

  return (
    <div className="space-y-3 animate-rise" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-center justify-between">
        <div className="font-display text-sm uppercase tracking-[0.2em] text-ink-500">
          {slideLabel} {index + 1}
        </div>
        <div className="text-xs text-ink-500">{slide.type ?? layoutLabel}</div>
      </div>
      <div style={{ width: previewWidth, height: previewHeight }}>
        <div
          className="slide-canvas"
          style={{
            width: baseWidth,
            height: baseHeight,
            background: backgroundColor,
            transform: `scale(${scale})`,
            transformOrigin: "top left"
          }}
        >
          {elements.map((element) => {
            const left = element.left ?? 0;
            const top = element.top ?? 0;
            const width = element.width ?? 0;
            const height = element.height ?? 0;
            const rotate = element.rotate ?? 0;
            const transform = rotate ? `rotate(${rotate}deg)` : undefined;

            if (element.type === "text") {
              return (
                <div
                  key={element.id}
                  className="slide-element absolute text-ink-900"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    transform,
                    fontFamily: "Spline Sans, system-ui, sans-serif",
                    color: element.defaultColor ?? undefined
                  }}
                  dangerouslySetInnerHTML={{ __html: element.content ?? "" }}
                />
              );
            }

            if (element.type === "image") {
              return (
                <img
                  key={element.id}
                  className="slide-element absolute object-cover"
                  src={element.src}
                  alt="Slide asset"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    transform
                  }}
                />
              );
            }

            if (element.type === "line") {
              const lineWidth = element.end?.[0] ?? element.width ?? 0;
              const lineHeight = element.width ?? 1;
              return (
                <div
                  key={element.id}
                  className="slide-element absolute"
                  style={{
                    left,
                    top,
                    width: lineWidth,
                    height: lineHeight,
                    backgroundColor: element.color ?? "#000",
                    transform
                  }}
                />
              );
            }

            if (element.type === "shape") {
              const isCircle = element.path?.includes("A 50 50") ?? false;
              return (
                <div
                  key={element.id}
                  className="slide-element absolute"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    background: element.fill ?? "transparent",
                    borderRadius: isCircle ? "9999px" : 0,
                    border: element.outline?.color
                      ? `${element.outline?.width ?? 1}px solid ${element.outline.color}`
                      : undefined,
                    opacity: element.opacity,
                    boxShadow: element.shadow?.color
                      ? `${element.shadow?.h ?? 0}px ${element.shadow?.v ?? 0}px ${
                          element.shadow?.blur ?? 0
                        }px ${element.shadow.color}`
                      : undefined,
                    transform
                  }}
                />
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
