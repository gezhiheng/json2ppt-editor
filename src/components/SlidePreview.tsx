import { useState, type CSSProperties } from 'react'
import { Check, Copy } from 'lucide-react'
import type { Slide, SlideElement } from '../types/ppt'
import { cn } from '../lib/utils'

const MIN_LINE_SIZE = 24

const getShadowFilter = (shadow?: SlideElement['shadow']) => {
  if (!shadow) return undefined
  const h = shadow.h ?? 0
  const v = shadow.v ?? 0
  const blur = shadow.blur ?? 0
  const color = shadow.color ?? '#000'
  return `drop-shadow(${h}px ${v}px ${blur}px ${color})`
}

const getFlipTransform = (flipH?: boolean, flipV?: boolean) => {
  const transforms = [flipH ? 'scaleX(-1)' : '', flipV ? 'scaleY(-1)' : '']
    .filter(Boolean)
    .join(' ')
  return transforms || undefined
}

const getLineDashArray = (width: number, style?: string) => {
  if (style === 'dashed')
    return width <= 8
      ? `${width * 5} ${width * 2.5}`
      : `${width * 5} ${width * 1.5}`
  if (style === 'dotted')
    return width <= 8
      ? `${width * 1.8} ${width * 1.6}`
      : `${width * 1.5} ${width * 1.2}`
  return '0 0'
}

const getOutlineDashArray = (outline?: SlideElement['outline']) => {
  const style = (outline as any)?.style
  const width = outline?.width ?? 1
  if (style === 'dashed')
    return width <= 8
      ? `${width * 5} ${width * 2.5}`
      : `${width * 5} ${width * 1.5}`
  if (style === 'dotted')
    return width <= 8
      ? `${width * 1.8} ${width * 1.6}`
      : `${width * 1.5} ${width * 1.2}`
  return undefined
}

const getLinePath = (
  element: SlideElement & { start: [number, number]; end: [number, number] }
) => {
  const start = element.start.join(',')
  const end = element.end.join(',')
  const broken = (element as any).broken as [number, number] | undefined
  const broken2 = (element as any).broken2 as [number, number] | undefined
  const curve = (element as any).curve as [number, number] | undefined
  const cubic = (element as any).cubic as
    | [[number, number], [number, number]]
    | undefined

  if (broken) {
    const mid = broken.join(',')
    return `M${start} L${mid} L${end}`
  }
  if (broken2) {
    const width = Math.abs(element.end[0] - element.start[0])
    const height = Math.abs(element.end[1] - element.start[1])
    if (width >= height) {
      return `M${start} L${broken2[0]},${element.start[1]} L${broken2[0]},${element.end[1]} L${end}`
    }
    return `M${start} L${element.start[0]},${broken2[1]} L${element.end[0]},${broken2[1]} L${end}`
  }
  if (curve) {
    const mid = curve.join(',')
    return `M${start} Q${mid} ${end}`
  }
  if (cubic) {
    const [c1, c2] = cubic
    return `M${start} C${c1.join(',')} ${c2.join(',')} ${end}`
  }
  return `M${start} L${end}`
}

function renderLineMarker (props: {
  id: string
  position: 'start' | 'end'
  type: 'arrow' | 'dot'
  baseSize: number
  color?: string
}) {
  const pathMap = {
    dot: 'm0 5a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z',
    arrow: 'M0,0 L10,5 0,10 Z'
  }
  const rotateMap: Record<string, number> = {
    'arrow-start': 180,
    'arrow-end': 0
  }
  const size = props.baseSize < 2 ? 2 : props.baseSize
  const rotate = rotateMap[`${props.type}-${props.position}`] || 0

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
      <path
        d={pathMap[props.type]}
        fill={props.color}
        transform={`scale(${size * 0.3}, ${
          size * 0.3
        }) rotate(${rotate}, 5, 5)`}
      />
    </marker>
  )
}

