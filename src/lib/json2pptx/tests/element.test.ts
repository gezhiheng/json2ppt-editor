import { describe, expect, it } from 'vitest'
import { getElementRange, getLineElementPath } from '../src/element'
import type { SlideElement } from '../src/types/ppt'

describe('element helpers', () => {
  it('computes range for non-line elements', () => {
    const element: SlideElement = {
      type: 'shape',
      left: 10,
      top: 20,
      width: 300,
      height: 150
    }

    expect(getElementRange(element)).toEqual({
      minX: 10,
      maxX: 310,
      minY: 20,
      maxY: 170
    })
  })

  it('computes range for line elements', () => {
    const element: SlideElement = {
      type: 'line',
      left: 5,
      top: 6,
      start: [0, 0],
      end: [120, 80]
    }

    expect(getElementRange(element)).toEqual({
      minX: 5,
      maxX: 125,
      minY: 6,
      maxY: 86
    })
  })

  it('builds paths for line variants', () => {
    const base: SlideElement = {
      type: 'line',
      start: [0, 0],
      end: [10, 10]
    }

    expect(getLineElementPath(base)).toBe('M0,0 L10,10')

    const broken: SlideElement = {
      ...base,
      broken: [5, 0]
    }

    expect(getLineElementPath(broken)).toBe('M0,0 L5,0 L10,10')
  })
})
