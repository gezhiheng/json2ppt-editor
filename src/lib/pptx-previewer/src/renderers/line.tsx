import { MIN_LINE_SIZE } from '../constants';
import type { SlideElement } from '../types';

type LineElement = SlideElement & { start: [number, number]; end: [number, number] };
type LinePointType = '' | 'arrow' | 'dot';

const getLineDashArray = (width: number, style?: string) => {
  if (style === 'dashed') return width <= 8 ? `${width * 5} ${width * 2.5}` : `${width * 5} ${width * 1.5}`;
  if (style === 'dotted') return width <= 8 ? `${width * 1.8} ${width * 1.6}` : `${width * 1.5} ${width * 1.2}`;
  return '0 0';
};

const getLinePath = (element: LineElement) => {
  const start = element.start.join(',');
  const end = element.end.join(',');

  if (element.broken) return `M${start} L${element.broken.join(',')} L${end}`;

  if (element.broken2) {
    const width = Math.abs(element.end[0] - element.start[0]);
    const height = Math.abs(element.end[1] - element.start[1]);
    if (width >= height) {
      return `M${start} L${element.broken2[0]},${element.start[1]} L${element.broken2[0]},${element.end[1]} L${end}`;
    }
    return `M${start} L${element.start[0]},${element.broken2[1]} L${element.end[0]},${element.broken2[1]} L${end}`;
  }

  if (element.curve) return `M${start} Q${element.curve.join(',')} ${end}`;

  if (element.cubic) {
    const [c1, c2] = element.cubic;
    return `M${start} C${c1.join(',')} ${c2.join(',')} ${end}`;
  }

  return `M${start} L${end}`;
};

function renderLineMarker(props: {
  id: string;
  position: 'start' | 'end';
  type: 'arrow' | 'dot';
  baseSize: number;
  color?: string;
}) {
  const pathMap = {
    dot: 'm0 5a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z',
    arrow: 'M0,0 L10,5 0,10 Z'
  };
  const rotateMap: Record<string, number> = {
    'arrow-start': 180,
    'arrow-end': 0
  };
  const size = props.baseSize < 2 ? 2 : props.baseSize;
  const rotate = rotateMap[`${props.type}-${props.position}`] || 0;

  return (
    <marker
      id={`${props.id}-${props.type}-${props.position}`}
      markerUnits='userSpaceOnUse'
      orient='auto'
      markerWidth={size * 3}
      markerHeight={size * 3}
      refX={size * 1.5}
      refY={size * 1.5}
    >
      <path d={pathMap[props.type]} fill={props.color} transform={`scale(${size * 0.3}, ${size * 0.3}) rotate(${rotate}, 5, 5)`} />
    </marker>
  );
}

export function renderLine(element: SlideElement, markerId: string) {
  if (!element.start || !element.end) return null;

  const width = Math.max(Math.abs(element.start[0] - element.end[0]), MIN_LINE_SIZE);
  const height = Math.max(Math.abs(element.start[1] - element.end[1]), MIN_LINE_SIZE);
  const lineWidth = element.width ?? 1;
  const dashArray = getLineDashArray(lineWidth, element.style);
  const path = getLinePath(element as LineElement);

  const points = element.points as [LinePointType, LinePointType] | undefined;
  const startMarker = points?.[0] ? points[0] : undefined;
  const endMarker = points?.[1] ? points[1] : undefined;

  return (
    <svg overflow='visible' width={width} height={height}>
      <defs>
        {startMarker && renderLineMarker({ id: markerId, position: 'start', type: startMarker, color: element.color, baseSize: lineWidth })}
        {endMarker && renderLineMarker({ id: markerId, position: 'end', type: endMarker, color: element.color, baseSize: lineWidth })}
      </defs>
      <path
        d={path}
        stroke={element.color ?? '#000'}
        strokeWidth={lineWidth}
        strokeDasharray={dashArray}
        fill='none'
        markerStart={startMarker ? `url(#${markerId}-${startMarker}-start)` : undefined}
        markerEnd={endMarker ? `url(#${markerId}-${endMarker}-end)` : undefined}
      />
    </svg>
  );
}
