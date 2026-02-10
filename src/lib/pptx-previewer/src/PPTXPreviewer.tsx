import { renderElement } from './renderers';
import type { PPTXPreviewerProps } from './types';
import { getElementSize } from './utils/elementSize';
import { getFlipTransform, getShadowFilter } from './utils/elementStyle';

export function PPTXPreviewer({ slide, className }: PPTXPreviewerProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        fontSize: 16,
        lineHeight: 'normal'
      }}
    >
      {slide.background?.color ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: slide.background.color
          }}
        />
      ) : null}

      {(slide.elements ?? []).map((element, elementIndex) => {
        const size = getElementSize(element);
        const markerId = element.id ?? `line-${elementIndex}`;

        return (
          <div
            key={element.id ?? elementIndex}
            style={{
              position: 'absolute',
              left: element.left ?? 0,
              top: element.top ?? 0,
              width: size.width,
              height: size.height
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  opacity: element.opacity ?? 1,
                  filter: getShadowFilter(element.shadow),
                  transform: getFlipTransform(element.flipH, element.flipV),
                  transformOrigin: 'center',
                  color: element.defaultColor,
                  fontFamily: element.defaultFontName
                }}
              >
                {renderElement(element, markerId)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
