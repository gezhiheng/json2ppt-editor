import type { RefObject } from 'react'

import { SlidePreview } from './SlidePreview'
import type { Deck, Slide } from '../types/ppt'

type PreviewPanelProps = {
  deck: Deck | null
  slideWidth: number
  slideHeight: number
  previewWidth: number
  previewRef: RefObject<HTMLDivElement>
  themeBackground?: string
}

export function PreviewPanel ({
  deck,
  slideWidth,
  slideHeight,
  previewWidth,
  previewRef,
  themeBackground
}: PreviewPanelProps): JSX.Element {
  return (
    <section
      ref={previewRef}
      className='h-full preview-scroll flex min-h-0 flex-col gap-6 overflow-y-auto overflow-x-hidden rounded-xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur'
    >
      <div className='flex items-center justify-between'>
        <h2 className='font-display text-lg text-ink-900'>Slide Preview</h2>
        <div className='text-xs uppercase tracking-[0.2em] text-ink-500'>
          {deck?.slides?.length ?? 0} slides
        </div>
      </div>
      {!deck && (
        <div className='rounded-2xl border border-dashed border-ink-200 p-6 text-sm text-ink-500'>
          Fix the JSON to see slide previews.
        </div>
      )}
      {deck?.slides?.map((slide: Slide, index: number) => (
        <SlidePreview
          key={slide.id ?? index}
          slide={slide}
          baseWidth={slideWidth}
          baseHeight={slideHeight}
          previewWidth={previewWidth}
          index={index}
          slideLabel='Slide'
          layoutLabel='layout'
          themeBackground={themeBackground}
        />
      ))}
    </section>
  )
}
