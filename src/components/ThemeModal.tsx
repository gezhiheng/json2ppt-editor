import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Trash2, X } from 'lucide-react'

type ThemePreset = {
  id: string
  backgroundColor: string
  fontColor: string
  colors: [string, string, string, string, string, string]
}

const DEFAULT_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'preset-1',
    backgroundColor: '#EDEFF1',
    fontColor: '#101318',
    colors: ['#5B97C6', '#F07D31', '#9A9A9A', '#F4BE00', '#4B73B8', '#76B748']
  },
  {
    id: 'preset-2',
    backgroundColor: '#EDF0F1',
    fontColor: '#101318',
    colors: ['#90A95A', '#4E7B7B', '#4C6998', '#A84F3C', '#D08A34', '#D2B44C']
  },
  {
    id: 'preset-3',
    backgroundColor: '#EFF0EF',
    fontColor: '#101318',
    colors: ['#D7872D', '#AA542C', '#7A533D', '#8F7C59', '#AEBB7D', '#9AA677']
  },
  {
    id: 'preset-4',
    backgroundColor: '#EFF1F5',
    fontColor: '#101318',
    colors: ['#B8B9D6', '#123CA8', '#F5BE05', '#E77273', '#7A68CF', '#7C32E8']
  },
  {
    id: 'preset-5',
    backgroundColor: '#EEF0EF',
    fontColor: '#101318',
    colors: ['#84B63A', '#5D8D2A', '#DDBC5E', '#E28A3F', '#CA4528', '#8E8D65']
  },
  {
    id: 'preset-6',
    backgroundColor: '#ECEFEE',
    fontColor: '#101318',
    colors: ['#5D9CC8', '#4D78C5', '#71C4C3', '#5CB796', '#528F5A', '#7AA79C']
  },
  {
    id: 'preset-7',
    backgroundColor: '#D8D7BF',
    fontColor: '#4A3429',
    colors: ['#A74428', '#D38A33', '#A58A61', '#8B9A62', '#8EBA59', '#77A38A']
  },
  {
    id: 'preset-8',
    backgroundColor: '#344353',
    fontColor: '#E7EDF5',
    colors: ['#D22423', '#DB6A26', '#E9C53E', '#7FB6A0', '#5D78AA', '#8D69A9']
  },
  {
    id: 'preset-9',
    backgroundColor: '#3F2E57',
    fontColor: '#E9E6EE',
    colors: ['#B3276C', '#DA3D63', '#D9683D', '#E3C13E', '#7863CC', '#B73CC9']
  },
  {
    id: 'preset-10',
    backgroundColor: '#F1EEE7',
    fontColor: '#2E2620',
    colors: ['#C06E52', '#D89A5B', '#E5C97D', '#6E9B7D', '#4F789E', '#7A5D9A']
  },
  {
    id: 'preset-11',
    backgroundColor: '#457FBC',
    fontColor: '#E9F0F8',
    colors: ['#1A4478', '#972A9A', '#4C9A78', '#8BC043', '#E79022', '#C63422']
  },
  {
    id: 'preset-12',
    backgroundColor: '#1F2732',
    fontColor: '#EAF1F8',
    colors: ['#4DA3FF', '#14B8A6', '#7DD34E', '#F6C343', '#FF7A59', '#E94A67']
  }
]

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

  function applyThemePreset (preset: ThemePreset): void {
    setThemeColors([...preset.colors])
    setFontColor(preset.fontColor)
    setBackgroundColor(preset.backgroundColor)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-ink-900/40 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='relative my-4 flex max-h-[90vh] w-[min(80vw,860px)] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl'>
        <div className='sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/90 px-6 py-4 backdrop-blur'>
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

        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-6'>
          <div className='space-y-8'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-ink-700'>
                Default Theme Sets
              </p>
              <span className='text-xs text-ink-500'>
                Click a set to apply
              </span>
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
              {DEFAULT_THEME_PRESETS.map(preset => {
                const isSelected =
                  backgroundColor === preset.backgroundColor &&
                  fontColor === preset.fontColor &&
                  preset.colors.every(
                    (color, index) => themeColors[index] === color
                  )

                return (
                  <button
                    key={preset.id}
                    type='button'
                    onClick={() => applyThemePreset(preset)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'scale-[1.02] border-ember-700 ring-4 ring-ember-400/45 shadow-sharp'
                        : 'border-ink-200 hover:border-ink-300 hover:shadow-sm'
                    }`}
                    style={{ backgroundColor: preset.backgroundColor }}
                  >
                    <div className='flex items-start'>
                      <p
                        className='font-display text-lg leading-none'
                        style={{ color: preset.fontColor }}
                      >
                        Text Aa
                      </p>
                    </div>
                    <div className='mt-2.5 grid grid-cols-6 gap-1'>
                      {preset.colors.map(color => (
                        <span
                          key={`${preset.id}-${color}`}
                          className='h-4 rounded-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]'
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

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
        </div>

        <div className='sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-ink-100 bg-white/90 px-6 py-4 backdrop-blur'>
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
