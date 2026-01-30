import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import { EditorPanel } from './components/EditorPanel'
import { HeaderBar } from './components/HeaderBar'
import { PreviewPanel } from './components/PreviewPanel'
import { buildPptxBlob } from './lib/json2pptx'
import { parsePptxToJson } from './lib/pptx2json'
import {
  findTemplateById,
  initialJson,
  initialTemplate,
  templateList,
  type TemplateEntry
} from './lib/templates'
import type { Deck } from './types/ppt'

const MIN_PREVIEW_WIDTH = 320
const PREVIEW_GUTTER = 48

function safeParse (value: string): { data: Deck | null; error: string } {
  try {
    return { data: JSON.parse(value) as Deck, error: '' }
  } catch (error) {
    return { data: null, error: (error as Error).message }
  }
}

function getTemplateOrFallback (templateId: string): TemplateEntry | undefined {
  return findTemplateById(templateId) ?? templateList[0]
}

function buildDownload (jsonText: string, fileName: string): void {
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function downloadBlob (blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

const ID_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateSlideId (existing: Set<string>): string {
  const withDash = Math.random() < 0.5
  const segments = withDash ? [5, 5] : [10]
  let id = ''
  for (let s = 0; s < segments.length; s += 1) {
    const segmentLength = segments[s]
    const bytes = new Uint32Array(segmentLength)
    crypto.getRandomValues(bytes)
    for (let i = 0; i < segmentLength; i += 1) {
      id += ID_CHARS[bytes[i] % ID_CHARS.length]
    }
    if (withDash && s === 0) id += '-'
  }
  if (!existing.has(id)) return id
  return generateSlideId(existing)
}

function reorderSlideIdFirst (slide: Deck['slides'][number], id: string) {
  const ordered: Record<string, unknown> = { id }
  for (const key of Object.keys(slide)) {
    if (key === 'id') continue
    ordered[key] = (slide as Record<string, unknown>)[key]
  }
  return ordered as Deck['slides'][number]
}

function ensureSlideIds (deck: Deck): { deck: Deck; changed: boolean } {
  if (!deck.slides?.length) return { deck, changed: false }
  let changed = false
  const existing = new Set<string>(
    deck.slides.map((slide) => slide.id).filter(Boolean) as string[]
  )
  const slides = deck.slides.map((slide) => {
    const hasId = Boolean(slide.id)
    const id = slide.id ?? generateSlideId(existing)
    const firstKey = Object.keys(slide)[0]
    const needsReorder = firstKey !== 'id'
    if (!hasId || needsReorder) {
      changed = true
      existing.add(id)
      return reorderSlideIdFirst(slide, id)
    }
    return slide
  })
  return changed ? { deck: { ...deck, slides }, changed } : { deck, changed }
}

export default function App (): JSX.Element {
  const [jsonText, setJsonText] = useState(initialJson)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(720)
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplate?.id ?? ''
  )
  const deferredJsonText = useDeferredValue(jsonText)
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Resize state
  const [editorWidthPercent, setEditorWidthPercent] = useState(42)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const parsed = useMemo(() => safeParse(deferredJsonText), [deferredJsonText])
  const deck = parsed.data
  const normalized = useMemo(
    () => (deck ? ensureSlideIds(deck) : { deck: null, changed: false }),
    [deck]
  )
  const normalizedDeck = normalized.deck
  const slideWidth = deck?.width ?? 1000
  const slideHeight = deck?.height ?? 562.5

  const selectedTemplate = useMemo(
    () => getTemplateOrFallback(selectedTemplateId),
    [selectedTemplateId]
  )

  function applyTemplate (templateId: string): void {
    const template = getTemplateOrFallback(templateId)
    if (!template) return
    setSelectedTemplateId(template.id)
    setJsonText(JSON.stringify(template.data, null, 2))
  }

  // Handle preview width updates
  useEffect(() => {
    function updateWidth (): void {
      if (!previewRef.current) return
      const containerWidth = previewRef.current.clientWidth
      const availableWidth = Math.max(
        MIN_PREVIEW_WIDTH,
        containerWidth - PREVIEW_GUTTER
      )
      setPreviewWidth(Math.min(slideWidth, availableWidth))
    }

    updateWidth()

    // Use ResizeObserver to detect container size changes from split resizing
    const observer = new ResizeObserver(updateWidth)
    if (previewRef.current) {
      observer.observe(previewRef.current)
    }

    // Also listen to window resize as fallback/supplement
    window.addEventListener('resize', updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [slideWidth])

  useEffect(() => {
    if (!deck || parsed.error) return
    const { deck: updated, changed } = ensureSlideIds(deck)
    if (!changed) return
    setJsonText(JSON.stringify(updated, null, 2))
  }, [deck, parsed.error])

  // Handle Split Resizing
  useEffect(() => {
    if (!isResizing) return

    function handleMouseMove (e: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newPercent = ((e.clientX - rect.left) / rect.width) * 100
      // Clamp between 20% and 80% to prevent collapse
      setEditorWidthPercent(Math.max(20, Math.min(80, newPercent)))
    }

    function handleMouseUp () {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  async function handleExportPptx (): Promise<void> {
    const current = safeParse(jsonText)
    if (!current.data) {
      alert('JSON parse error. Fix the JSON before exporting.')
      return
    }
    const normalizedExport = ensureSlideIds(current.data)
    if (normalizedExport.changed) {
      setJsonText(JSON.stringify(normalizedExport.deck, null, 2))
    }
    setIsExporting(true)
    try {
      const { blob, fileName } = await buildPptxBlob(normalizedExport.deck)
      downloadBlob(blob, fileName)
    } finally {
      setIsExporting(false)
    }
  }

  function handleExportJson (): void {
    const fileName = `${deck?.title ?? 'json2ppt'}.json`
    buildDownload(jsonText, fileName)
  }

  async function handleImportPptx (file: File): Promise<void> {
    setIsImporting(true)
    try {
      const { deck: importedDeck, warnings } = await parsePptxToJson(file)
      setJsonText(JSON.stringify(importedDeck, null, 2))
      if (warnings.length) {
        alert(warnings.join('\n'))
      }
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className='h-screen px-6 py-6'>
      <div className='mx-auto flex h-full flex-col gap-6'>
        <HeaderBar
          deck={deck}
          templates={templateList}
          selectedTemplateId={selectedTemplate?.id ?? ''}
          jsonError={parsed.error}
          onTemplateChange={applyTemplate}
          onResetTemplate={() => applyTemplate(selectedTemplate?.id ?? '')}
        />

        <main
          ref={containerRef}
          className='flex flex-1 min-h-0 overflow-hidden'
        >
          <div
            style={{ width: `${editorWidthPercent}%` }}
            className='flex h-full min-w-0 flex-col'
          >
            <EditorPanel
              value={jsonText}
              onChange={setJsonText}
              onDownload={handleExportJson}
            />
          </div>

          {/* Resizer Handle */}
          <div
            className='group relative z-10 flex w-6 flex-shrink-0 cursor-col-resize items-center justify-center hover:bg-black/5'
            onMouseDown={() => setIsResizing(true)}
          >
            <div
              className={`h-8 w-1 rounded-full ${
                isResizing ? 'bg-ember-500' : 'bg-ink-200'
              } transition-colors group-hover:bg-ember-500`}
            />
          </div>

          <div className='flex h-full min-w-0 flex-1 flex-col'>
            <PreviewPanel
              deck={normalizedDeck}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              previewWidth={previewWidth}
              previewRef={previewRef}
              themeBackground={deck?.theme?.backgroundColor}
              isExporting={isExporting}
              isImporting={isImporting}
              onImportPptx={handleImportPptx}
              onExportPptx={handleExportPptx}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