function renderShape (element: SlideElement, patternId: string) {
  const viewWidth = element.viewBox?.[0] ?? element.width ?? 0
  const viewHeight = element.viewBox?.[1] ?? element.height ?? 0
  const outlineDashArray = getOutlineDashArray(element.outline)
  const pattern = element.pattern
  const fill = pattern ? `url(#${patternId})` : element.fill || 'transparent'
  const text = element.text
  const verticalAlign = text?.align ?? 'middle'
  const justifyContent =
    verticalAlign === 'top'
      ? 'flex-start'
      : verticalAlign === 'bottom'
        ? 'flex-end'
        : 'center'

  return (
    <div className='relative h-full w-full'>
      <svg className='absolute inset-0' overflow='visible' width={element.width} height={element.height}>
        {pattern && (
          <defs>
            <pattern
              id={patternId}
              patternUnits='userSpaceOnUse'
              patternContentUnits='userSpaceOnUse'
              width={viewWidth}
              height={viewHeight}
            >
              <image
                href={pattern}
                width={viewWidth}
                height={viewHeight}
                preserveAspectRatio='xMidYMid slice'
              />
            </pattern>
          </defs>
        )}
        <g
          transform={`scale(${(element.width ?? 0) / viewWidth || 1}, ${
            (element.height ?? 0) / viewHeight || 1
          }) translate(0,0) matrix(1,0,0,1,0,0)`}
        >
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
          className='absolute inset-0 flex'
          style={{
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
  )
}

function renderLine (element: SlideElement, markerId: string) {
  if (!element.start || !element.end) return null

  const width = Math.max(
    Math.abs(element.start[0] - element.end[0]),
    MIN_LINE_SIZE
  )
  const height = Math.max(
    Math.abs(element.start[1] - element.end[1]),
    MIN_LINE_SIZE
  )
  const lineWidth = element.width ?? 1
  const style = (element as any).style as string | undefined
  const dashArray = getLineDashArray(lineWidth, style)
  const path = getLinePath(
    element as SlideElement & { start: [number, number]; end: [number, number] }
  )

  const points = (element as any).points as
    | ['' | 'arrow' | 'dot', '' | 'arrow' | 'dot']
    | undefined
  const startMarker = points?.[0] ? points[0] : undefined
  const endMarker = points?.[1] ? points[1] : undefined

  return (
    <svg overflow='visible' width={width} height={height}>
      <defs>
        {startMarker &&
          renderLineMarker({
            id: markerId,
            position: 'start',
            type: startMarker,
            color: element.color,
            baseSize: lineWidth
          })}
        {endMarker &&
          renderLineMarker({
            id: markerId,
            position: 'end',
            type: endMarker,
            color: element.color,
            baseSize: lineWidth
          })}
      </defs>
      <path
        d={path}
        stroke={element.color ?? '#000'}
        strokeWidth={lineWidth}
        strokeDasharray={dashArray}
        fill='none'
        markerStart={
          startMarker ? `url(#${markerId}-${startMarker}-start)` : undefined
        }
        markerEnd={endMarker ? `url(#${markerId}-${endMarker}-end)` : undefined}
      />
    </svg>
  )
}

function renderText (element: SlideElement) {
  const isVertical = (element as any).vertical
  const lineHeight = (element as any).lineHeight ?? 1.5
  const wordSpace = (element as any).wordSpace ?? 0
  const paragraphSpace = (element as any).paragraphSpace
  const defaultFontName = (element as any).defaultFontName
  const defaultColor = element.defaultColor

  return (
    <div
      className='h-full w-full text-ink-900'
      style={{
        padding: 10,
        lineHeight,
        letterSpacing: `${wordSpace}px`,
        wordBreak: 'break-word',
        fontFamily: defaultFontName || 'Spline Sans, system-ui, sans-serif',
        color: defaultColor,
        writingMode: isVertical ? 'vertical-rl' : undefined,
        ...(paragraphSpace !== undefined
          ? ({
              ['--paragraphSpace' as string]: `${paragraphSpace}px`
            } as CSSProperties)
          : {})
      }}
      dangerouslySetInnerHTML={{ __html: element.content || '' }}
    />
  )
}

function renderImage (element: SlideElement) {
  const isEllipse = element.clip?.shape === 'ellipse'
  const grayscale = element.filters?.grayscale
  const opacity = element.filters?.opacity
  const blur = (element.filters as any)?.blur
  const radius = (element as any).radius

  const filterStr = [
    grayscale ? `grayscale(${grayscale})` : '',
    opacity ? `opacity(${opacity})` : '',
    blur ? `blur(${blur})` : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden',
        isEllipse ? 'rounded-full' : ''
      )}
      style={{
        filter: filterStr || undefined,
        borderRadius: radius ? `${radius}px` : undefined
      }}
    >
      <img
        src={element.src || ''}
        alt=''
        className='h-full w-full object-cover'
      />
    </div>
  )
}

