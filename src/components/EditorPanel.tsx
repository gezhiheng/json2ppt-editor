import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Download, Pipette, Sparkles, Upload } from 'lucide-react'
import { Button } from './ui/button'

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 12,
  lineHeight: 20,
  wordWrap: 'off',
  scrollBeyondLastLine: false,
  automaticLayout: true
} as const

type EditorPanelProps = {
  value: string
  onChange: (nextValue: string) => void
  onDownload?: () => void
}

export function EditorPanel ({
  value,
  onChange,
  onDownload
}: EditorPanelProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFormat () {
    try {
      const obj = JSON.parse(value)
      const formatted = JSON.stringify(obj, null, 2)
      onChange(formatted)
    } catch {
      // Ignore parse errors
    }
  }

  function handleImportClick () {
    fileInputRef.current?.click()
  }

  function handleExtractTheme () {
    try {
      const deck = JSON.parse(value)
      const { themeColors, backgroundColor } = extractThemeFromDeck(deck)
      const nextTheme = {
        ...(deck.theme ?? {}),
        themeColors
      }
      if (backgroundColor) nextTheme.backgroundColor = backgroundColor
      const nextDeck = { ...deck, theme: nextTheme }
      onChange(JSON.stringify(nextDeck, null, 2))
    } catch {
      // Ignore parse errors
    }
  }

  function handleFileChange (event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result
      if (typeof content === 'string') {
        onChange(content)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section className='h-full flex min-h-0 flex-col rounded-xl border border-ink-200/60 bg-[#1f1b16] p-5 shadow-sharp'>
      <input
        type='file'
        ref={fileInputRef}
        className='hidden'
        accept='.json,application/json'
        onChange={handleFileChange}
      />
      <div className='flex items-center justify-between'>
        <h2 className='font-display text-lg text-white'>JSON Editor</h2>
        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
            onClick={handleExtractTheme}
            title='Extract theme colors'
          >
            <Pipette className='h-4 w-4' />
            <span className='sr-only'>Extract theme colors</span>
          </Button>
          <Button
            variant='secondary'
            size='sm'
            className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
            onClick={handleFormat}
            title='Format JSON'
          >
            <Sparkles className='h-4 w-4' />
            <span className='sr-only'>Format</span>
          </Button>
          <Button
            variant='secondary'
            size='sm'
            className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
            onClick={handleImportClick}
            title='Upload JSON'
          >
            <Upload className='h-4 w-4' />
            <span className='sr-only'>Upload</span>
          </Button>
          {onDownload && (
            <Button
              variant='secondary'
              size='sm'
              className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
              onClick={onDownload}
              title='Download JSON'
            >
              <Download className='h-4 w-4' />
              <span className='sr-only'>Download</span>
            </Button>
          )}
        </div>
      </div>
      <div className='mt-4 h-full border border-white/10'>
        <Editor
          height='100%'
          defaultLanguage='json'
          theme='vs-dark'
          value={value}
          onChange={next => onChange(next ?? '')}
          options={editorOptions}
        />
      </div>
    </section>
  )
}

type ColorValue = {
  r: number
  g: number
  b: number
  alpha?: number
}

function extractThemeFromDeck (deck: any): {
  themeColors: string[]
  backgroundColor?: string
} {
  const slides = Array.isArray(deck?.slides) ? deck.slides : []
  let backgroundColor: string | undefined

  for (const slide of slides) {
    if (backgroundColor) break
    const normalized = normalizeColor(slide?.background?.color)
    if (normalized) backgroundColor = normalized
  }

  const themeColors: string[] = []
  const seen = new Set<string>()

  const pushColor = (raw: string) => {
    if (themeColors.length >= 6) return
    const normalized = normalizeColor(raw)
    if (!normalized) return
    if (backgroundColor && colorsMatch(normalized, backgroundColor)) return
    const key = colorKey(normalized)
    if (seen.has(key)) return
    seen.add(key)
    themeColors.push(normalized)
  }

  for (const slide of slides) {
    if (themeColors.length >= 6) break
    if (slide && typeof slide === 'object') {
      const { background, ...rest } = slide as Record<string, unknown>
      walkForColors(rest, pushColor)
    } else {
      walkForColors(slide, pushColor)
    }
  }

  return { themeColors, backgroundColor }
}

function walkForColors (
  value: unknown,
  pushColor: (color: string) => void
): void {
  if (!value) return
  if (typeof value === 'string') {
    const matches = extractColorsFromString(value)
    for (const match of matches) pushColor(match)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) walkForColors(item, pushColor)
    return
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      walkForColors(item, pushColor)
    }
  }
}

function extractColorsFromString (value: string): string[] {
  const matches = value.match(
    /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\([^)]*\)/g
  )
  return matches ?? []
}

function normalizeColor (value: string | undefined): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null
  const hex = normalizeHexColor(raw)
  if (hex) {
    const rgb = hexToRgb(hex)
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`
  }
  const rgba = parseRgbString(raw)
  if (!rgba) return null
  if (rgba.alpha !== undefined) {
    return `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.alpha})`
  }
  return `rgb(${rgba.r},${rgba.g},${rgba.b})`
}

function normalizeHexColor (value: string): string | null {
  const raw = value.trim()
  const withHash = raw.startsWith('#') ? raw.slice(1) : raw
  if (withHash.length !== 3 && withHash.length !== 6) return null
  if (!/^[0-9a-fA-F]+$/.test(withHash)) return null
  const expanded =
    withHash.length === 3
      ? withHash
          .split('')
          .map((char) => char + char)
          .join('')
      : withHash
  return `#${expanded.toUpperCase()}`
}

function hexToRgb (value: string): ColorValue {
  const raw = value.startsWith('#') ? value.slice(1) : value
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16)
  }
}

function parseRgbString (value: string): ColorValue | null {
  const match = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)/i
  )
  if (!match) return null
  const r = Math.round(Number(match[1]))
  const g = Math.round(Number(match[2]))
  const b = Math.round(Number(match[3]))
  if (![r, g, b].every((channel) => Number.isFinite(channel))) return null
  const alpha = match[4] !== undefined ? Number(match[4]) : undefined
  if (alpha !== undefined && Number.isFinite(alpha)) {
    return { r, g, b, alpha }
  }
  return { r, g, b }
}

function colorKey (value: string): string {
  const parsed = parseRgbString(value)
  if (parsed) {
    return `${parsed.r},${parsed.g},${parsed.b},${parsed.alpha ?? 'none'}`
  }
  const hex = normalizeHexColor(value)
  if (hex) return hex
  return value.trim().toLowerCase()
}

function colorsMatch (a: string, b: string): boolean {
  return colorKey(a) === colorKey(b)
}
