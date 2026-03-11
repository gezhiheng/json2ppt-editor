import type { SlideElement } from '../types';
import { getSvgLinearGradientCoordinates } from '../utils/fill';

const getOutlineDashArray = (outline?: SlideElement['outline']) => {
  const style = outline?.style;
  const width = outline?.width ?? 1;
  if (style === 'dashed') return width <= 8 ? `${width * 5} ${width * 2.5}` : `${width * 5} ${width * 1.5}`;
  if (style === 'dotted') return width <= 8 ? `${width * 1.8} ${width * 1.6}` : `${width * 1.5} ${width * 1.2}`;
  return undefined;
};

export function renderShape(element: SlideElement, patternId: string) {
  const viewWidth = element.viewBox?.[0] ?? element.width ?? 0;
  const viewHeight = element.viewBox?.[1] ?? element.height ?? 0;
  const outlineDashArray = getOutlineDashArray(element.outline);
  const gradientId = `${patternId}-gradient`;
  let fill = 'transparent';

  if (element.fill?.type === 'solid') {
    fill = element.fill.color || 'transparent';
  } else if (element.fill?.type === 'image' && element.fill.src) {
    fill = `url(#${patternId})`;
  } else if (element.fill?.type === 'gradient' && element.fill.gradient?.colors?.length) {
    fill = `url(#${gradientId})`;
  }

  const text = element.text;
  const verticalAlign = text?.align ?? 'middle';
  const justifyContent = verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg style={{ position: 'absolute', inset: 0 }} overflow='visible' width={element.width} height={element.height}>
        {element.fill?.type === 'image' && element.fill.src && (
          <defs>
            <pattern
              id={patternId}
              patternUnits='userSpaceOnUse'
              patternContentUnits='userSpaceOnUse'
              width={viewWidth}
              height={viewHeight}
            >
              <image
                href={element.fill.src}
                width={viewWidth}
                height={viewHeight}
                preserveAspectRatio='xMidYMid slice'
                opacity={element.fill.opacity ?? 1}
              />
            </pattern>
          </defs>
        )}
        {element.fill?.type === 'gradient' && element.fill.gradient?.colors?.length ? (
          <defs>
            {(() => {
              const { x1, y1, x2, y2 } = getSvgLinearGradientCoordinates(
                element.fill?.gradient?.rotate ?? 0
              );
              return element.fill.gradient?.type === 'linear' || element.fill.gradient?.type === 'line' ? (
                <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
                  {element.fill.gradient.colors.map((stop, index) => (
                    <stop key={index} offset={`${stop.pos ?? 0}%`} stopColor={stop.color ?? '#FFFFFF'} />
                  ))}
                </linearGradient>
              ) : (
                <radialGradient id={gradientId} cx='50%' cy='50%' r='50%'>
                  {element.fill.gradient.colors.map((stop, index) => (
                    <stop key={index} offset={`${stop.pos ?? 0}%`} stopColor={stop.color ?? '#FFFFFF'} />
                  ))}
                </radialGradient>
              );
            })()}
          </defs>
        ) : null}
        <g transform={`scale(${(element.width ?? 0) / viewWidth || 1}, ${(element.height ?? 0) / viewHeight || 1}) translate(0,0) matrix(1,0,0,1,0,0)`}>
          <path
            vectorEffect='non-scaling-stroke'
            strokeLinecap='butt'
            strokeMiterlimit={8}
            d={element.path || ''}
            fill={fill}
            stroke={element.outline?.color}
            strokeWidth={element.outline?.width}
            strokeDasharray={outlineDashArray}
          />
        </g>
      </svg>

      {text?.content && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent,
            alignItems: 'stretch',
            color: text.defaultColor,
            fontFamily: text.defaultFontName || undefined,
            lineHeight: text.lineHeight,
            pointerEvents: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: text.content }}
        />
      )}
    </div>
  );
}