const parseFontSize = (value?: string) => {
  if (!value) return undefined
  const size = Number.parseFloat(value)
  return Number.isFinite(size) ? `${size}px` : undefined
}

const normalizeFontName = (value?: string) => {
  if (!value) return undefined
  return value.replace(/^"+|"+$/g, '')
}

const tableColor = (value?: string) => {
  if (!value) return undefined
  return value.startsWith('rgb') || value.startsWith('#') ? value : undefined
}

type TableCell = {
  key: string
  colSpan: number
  rowSpan: number
  text: string
  style: NonNullable<NonNullable<SlideElement['data']>[number][number]>['style']
}

const isPlaceholderCell = (
  cell: NonNullable<NonNullable<SlideElement['data']>[number][number]> | undefined
) => {
  if (!cell) return false
  const colspan = cell.colspan ?? 1
  const rowspan = cell.rowspan ?? 1
  if (colspan !== 1 || rowspan !== 1) return false
  const text = cell.text ?? ''
  const style = cell.style
  const hasStyle =
    Boolean(style?.fontname) ||
    Boolean(style?.fontsize) ||
    Boolean(style?.color) ||
    Boolean(style?.backcolor)
  return text.trim() === '' && !hasStyle
}

const buildTableRows = (element: SlideElement) => {
  const rows = element.data ?? []
  const colCount = element.colWidths?.length ?? 0
  const rowCells: TableCell[][] = []
  const skip = new Array(colCount).fill(0)

  rows.forEach((row, rowIndex) => {
    const cells: TableCell[] = []
    let colIndex = 0
    let cellIndex = 0

    while (colIndex < colCount) {
      if (skip[colIndex] > 0) {
        skip[colIndex] -= 1
        if (isPlaceholderCell(row[cellIndex])) {
          cellIndex += 1
        }
        colIndex += 1
        continue
      }

      const cell = row[cellIndex]
      if (!cell) break
      cellIndex += 1

      const colSpan = cell.colspan ?? 1
      const rowSpan = cell.rowspan ?? 1

      if (rowSpan > 1) {
        for (let i = 0; i < colSpan; i += 1) {
          skip[colIndex + i] = rowSpan - 1
        }
      }

      if (colSpan > 1) {
        for (let i = 0; i < colSpan - 1; i += 1) {
          if (isPlaceholderCell(row[cellIndex])) {
            cellIndex += 1
          }
        }
      }

      cells.push({
        key: cell.id ?? `${rowIndex}-${colIndex}-${cellIndex}`,
        colSpan,
        rowSpan,
        text: cell.text ?? '',
        style: cell.style
      })

      colIndex += colSpan
    }

    rowCells.push(cells)
  })

  return rowCells
}

