import type { SlideElement } from '../types';

export function renderImage(element: SlideElement) {
  const filterStr = [
    element.filters?.grayscale ? `grayscale(${element.filters.grayscale})` : '',
    element.filters?.opacity ? `opacity(${element.filters.opacity})` : '',
    element.filters?.blur ? `blur(${element.filters.blur})` : ''
  ]
    .filter(Boolean)
    .join(' ');
  const clipRange = element.clip?.range;
  const startX = clipRange?.[0]?.[0] ?? 0;
  const startY = clipRange?.[0]?.[1] ?? 0;
  const endX = clipRange?.[1]?.[0] ?? 100;
  const endY = clipRange?.[1]?.[1] ?? 100;
  const rangeWidth = Math.max(1, endX - startX);
  const rangeHeight = Math.max(1, endY - startY);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: element.clip?.shape === 'ellipse' ? '50%' : element.radius ? `${element.radius}px` : undefined,
        filter: filterStr || undefined,
        position: 'relative'
      }}
    >
      <img
        src={element.src || ''}
        alt=''
        style={{
          position: 'absolute',
          width: `${10000 / rangeWidth}%`,
          height: `${10000 / rangeHeight}%`,
          left: `${(-startX / rangeWidth) * 100}%`,
          top: `${(-startY / rangeHeight) * 100}%`
        }}
      />
    </div>
  );
}
