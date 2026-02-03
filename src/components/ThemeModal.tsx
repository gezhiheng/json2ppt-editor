import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Trash2, X } from 'lucide-react'

type ThemeModalProps = {
  isOpen: boolean
  initialThemeColors: string[]
  initialFontColor: string
  initialBackgroundColor: string
  jsonError: string
  onClose: () => void
  onApply: (
    themeColors: string[],
    fontColor: string,
    backgroundColor: string
  ) => void
}

export function ThemeModal ({
  isOpen,
  initialThemeColors,
  initialFontColor,
  initialBackgroundColor,
  jsonError,
  onClose,
  onApply
}: ThemeModalProps): JSX.Element | null {
  const [themeColors, setThemeColors] = useState<string[]>([])
  const [fontColor, setFontColor] = useState('#333333')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')

  useEffect(() => {
    if (!isOpen) return
    setThemeColors(initialThemeColors.slice(0, 6))
    setFontColor(initialFontColor || '#333333')
    setBackgroundColor(initialBackgroundColor || '#FFFFFF')
  }, [initialThemeColors, initialFontColor, initialBackgroundColor, isOpen])

  if (!isOpen) return null

  function addThemeColor (): void {
    setThemeColors(current =>
      current.length >= 6 ? current : [...current, '#000000']
    )
  }

  function removeThemeColor (index: number): void {
    setThemeColors(current => current.filter((_, idx) => idx !== index))
  }

  function updateThemeColor (index: number, value: string): void {
    setThemeColors(current =>
      current.map((color, idx) => (idx === index ? value : color))
    )
  }

  function applyTheme (): void {
    const normalizedColors = themeColors
      .map(color => normalizeThemeColor(color))
      .filter((color): color is string => Boolean(color))
      .slice(0, 6)
    const normalizedFontColor = normalizeThemeColor(fontColor) ?? '#333333'
    const normalizedBackgroundColor =
      normalizeThemeColor(backgroundColor) ?? '#FFFFFF'
    onApply(normalizedColors, normalizedFontColor, normalizedBackgroundColor)
    onClose()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-ink-900/40 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='relative w-[min(92vw,640px)] rounded-2xl border border-white/70 bg-white/95 p-6 shadow-2xl'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='mt-1 font-display text-2xl text-ink-900'>
              Custom Colors
            </h2>
          </div>
          <button
            className='rounded-full border border-ink-200 p-2 text-ink-600 transition hover:bg-ink-50'
            onClick={onClose}
            type='button'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='mt-6 space-y-8'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-ink-700'>
                Theme Colors (max 6)
              </p>
              <Button
                variant='ghost'
                size='sm'
                onClick={addThemeColor}
                disabled={themeColors.length >= 6}
              >
                Add color
              </Button>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {themeColors.length === 0 ? (
                <div className='rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-4 text-sm text-ink-500 sm:col-span-2'>
                  Add up to six theme colors to map across your slides.
                </div>
              ) : (
                themeColors.map((color, index) => {
                  const normalized = normalizePickerColor(color) ?? '#000000'
                  return (
                    <div
                      key={`theme-color-${index}`}
                      className='flex items-center gap-3 rounded-xl border border-ink-200 bg-white/70 px-3 py-2.5'
                    >
                      <div className='flex items-center gap-2'>
                        <label className='relative h-10 w-10 shrink-0 cursor-pointer'>
                          <input
                            type='color'
                            value={normalized}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              updateThemeColor(index, event.target.value)
                            }
                            className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
                          />
                          <span
                            className='block h-full w-full rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,15,15,0.12)]'
                            style={{ backgroundColor: normalized }}
                          />
                        </label>
                        <input
                          type='text'
                          value={color}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            updateThemeColor(index, event.target.value)
                          }
                          onBlur={(event: ChangeEvent<HTMLInputElement>) =>
                            updateThemeColor(
                              index,
                              normalizeHexColor(event.target.value) ?? color
                            )
                          }
                          className='h-10 w-[148px] rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800'
                        />
                      </div>
                      <button
                        type='button'
                        className='ml-auto flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600'
                        onClick={() => removeThemeColor(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className='space-y-3'>
            <p className='text-sm font-semibold text-ink-700'>Font Color</p>
            <div className='grid grid-cols-[auto,1fr] items-center gap-3 rounded-xl border border-ink-200 bg-white/70 p-3'>
              <label className='relative h-10 w-10 shrink-0 cursor-pointer'>
                <input
                  type='color'
                  value={normalizePickerColor(fontColor) ?? '#333333'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFontColor(event.target.value)
                  }
                  className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
                />
                <span
                  className='block h-full w-full rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,15,15,0.12)]'
                  style={{
                    backgroundColor:
                      normalizePickerColor(fontColor) ?? '#333333'
                  }}
                />
              </label>
              <div className='flex flex-wrap items-center gap-3'>
                <input
                  type='text'
                  value={fontColor}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFontColor(event.target.value)
                  }
                  onBlur={(event: ChangeEvent<HTMLInputElement>) =>
                    setFontColor(
                      normalizeHexColor(event.target.value) ?? fontColor
                    )
                  }
                  className='h-10 w-[160px] rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800'
                />
                <span className='text-xs text-ink-500'>
                  Applied to theme fontColor
                </span>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <p className='text-sm font-semibold text-ink-700'>
              Background Color
            </p>
            <div className='grid grid-cols-[auto,1fr] items-center gap-3 rounded-xl border border-ink-200 bg-white/70 p-3'>
              <label className='relative h-10 w-10 shrink-0 cursor-pointer'>
                <input
                  type='color'
                  value={normalizePickerColor(backgroundColor) ?? '#FFFFFF'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setBackgroundColor(event.target.value)
                  }
                  className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
                />
                <span
                  className='block h-full w-full rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,15,15,0.12)]'
                  style={{
                    backgroundColor:
                      normalizePickerColor(backgroundColor) ?? '#FFFFFF'
                  }}
                />
              </label>
              <div className='flex flex-wrap items-center gap-3'>
                <input
                  type='text'
                  value={backgroundColor}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setBackgroundColor(event.target.value)
                  }
                  onBlur={(event: ChangeEvent<HTMLInputElement>) =>
                    setBackgroundColor(
                      normalizeHexColor(event.target.value) ?? backgroundColor
                    )
                  }
                  className='h-10 w-[160px] rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800'
                />
                <span className='text-xs text-ink-500'>
                  Applied to theme backgroundColor
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-100 pt-4'>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={applyTheme} disabled={Boolean(jsonError)}>
            Apply to JSON
          </Button>
        </div>
      </div>
    </div>
  )
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
          .map(char => char + char)
          .join('')
      : withHash
  return `#${expanded.toUpperCase()}`
}

function normalizeThemeColor (value: string): string | null {
  const hex = normalizeHexColor(value)
  if (hex) return hex
  return normalizeRgbColor(value)
}

function normalizePickerColor (value: string): string | null {
  const hex = normalizeHexColor(value)
  if (hex) return hex
  const rgb = parseRgbColor(value)
  if (!rgb) return null
  const toHex = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function normalizeRgbColor (value: string): string | null {
  const parsed = parseRgbColor(value)
  if (!parsed) return null
  if (parsed.alpha !== undefined) {
    return `rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.alpha})`
  }
  return `rgb(${parsed.r},${parsed.g},${parsed.b})`
}

function parseRgbColor (
  value: string
): { r: number; g: number; b: number; alpha?: number } | null {
  const match = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)/i
  )
  if (!match) return null
  const r = Math.round(Number(match[1]))
  const g = Math.round(Number(match[2]))
  const b = Math.round(Number(match[3]))
  if (![r, g, b].every(channel => Number.isFinite(channel))) return null
  const alpha = match[4] !== undefined ? Number(match[4]) : undefined
  if (alpha !== undefined && Number.isFinite(alpha)) {
    return { r, g, b, alpha }
  }
  return { r, g, b }
}
