'use client'

import { useEffect, useRef } from 'react'

import { heroCoverJsonSnippet } from '../../lib/hero-cover-slide'
import { HeroCoverPreview } from '../hero-cover-preview'
import { cx, glassPanelClass, HighlightedJsonSnippet } from './shared'

const MAX_ROTATE_X = 7.2
const MAX_ROTATE_Y = 9.2
const MAX_LIFT = 10

type PointerState = {
  x: number
  y: number
  active: boolean
}

export function HomePageHeroVisual () {
  const frameRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const pointerStateRef = useRef<PointerState>({
    x: 0.5,
    y: 0.5,
    active: false
  })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    const host = hostRef.current
    if (!frame || !host) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const applyTilt = () => {
      rafRef.current = null

      const { x, y, active } = pointerStateRef.current

      if (!active) {
        host.style.setProperty('--hero-rotate-x', '0deg')
        host.style.setProperty('--hero-rotate-y', '0deg')
        host.style.setProperty('--hero-lift', '0px')
        host.style.setProperty('--hero-scale', '1')
        return
      }

      const normalizedX = x - 0.5
      const normalizedY = y - 0.5
      const rotateY = normalizedX * MAX_ROTATE_Y
      const rotateX = -normalizedY * MAX_ROTATE_X
      const lift = (Math.abs(normalizedX) + Math.abs(normalizedY)) * MAX_LIFT * -0.35
      const scale = 1.006 + (Math.abs(normalizedX) + Math.abs(normalizedY)) * 0.01

      host.style.setProperty('--hero-rotate-x', `${rotateX.toFixed(3)}deg`)
      host.style.setProperty('--hero-rotate-y', `${rotateY.toFixed(3)}deg`)
      host.style.setProperty('--hero-lift', `${lift.toFixed(3)}px`)
      host.style.setProperty('--hero-scale', `${scale.toFixed(4)}`)
    }

    const scheduleTilt = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(applyTilt)
    }

    const updatePointerState = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return

      const rect = frame.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      pointerStateRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
        active: true
      }

      scheduleTilt()
    }

    const handlePointerEnter = (event: PointerEvent) => {
      updatePointerState(event)
    }

    const handlePointerMove = (event: PointerEvent) => {
      updatePointerState(event)
    }

    const handlePointerLeave = () => {
      pointerStateRef.current = {
        ...pointerStateRef.current,
        active: false
      }
      scheduleTilt()
    }

    frame.addEventListener('pointerenter', handlePointerEnter)
    frame.addEventListener('pointermove', handlePointerMove)
    frame.addEventListener('pointerleave', handlePointerLeave)
    frame.addEventListener('pointercancel', handlePointerLeave)

    applyTilt()

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }

      frame.removeEventListener('pointerenter', handlePointerEnter)
      frame.removeEventListener('pointermove', handlePointerMove)
      frame.removeEventListener('pointerleave', handlePointerLeave)
      frame.removeEventListener('pointercancel', handlePointerLeave)
    }
  }, [])

  return (
    <div
      ref={frameRef}
      className='animate-[rise_0.7s_ease-out_80ms_both] relative min-h-[560px] [perspective:1400px] min-[1600px]:min-h-[640px] min-[761px]:max-[1180px]:mx-auto min-[761px]:max-[1180px]:w-full min-[761px]:max-[1180px]:max-w-[900px] min-[761px]:max-[1180px]:min-h-[480px] max-[760px]:min-h-[540px] max-[560px]:min-h-[500px]'
      aria-label='封面 JSON 与预览'
    >
      <div
        ref={hostRef}
        className='relative min-h-[560px] [transform-style:preserve-3d] will-change-transform transition-[transform] duration-200 ease-out min-[1600px]:min-h-[640px] min-[761px]:max-[1180px]:min-h-[480px] max-[760px]:min-h-[540px] max-[560px]:min-h-[500px]'
        style={{
          transform: 'rotateX(var(--hero-rotate-x, 0deg)) rotateY(var(--hero-rotate-y, 0deg)) translate3d(0, var(--hero-lift, 0px), 0) scale(var(--hero-scale, 1))'
        }}
      >
        <div
          className={cx(
            glassPanelClass,
            'absolute left-0 top-0 w-[min(436px,78%)] rounded-[30px] p-[22px] pb-6 min-[1600px]:w-[min(520px,72%)] min-[1600px]:p-6 min-[761px]:max-[1180px]:left-3 min-[761px]:max-[1180px]:w-[min(488px,58%)] min-[761px]:max-[1180px]:rounded-[28px] min-[761px]:max-[1180px]:p-5 min-[761px]:max-[1180px]:pb-5 max-[760px]:w-full max-[560px]:rounded-[24px] max-[560px]:p-[18px]'
          )}
          style={{ transform: 'translate3d(0, 0, 18px)' }}
        >
          <div className='mb-5 flex items-center justify-between gap-3 border-b border-[rgba(217,210,199,0.8)] pb-3'>
            <span className='font-mono text-[0.7rem] text-home-subtle'>presentation.json</span>
            <div className='flex gap-[7px]' aria-hidden='true'>
              <span className='h-2 w-2 rounded-full bg-[rgba(215,83,70,0.52)]' />
              <span className='h-2 w-2 rounded-full bg-[rgba(224,108,97,0.38)]' />
              <span className='h-2 w-2 rounded-full bg-[rgba(61,77,179,0.36)]' />
            </div>
          </div>

          <HighlightedJsonSnippet code={heroCoverJsonSnippet} />
        </div>

        <div
          className={cx(
            glassPanelClass,
            'absolute bottom-0 right-0 w-[min(490px,84%)] rounded-[30px] p-4 min-[1600px]:w-[min(620px,80%)] min-[1600px]:p-5 min-[761px]:max-[1180px]:right-3 min-[761px]:max-[1180px]:w-[min(520px,62%)] min-[761px]:max-[1180px]:rounded-[28px] min-[761px]:max-[1180px]:p-3.5 max-[760px]:w-[calc(100%-20px)] max-[560px]:rounded-[24px] max-[560px]:p-3'
          )}
          style={{ transform: 'translate3d(0, 0, 42px)' }}
        >
          <div className='relative aspect-[16/9] overflow-hidden rounded-[24px] border border-white/85 bg-white'>
            <HeroCoverPreview />
          </div>
        </div>
      </div>
    </div>
  )
}
