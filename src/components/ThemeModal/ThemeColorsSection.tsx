import type { ChangeEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { normalizeHexColor, normalizePickerColor } from './color-utils'

type ThemeColorsSectionProps = {
  themeColors: string[]
  onAddThemeColor: () => void
  onRemoveThemeColor: (index: number) => void
  onUpdateThemeColor: (index: number, value: string) => void
}

export function ThemeColorsSection ({
  themeColors,
  onAddThemeColor,
  onRemoveThemeColor,
  onUpdateThemeColor
}: ThemeColorsSectionProps): JSX.Element {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-semibold text-ink-700'>Theme Colors (max 6)</p>
        <Button
          variant='ghost'
          size='sm'
          onClick={onAddThemeColor}
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
                        onUpdateThemeColor(index, event.target.value)
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
                      onUpdateThemeColor(index, event.target.value)
                    }
                    onBlur={(event: ChangeEvent<HTMLInputElement>) =>
                      onUpdateThemeColor(
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
                  onClick={() => onRemoveThemeColor(index)}
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
