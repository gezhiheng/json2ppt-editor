'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { PPTXPreviewer } from 'pptx-previewer'
import { heroCoverSlide } from '../lib/hero-cover-slide'

const PREVIEW_WIDTH = 1000
const PREVIEW_HEIGHT = 562.5

export function HeroCoverPreview () {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const updateScale = () => {
      const nextWidth = frame.clientWidth
      if (nextWidth > 0) {
        setScale(nextWidth / PREVIEW_WIDTH)
      }
    }

    updateScale()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScale)
      return () => window.removeEventListener('resize', updateScale)
    }

    const observer = new ResizeObserver(updateScale)
    observer.observe(frame)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className='absolute inset-0'>
      <div
        className='origin-top-left will-change-transform'
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          transform: `scale(${scale})`
        }}
      >
        <PPTXPreviewer slide={heroCoverSlide} />
      </div>
    </div>
  )
}
