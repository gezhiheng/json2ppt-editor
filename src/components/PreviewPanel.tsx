import { useRef, useState, type RefObject } from 'react'
import { Check, Copy, Download, LayoutGrid, List, Upload } from 'lucide-react'
import { PPTXPreviewer } from 'pptx-previewer'

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
  isImporting: boolean
  isExporting: boolean
  onImportPptx: (file: File) => void
  onExportPptx: () => void
}

type SlideCardProps = {
  slide: Slide
  baseWidth: number
  baseHeight: number
  previewWidth: number
  index: number
  themeBackground?: string
}

function SlideCard ({
  slide,
  baseWidth,
  baseHeight,
  previewWidth,
  index,
  themeBackground
}: SlideCardProps): JSX.Element {
  const [copied, setCopied] = useState(false)
  const scale = previewWidth / baseWidth
  const previewHeight = baseHeight * scale

  const handleCopyId = () => {
    if (slide.id) {
      navigator.clipboard.writeText(slide.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    }
  }

  const backgroundColor = slide.background?.color ?? themeBackground
  const previewSlide: Slide = backgroundColor
    ? {
        ...slide,
        background: {
          ...slide.background,
          color: backgroundColor
        }
      }
    : slide

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
          <PPTXPreviewer slide={previewSlide} />
        </div>
      </div>
    </div>
  )
}

export function PreviewPanel ({
  deck,
  slideWidth,
  slideHeight,
  previewWidth,
  previewRef,
  themeBackground,
  isImporting,
  isExporting,
  onImportPptx,
  onExportPptx
}: PreviewPanelProps): JSX.Element {
  const [isGrid, setIsGrid] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toolButtonClass =
    'h-8 px-2 text-ink-600 hover:text-ink-900 disabled:text-ink-400'

  function handleUploadClick (): void {
    fileInputRef.current?.click()
  }

  function handleFileChange (event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    onImportPptx(file)
    event.target.value = ''
  }

  return (
    <section
      ref={previewRef}
      className='h-full preview-scroll flex min-h-0 flex-col gap-6 overflow-y-auto overflow-x-hidden rounded-xl border border-white/70 bg-white/80 px-6 pb-6 pt-0 shadow-soft backdrop-blur'
    >
      <div className='sticky top-0 z-10 -mx-6 flex items-center justify-between bg-white px-6 pb-4 pt-6'>
        <div className='flex items-center gap-2'>
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
              <List
                className={cn(
                  'h-4 w-4',
                  !isGrid ? 'text-ember-500' : 'text-ink-600'
                )}
              />
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
              <LayoutGrid
                className={cn(
                  'h-4 w-4',
                  isGrid ? 'text-ember-500' : 'text-ink-600'
                )}
              />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation'
            className='hidden'
            onChange={handleFileChange}
          />
          <div className='relative'>
            <Button
              variant='secondary'
              size='sm'
              className={toolButtonClass}
              onClick={handleUploadClick}
              disabled={isExporting || isImporting}
            >
              <Download className='h-4 w-4' />
            </Button>
            <div className='absolute -right-2 -top-2 rounded-md bg-ember-500 px-1 py-0.5 text-[8px] font-bold uppercase leading-none text-white shadow-sm ring-1 ring-white'>
              Beta
            </div>
          </div>
          <Button
            variant='secondary'
            size='sm'
            className={toolButtonClass}
            onClick={onExportPptx}
            disabled={isExporting || isImporting}
          >
            <Upload className='h-4 w-4' />
          </Button>
        </div>
        <div className='text-xs uppercase tracking-wider text-ink-500'>
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
          <SlideCard
            key={slide.id ?? index}
            slide={slide}
            baseWidth={slideWidth}
            baseHeight={slideHeight}
            previewWidth={isGrid ? (previewWidth - 24) / 2 : previewWidth}
            index={index}
            themeBackground={themeBackground}
          />
        ))}
      </div>
    </section>
  )
}