function renderTable (element: SlideElement) {
  const colWidths = element.colWidths ?? []
  const rows = buildTableRows(element)
  const rowCount = rows.length || 1
  const baseRowHeight = (element.height ?? 0) / rowCount
  const rowHeight = element.cellMinHeight
    ? Math.max(element.cellMinHeight, baseRowHeight)
    : baseRowHeight

  return (
    <div className='h-full w-full'>
      <table
        className='h-full w-full table-fixed border-collapse'
        style={{
          border: element.outline ? `${element.outline.width ?? 1}px solid ${element.outline.color ?? '#000'}` : undefined
        }}
      >
        {colWidths.length > 0 && (
          <colgroup>
            {colWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width: `${width * 100}%` }} />
            ))}
          </colgroup>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} style={{ height: rowHeight }}>
              {row.map((cell) => (
                <td
                  key={cell.key}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  style={{
                    border: element.outline
                      ? `${element.outline.width ?? 1}px solid ${element.outline.color ?? '#000'}`
                      : '1px solid #ddd',
                    background: tableColor(cell.style?.backcolor),
                    padding: '6px 8px',
                    textAlign: (cell.style?.align as any) ?? 'left',
                    color: tableColor(cell.style?.color),
                    fontFamily: normalizeFontName(cell.style?.fontname),
                    fontSize: parseFontSize(cell.style?.fontsize),
                    verticalAlign: 'middle'
                  }}
                >
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderElement (element: SlideElement, markerId: string) {
  if (element.type === 'shape') return renderShape(element, `shape-${markerId}`)
  if (element.type === 'line') return renderLine(element, markerId)
  if (element.type === 'text') return renderText(element)
  if (element.type === 'image') return renderImage(element)
  if (element.type === 'table') return renderTable(element)
  return null
}

function getElementSize (element: SlideElement): {
  width: number
  height: number
} {
  if (element.type === 'line' && element.start && element.end) {
    const width = Math.max(
      Math.abs(element.end[0] - element.start[0]),
      MIN_LINE_SIZE
    )
    const height = Math.max(
      Math.abs(element.end[1] - element.start[1]),
      MIN_LINE_SIZE
    )
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
  const [copied, setCopied] = useState(false)
  const elements = slide.elements ?? []
  const scale = previewWidth / baseWidth
  const previewHeight = baseHeight * scale

  const handleCopyId = () => {
    if (slide.id) {
      navigator.clipboard.writeText(slide.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    }
  }

  return (
    <div
      className='space-y-3 animate-rise'
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className='flex items-center justify-between'>
        <div className='font-display text-sm uppercase tracking-[0.2em] text-ink-500'>
          {slide.id && (
            <button
              className='group inline-flex items-center gap-1.5 rounded border border-transparent px-1.5 py-0.5 font-mono text-xs normal-case tracking-normal text-ink-400 transition-colors hover:border-ink-200 hover:bg-ink-100 hover:text-ink-700'
              onClick={handleCopyId}
              title='Click to copy slide ID'
            >
              <span>{slide.id}</span>
              {copied ? (
                <Check className='h-3 w-3' />
              ) : (
                <Copy className='h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100' />
              )}
            </button>
          )}
        </div>
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
          {elements.map((element, elementIndex) => {
            const size = getElementSize(element)
            const opacity = element.opacity ?? 1
            const flipH = (element as any).flipH
            const flipV = (element as any).flipV
            const shadowFilter = getShadowFilter(element.shadow)
            const flipTransform = getFlipTransform(flipH, flipV)
            const markerId = element.id ?? `line-${elementIndex}`

            return (
              <div
                key={element.id ?? elementIndex}
                className='absolute slide-element'
                style={{
                  left: element.left ?? 0,
                  top: element.top ?? 0,
                  width: size.width,
                  height: size.height
                }}
              >
                <div
                  className='h-full w-full'
                  style={{
                    transform: element.rotate
                      ? `rotate(${element.rotate}deg)`
                      : undefined
                  }}
                >
                  <div
                    className='h-full w-full'
                    style={{
                      position: 'relative',
                      opacity: opacity !== 1 ? opacity : undefined,
                      filter: shadowFilter,
                      transform: flipTransform,
                      transformOrigin: 'center',
                      color: element.defaultColor,
                      fontFamily: (element as any).defaultFontName
                    }}
                  >
                    {renderElement(element, markerId)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
