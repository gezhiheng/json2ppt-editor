import { useState, type RefObject } from 'react'
import { LayoutGrid, List } from 'lucide-react'

import { SlidePreview } from './SlidePreview'
import type { Deck, Slide } from '../types/ppt'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

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
  const [isGrid, setIsGrid] = useState(false)

  return (
    <section
      ref={previewRef}
      className='h-full preview-scroll flex min-h-0 flex-col gap-6 overflow-y-auto overflow-x-hidden rounded-xl border border-white/70 bg-white/80 px-6 pb-6 pt-0 shadow-soft backdrop-blur'
    >
      <div className='sticky top-0 z-10 -mx-6 flex items-center justify-between bg-white/80 px-6 pb-4 pt-6 backdrop-blur'>
        <div className='flex items-center gap-4'>
          <h2 className='font-display text-lg text-ink-900'>Slide Preview</h2>
          <div className='flex items-center gap-1 rounded-lg border border-ink-100 bg-ink-50 p-1'>
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'h-6 w-6 rounded border-0 p-0 hover:bg-ink-100',
                !isGrid &&
                  'bg-white shadow-sm ring-1 ring-black/5 hover:bg-white'
              )}
              onClick={() => setIsGrid(false)}
            >
              <List className='h-4 w-4 text-ink-600' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'h-6 w-6 rounded border-0 p-0 hover:bg-ink-100',
                isGrid &&
                  'bg-white shadow-sm ring-1 ring-black/5 hover:bg-white'
              )}
              onClick={() => setIsGrid(true)}
            >
              <LayoutGrid className='h-4 w-4 text-ink-600' />
            </Button>
          </div>
        </div>
        <div className='text-xs uppercase tracking-[0.2em] text-ink-500'>
          {deck?.slides?.length ?? 0} slides
        </div>
      </div>
      {!deck && (
        <div className='rounded-2xl border border-dashed border-ink-200 p-6 text-sm text-ink-500'>
          Fix the JSON to see slide previews.
        </div>
      )}
      <div className={cn('grid gap-6', isGrid ? 'grid-cols-2' : 'grid-cols-1')}>
        {deck?.slides?.map((slide: Slide, index: number) => (
          <SlidePreview
            key={slide.id ?? index}
            slide={slide}
            baseWidth={slideWidth}
            baseHeight={slideHeight}
            previewWidth={isGrid ? (previewWidth - 24) / 2 : previewWidth}
            index={index}
            slideLabel='Slide'
            layoutLabel='layout'
            themeBackground={themeBackground}
          />
        ))}
      </div>
    </section>
  )
}
