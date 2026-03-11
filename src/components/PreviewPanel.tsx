import { useRef, useState, type RefObject } from 'react'
import { Check, Copy, Download, LayoutGrid, List, Upload } from 'lucide-react'
import { PPTXPreviewer } from 'pptx-previewer'

import type { PresentationData, Slide } from '../types/ppt'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

type PreviewPanelProps = {
  deck: PresentationData | null
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

function formatSlideTypeLabel (type?: string): string {
  const rawType = type?.trim()
  if (!rawType) return 'Standard'

  return rawType
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function getSlideTypeTone (type?: string): { chip: string, dot: string } {
  const normalized = type?.trim().toLowerCase() ?? ''

  if (normalized.includes('title') || normalized.includes('cover')) {
    return {
      chip: 'border-ember-400/40 bg-ember-500/10 text-ember-700',
      dot: 'bg-ember-500'
    }
  }

  if (
    normalized.includes('section') ||
    normalized.includes('chapter') ||
    normalized.includes('divider')
  ) {
    return {
      chip: 'border-slateblue-500/35 bg-slateblue-500/10 text-slateblue-500',
      dot: 'bg-slateblue-500'
    }
  }

  return {
    chip: 'border-ink-200 bg-ink-50 text-ink-700',
    dot: 'bg-ink-500'
  }
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
  const typeTone = getSlideTypeTone(slide.type)
  const typeLabel = formatSlideTypeLabel(slide.type)

  const handleCopyId = () => {
    if (slide.id) {
      navigator.clipboard.writeText(slide.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    }
  }

  const previewSlide: Slide = !slide.background && themeBackground
    ? {
        ...slide,
        background: {
          type: 'solid',
          color: themeBackground
        }
      }
    : slide

  return (
    <div
      className='space-y-3 animate-rise'
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className='flex items-center justify-between'>
        <div className='flex w-full items-center justify-between gap-2 font-display text-sm uppercase tracking-[0.2em] text-ink-500'>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] shadow-[0_1px_0_rgba(0,0,0,0.04)]',
              typeTone.chip
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', typeTone.dot)} />
            <span>{typeLabel}</span>
          </span>
          {slide.id && (
            <button
              className='group inline-flex max-w-full items-center gap-1.5 rounded border border-transparent px-1.5 py-0.5 font-mono text-xs normal-case tracking-normal text-ink-400 transition-colors hover:border-ink-200 hover:bg-ink-100 hover:text-ink-700'
              onClick={handleCopyId}
              title='Click to copy slide ID'
              aria-label='Copy slide ID'
            >
              <span className='max-w-[140px] truncate sm:max-w-[220px]'>
                {slide.id}
              </span>
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
  const showTwoColumns = isGrid && previewWidth >= 640

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
      className='preview-scroll flex h-full min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-xl border border-white/70 bg-white/80 px-3 pb-3 pt-0 shadow-soft backdrop-blur sm:gap-6 sm:px-6 sm:pb-6'
    >
      <div className='sticky top-0 z-10 -mx-3 flex flex-col gap-3 bg-white px-3 pb-3 pt-4 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-4 sm:pt-6'>
        <div className='flex flex-wrap items-center gap-2'>
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
              title='Switch to list view'
              aria-label='Switch to list view'
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
              title='Switch to grid view'
              aria-label='Switch to grid view'
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
              title='Import PPTX (beta)'
              aria-label='Import PPTX (beta)'
            >
              <Upload className='h-4 w-4' />
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
            title='Export PPTX'
            aria-label='Export PPTX'
          >
            <Download className='h-4 w-4' />
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
      <div className={cn('grid gap-6', showTwoColumns ? 'grid-cols-2' : 'grid-cols-1')}>
        {deck?.slides?.map((slide: Slide, index: number) => (
          <SlideCard
            key={`${slide.id ?? 'slide'}-${index}`}
            slide={slide}
            baseWidth={slideWidth}
            baseHeight={slideHeight}
            previewWidth={showTwoColumns ? (previewWidth - 24) / 2 : previewWidth}
            index={index}
            themeBackground={themeBackground}
          />
        ))}
      </div>
    </section>
  )
}
