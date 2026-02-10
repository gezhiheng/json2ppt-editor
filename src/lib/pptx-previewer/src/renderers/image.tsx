import type { SlideElement } from '../types';

export function renderImage(element: SlideElement) {
  const filterStr = [
    element.filters?.grayscale ? `grayscale(${element.filters.grayscale})` : '',
    element.filters?.opacity ? `opacity(${element.filters.opacity})` : '',
    element.filters?.blur ? `blur(${element.filters.blur})` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: element.clip?.shape === 'ellipse' ? '50%' : element.radius ? `${element.radius}px` : undefined,
        filter: filterStr || undefined
      }}
    >
      <img src={element.src || ''} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}
