import type { ChangeEvent } from 'react'
import { normalizeHexColor, normalizePickerColor } from './color-utils'

type ColorSettingSectionProps = {
  title: string
  value: string
  fallbackColor: string
  helperText: string
  onChange: (value: string) => void
}

export function ColorSettingSection ({
  title,
  value,
  fallbackColor,
  helperText,
  onChange
}: ColorSettingSectionProps): JSX.Element {
  const pickerColor = normalizePickerColor(value) ?? fallbackColor

  function handleTextBlur (event: ChangeEvent<HTMLInputElement>): void {
    onChange(normalizeHexColor(event.target.value) ?? value)
  }

  return (
    <div className='space-y-3'>
      <p className='text-sm font-semibold text-ink-700'>{title}</p>
      <div className='grid grid-cols-[auto,1fr] items-center gap-3 rounded-xl border border-ink-200 bg-white/70 p-3'>
        <label className='relative h-10 w-10 shrink-0 cursor-pointer'>
          <input
            type='color'
            value={pickerColor}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange(event.target.value)
            }
            className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
          />
          <span
            className='block h-full w-full rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,15,15,0.12)]'
            style={{ backgroundColor: pickerColor }}
          />
        </label>
        <div className='flex flex-wrap items-center gap-3'>
          <input
            type='text'
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange(event.target.value)
            }
            onBlur={handleTextBlur}
            className='h-10 w-[160px] rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800'
          />
          <span className='text-xs text-ink-500'>{helperText}</span>
        </div>
      </div>
    </div>
  )
}
