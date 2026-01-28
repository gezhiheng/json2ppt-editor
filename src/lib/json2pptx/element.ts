import type { SlideElement } from '../../types/ppt'

export const getElementRange = (element: SlideElement) => {
  let minX = 0
  let maxX = 0
  let minY = 0
  let maxY = 0

  if (element.type === 'line' && element.start && element.end) {
    minX = element.left ?? 0
    maxX = (element.left ?? 0) + Math.max(element.start[0], element.end[0])
    minY = element.top ?? 0
    maxY = (element.top ?? 0) + Math.max(element.start[1], element.end[1])
  } else if (element.left !== undefined && element.top !== undefined) {
    minX = element.left
    minY = element.top
    maxX = element.left + (element.width ?? 0)
    maxY = element.top + (element.height ?? 0)
  }

  return { minX, maxX, minY, maxY }
}

export const getLineElementPath = (element: SlideElement) => {
  if (!element.start || !element.end) return ''
  const start = element.start.join(',')
  const end = element.end.join(',')
  const broken = element.broken as [number, number] | undefined
  const broken2 = element.broken2 as [number, number] | undefined
  const curve = element.curve as [number, number] | undefined
  const cubic = element.cubic as [[number, number], [number, number]] | undefined

  if (broken) {
    const mid = broken.join(',')
    return `M${start} L${mid} L${end}`
  }
  if (broken2) {
    const { minX, maxX, minY, maxY } = getElementRange(element)
    if (maxX - minX >= maxY - minY) {
      return `M${start} L${broken2[0]},${element.start[1]} L${broken2[0]},${element.end[1]} ${end}`
    }
    return `M${start} L${element.start[0]},${broken2[1]} L${element.end[0]},${broken2[1]} ${end}`
  }
  if (curve) {
    const mid = curve.join(',')
    return `M${start} Q${mid} ${end}`
  }
  if (cubic) {
    const [c1, c2] = cubic
    const p1 = c1.join(',')
    const p2 = c2.join(',')
    return `M${start} C${p1} ${p2} ${end}`
  }
  return `M${start} L${end}`
}
