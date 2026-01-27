import type { Slide, SlideElement } from '../types/ppt'

const toPercent = (value: number, base: number) => `${(value / base) * 100}%`

function renderShape (
  shape: SlideElement & { path: string; viewBox?: number[] }
) {
  const viewWidth = shape.viewBox?.[0] ?? shape.width ?? 0
  const viewHeight = shape.viewBox?.[1] ?? shape.height ?? 0
  return (
    <svg
      className='h-full w-full'
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio='none'
    >
      <path
        d={shape.path}
        fill={shape.fill || 'transparent'}
        stroke={shape.outline?.color}
        strokeWidth={shape.outline?.width}
      />
    </svg>
  )
}

function renderLine (
  line: SlideElement & { start: [number, number]; end: [number, number] }
) {
  const width = Math.max(Math.abs(line.end[0] - line.start[0]), 1)
  const height = Math.max(Math.abs(line.end[1] - line.start[1]), 1)
  return (
    <svg className='h-full w-full' viewBox={`0 0 ${width} ${height}`}>
      <line
        x1={line.start[0]}
        y1={line.start[1]}
        x2={line.end[0]}
        y2={line.end[1]}
        stroke={line.color ?? '#000'}
        strokeWidth={line.width ?? 1}
      />
    </svg>
  )
}

function renderText (text: SlideElement & { content: string }) {
  return (
    <div
      className='h-full w-full text-ink-900'
      style={{ fontFamily: 'Spline Sans, system-ui, sans-serif' }}
      dangerouslySetInnerHTML={{ __html: text.content }}
    />
  )
}

function renderImage (image: SlideElement & { src: string }) {
  const isEllipse = image.clip?.shape === 'ellipse'
  const grayscale = image.filters?.grayscale
  const opacity = image.filters?.opacity
  return (
    <div
      className={`h-full w-full overflow-hidden${
        isEllipse ? ' rounded-full' : ''
      }`}
      style={{
        filter: grayscale ? 'grayscale(1)' : undefined,
        opacity: opacity ? Number(opacity) / 100 : undefined
      }}
    >
      <img src={image.src} alt='' className='h-full w-full object-cover' />
    </div>
  )
}

function renderElement (element: SlideElement) {
  if (element.type === 'shape' && element.path) return renderShape(element)
  if (element.type === 'line' && element.start && element.end)
    return renderLine(element)
  if (element.type === 'text' && element.content) return renderText(element)
  if (element.type === 'image' && element.src) return renderImage(element)
  return null
}

function getElementSize (element: SlideElement): {
  width: number
  height: number
} {
  if (element.type === 'line' && element.start && element.end) {
    const width = Math.max(Math.abs(element.end[0] - element.start[0]), 1)
    const height = Math.max(Math.abs(element.end[1] - element.start[1]), 1)
    return { width, height }
  }
  return {
    width: element.width ?? 0,
    height: element.height ?? 0
  }
}

type SlidePreviewProps = {
  slide: Slide
  baseWidth: number
  baseHeight: number
  previewWidth: number
  index: number
  slideLabel: string
  layoutLabel: string
  themeBackground?: string
}

export function SlidePreview ({
  slide,
  baseWidth,
  baseHeight,
  previewWidth,
  index,
  slideLabel,
  layoutLabel,
  themeBackground
}: SlidePreviewProps): JSX.Element {
  const elements = slide.elements ?? []
  const scale = previewWidth / baseWidth
  const previewHeight = baseHeight * scale

  return (
    <div
      className='space-y-3 animate-rise'
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className='flex items-center justify-between'>
        <div className='font-display text-sm uppercase tracking-[0.2em] text-ink-500'>
          {slide.id && (
            <span className='ml-2 font-mono text-xs normal-case tracking-normal text-ink-400'>
              {slide.id}
            </span>
          )}
        </div>
        <div className='text-xs text-ink-500'>{slide.type ?? layoutLabel}</div>
      </div>
      <div style={{ width: previewWidth, height: previewHeight }}>
        <div
          className='slide-canvas'
          style={{
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          {themeBackground && (
            <div
              className='absolute inset-0'
              style={{ backgroundColor: themeBackground }}
            />
          )}
          {slide.background?.color && (
            <div
              className='absolute inset-0'
              style={{ backgroundColor: slide.background.color }}
            />
          )}
          {elements.map(element => {
            const size = getElementSize(element)
            return (
              <div
                key={element.id}
                className='absolute'
                style={{
                  left: toPercent(element.left ?? 0, baseWidth),
                  top: toPercent(element.top ?? 0, baseHeight),
                  width: toPercent(size.width, baseWidth),
                  height: toPercent(size.height, baseHeight),
                  transform: element.rotate
                    ? `rotate(${element.rotate}deg)`
                    : undefined,
                  transformOrigin: 'center'
                }}
              >
                {renderElement(element)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
