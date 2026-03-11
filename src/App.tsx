import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import { EditorPanel } from './components/EditorPanel'
import { HeaderBar } from './components/HeaderBar'
import { PreviewPanel } from './components/PreviewPanel'
import type { ThemeMediaPayload } from './components/ThemeModal/types'
import { createPPTX } from 'json2pptx'
import { applyCustomContent, applyCustomTheme } from 'pptx-custom'
import { parsePptxToJson } from './lib/pptx2json'
import {
  findTemplateById,
  initialJson,
  initialTemplate,
  templateList,
  type TemplateEntry
} from './lib/templates'
import type { PresentationData } from './types/ppt'

const MIN_PREVIEW_WIDTH = 320
const PREVIEW_GUTTER = 48
const MOBILE_PREVIEW_GUTTER = 24
const MOBILE_LAYOUT_QUERY = '(max-width: 1023px)'

function safeParse (value: string): { data: PresentationData | null; error: string } {
  try {
    return { data: JSON.parse(value) as PresentationData, error: '' }
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

function reorderSlideIdFirst (slide: PresentationData['slides'][number], id: string) {
  const ordered: Record<string, unknown> = { id }
  for (const key of Object.keys(slide)) {
    if (key === 'id') continue
    ordered[key] = (slide as Record<string, unknown>)[key]
  }
  return ordered as PresentationData['slides'][number]
}

function ensureSlideIds (deck: PresentationData): { deck: PresentationData; changed: boolean } {
  if (!deck.slides?.length) return { deck, changed: false }
  let changed = false
  const used = new Set<string>()
  const slides = deck.slides.map((slide) => {
    const hasUniqueId = Boolean(slide.id) && !used.has(slide.id as string)
    const id = hasUniqueId ? (slide.id as string) : generateSlideId(used)
    used.add(id)
    const firstKey = Object.keys(slide)[0]
    const needsReorder = firstKey !== 'id'
    if (!hasUniqueId || needsReorder) {
      changed = true
      return reorderSlideIdFirst(slide, id)
    }
    return slide
  })
  return changed ? { deck: { ...deck, slides }, changed } : { deck, changed }
}

function collectBlobUrlsFromDeck (deck: PresentationData | null): Set<string> {
  const urls = new Set<string>()
  if (!deck?.slides?.length) return urls

  for (const slide of deck.slides) {
    const backgroundSrc = slide.background?.src
    if (backgroundSrc?.startsWith('blob:')) urls.add(backgroundSrc)

    for (const element of slide.elements ?? []) {
      const src = element.src
      if (src?.startsWith('blob:')) urls.add(src)
    }
  }

  return urls
}

export default function App (): JSX.Element {
  const [jsonText, setJsonText] = useState(initialJson)
  const [customContentText, setCustomContentText] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(720)
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_LAYOUT_QUERY).matches
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplate?.id ?? ''
  )
  const deferredJsonText = useDeferredValue(jsonText)
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Resize state
  const [editorWidthPercent, setEditorWidthPercent] = useState(42)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const blobUrlRef = useRef<Set<string>>(new Set())

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(MOBILE_LAYOUT_QUERY)
    const syncLayoutMode = () => setIsMobileLayout(media.matches)
    syncLayoutMode()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncLayoutMode)
      return () => media.removeEventListener('change', syncLayoutMode)
    }

    media.addListener(syncLayoutMode)
    return () => media.removeListener(syncLayoutMode)
  }, [])

  function applyTemplate (templateId: string): void {
    const template = getTemplateOrFallback(templateId)
    if (!template) return
    setSelectedTemplateId(template.id)
    if (!customContentText) {
      setJsonText(JSON.stringify(template.data, null, 2))
      return
    }

    try {
      const generatedDeck = applyCustomContent(template.data, customContentText)
      setJsonText(JSON.stringify(generatedDeck, null, 2))
    } catch {
      setJsonText(JSON.stringify(template.data, null, 2))
      alert('Invalid custom content format.')
    }
  }

  function resetToOriginalTemplate (templateId: string): void {
    const template = getTemplateOrFallback(templateId)
    if (!template) return
    setSelectedTemplateId(template.id)
    setCustomContentText(null)
    setJsonText(JSON.stringify(template.data, null, 2))
  }

  // Handle preview width updates
  useEffect(() => {
    function updateWidth (): void {
      if (!previewRef.current) return
      const containerWidth = previewRef.current.clientWidth
      const gutter = isMobileLayout ? MOBILE_PREVIEW_GUTTER : PREVIEW_GUTTER
      const availableWidth = Math.max(
        MIN_PREVIEW_WIDTH,
        containerWidth - gutter
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
  }, [slideWidth, isMobileLayout])

  useEffect(() => {
    if (!deck || parsed.error) return
    const { deck: updated, changed } = ensureSlideIds(deck)
    if (!changed) return
    setJsonText(JSON.stringify(updated, null, 2))
  }, [deck, parsed.error])

  useEffect(() => {
    const nextUrls = collectBlobUrlsFromDeck(deck)

    for (const url of blobUrlRef.current) {
      if (!nextUrls.has(url)) {
        URL.revokeObjectURL(url)
      }
    }

    blobUrlRef.current = nextUrls
  }, [deck])

  useEffect(() => {
    return () => {
      for (const url of blobUrlRef.current) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  // Handle Split Resizing
  useEffect(() => {
    if (isMobileLayout) {
      if (isResizing) setIsResizing(false)
      return
    }
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
  }, [isMobileLayout, isResizing])

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
      const { blob, fileName } = await createPPTX(normalizedExport.deck)
      downloadBlob(blob, fileName)
    } finally {
      setIsExporting(false)
    }
  }

  function handleExportJson (): void {
    const fileName = `${deck?.title ?? 'json2ppt'}.json`
    buildDownload(jsonText, fileName)
  }

  function handleImportCustomContent (content: string): void {
    const current = safeParse(jsonText)
    if (!current.data) {
      alert('JSON parse error. Fix the JSON before applying custom content.')
      return
    }

    try {
      const generatedDeck = applyCustomContent(current.data, content)
      setCustomContentText(content)
      setJsonText(JSON.stringify(generatedDeck, null, 2))
    } catch {
      alert('Invalid custom content format.')
    }
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

  function handleApplyTheme (
    themeColors: string[],
    fontColor: string,
    backgroundColor: string,
    media: ThemeMediaPayload
  ): void {
    const current = safeParse(jsonText)
    if (!current.data) {
      alert('JSON parse error. Fix the JSON before applying theme.')
      return
    }
    const updated = applyCustomTheme(current.data, {
      themeColors,
      fontColor,
      backgroundColor,
      ...media
    })
    setJsonText(JSON.stringify(updated, null, 2))
  }

  return (
    <div className='min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:h-screen lg:px-6 lg:py-6'>
      <div className='mx-auto flex h-full min-h-0 flex-col gap-3 sm:gap-4 lg:gap-6'>
        <HeaderBar
          deck={deck}
          templates={templateList}
          selectedTemplateId={selectedTemplate?.id ?? ''}
          jsonError={parsed.error}
          onTemplateChange={applyTemplate}
          onResetTemplate={() =>
            resetToOriginalTemplate(selectedTemplate?.id ?? '')
          }
          onApplyTheme={handleApplyTheme}
        />

        <main
          ref={containerRef}
          className={`flex flex-1 min-h-0 ${
            isMobileLayout
              ? 'flex-col gap-4 overflow-y-auto overflow-x-hidden'
              : 'overflow-hidden'
          }`}
        >
          <div
            style={isMobileLayout ? undefined : { width: `${editorWidthPercent}%` }}
            className={`flex min-w-0 flex-col ${
              isMobileLayout ? 'h-[55vh] min-h-[320px]' : 'h-full'
            }`}
          >
            <EditorPanel
              value={jsonText}
              onChange={setJsonText}
              onImportCustomContent={handleImportCustomContent}
              onDownload={handleExportJson}
            />
          </div>

          {!isMobileLayout && (
            <div
              className='group relative z-10 flex w-6 flex-shrink-0 cursor-col-resize items-center justify-center hover:bg-black/5'
              onMouseDown={() => setIsResizing(true)}
              title='Drag to resize editor and preview panels'
              aria-label='Drag to resize editor and preview panels'
            >
              <div
                className={`h-8 w-1 rounded-full ${
                  isResizing ? 'bg-ember-500' : 'bg-ink-200'
                } transition-colors group-hover:bg-ember-500`}
              />
            </div>
          )}

          <div
            className={`flex min-w-0 flex-1 flex-col ${
              isMobileLayout ? 'min-h-[320px]' : 'h-full'
            }`}
          >
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
