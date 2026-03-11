import type { ElementFill, FillGradient } from '../types'

function buildGradientStops(gradient?: FillGradient): string {
  return (gradient?.colors ?? [])
    .map((stop) => `${stop.color ?? '#FFFFFF'} ${stop.pos ?? 0}%`)
    .join(', ')
}

export function getCssBackground(fill?: ElementFill): string | undefined {
  if (!fill) return undefined

  if (fill.type === 'solid') {
    return fill.color
  }

  if (fill.type === 'image') {
    return fill.src ? `url("${fill.src}") center / cover no-repeat` : undefined
  }

  const stops = buildGradientStops(fill.gradient)
  if (!stops) return undefined

  const gradientType = fill.gradient?.type === 'linear' || fill.gradient?.type === 'line'
    ? 'linear'
    : 'radial'

  if (gradientType === 'radial') {
    return `radial-gradient(circle, ${stops})`
  }

  return `linear-gradient(${(fill.gradient?.rotate ?? 0) + 90}deg, ${stops})`
}

export function getSvgLinearGradientCoordinates(rotate = 0): {
  x1: number
  y1: number
  x2: number
  y2: number
} {
  const radians = (rotate * Math.PI) / 180
  const dx = Math.cos(radians) / 2
  const dy = Math.sin(radians) / 2

  return {
    x1: 0.5 - dx,
    y1: 0.5 - dy,
    x2: 0.5 + dx,
    y2: 0.5 + dy
  }
}
