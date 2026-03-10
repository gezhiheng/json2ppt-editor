import { DEFAULT_THEME_PRESETS } from './constants'
import type { ThemePreset } from './types'

type ThemePresetSectionProps = {
  themeColors: string[]
  fontColor: string
  backgroundColor: string
  onApplyThemePreset: (preset: ThemePreset) => void
}

function isPresetSelected (
  preset: ThemePreset,
  themeColors: string[],
  fontColor: string,
  backgroundColor: string
): boolean {
  return (
    backgroundColor === preset.backgroundColor &&
    fontColor === preset.fontColor &&
    preset.colors.every((color, index) => themeColors[index] === color)
  )
}

export function ThemePresetSection ({
  themeColors,
  fontColor,
  backgroundColor,
  onApplyThemePreset
}: ThemePresetSectionProps): JSX.Element {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-semibold text-ink-700'>Default Theme Sets</p>
        <span className='text-xs text-ink-500'>Click a set to apply</span>
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
        {DEFAULT_THEME_PRESETS.map(preset => {
          const selected = isPresetSelected(
            preset,
            themeColors,
            fontColor,
            backgroundColor
          )

          return (
            <button
              key={preset.id}
              type='button'
              onClick={() => onApplyThemePreset(preset)}
              className={`rounded-xl border p-2.5 text-left transition ${
                selected
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
  )
}
