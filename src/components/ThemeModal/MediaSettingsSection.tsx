import type { ChangeEvent, RefObject } from 'react'
import { ImagePlus } from 'lucide-react'
import { MediaScopeSelector } from './MediaScopeSelector'
import type {
  LogoPosition,
  MediaScope,
  MediaScopeKey,
  UploadedImage
} from './types'

const mediaFrameClass =
  'relative h-56 w-full max-w-[340px] overflow-hidden rounded-[28px] border border-dashed border-[#C3D4EA] bg-[#FBFDFF]'
const uploadMediaButtonClass =
  'flex h-56 w-full max-w-[340px] flex-col items-center justify-center gap-1.5 rounded-[28px] border border-dashed border-[#C3D4EA] bg-[#FBFDFF] text-[#62769A] transition hover:border-[#95B2D4]'
const removeMediaButtonClass =
  'absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-[#5E708F] shadow-sm backdrop-blur transition hover:bg-white'

type MediaSettingsSectionProps = {
  backgroundFileInputRef: RefObject<HTMLInputElement>
  logoFileInputRef: RefObject<HTMLInputElement>
  backgroundImage: UploadedImage | null
  logoImage: UploadedImage | null
  backgroundScope: MediaScope
  logoScope: MediaScope
  logoPosition: LogoPosition
  onBackgroundFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onLogoFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBackgroundImageRemove: () => void
  onLogoImageRemove: () => void
  onBackgroundScopeToggleAll: (checked: boolean) => void
  onBackgroundScopeChange: (key: MediaScopeKey, checked: boolean) => void
  onLogoScopeToggleAll: (checked: boolean) => void
  onLogoScopeChange: (key: MediaScopeKey, checked: boolean) => void
  onLogoPositionChange: (position: LogoPosition) => void
}

export function MediaSettingsSection ({
  backgroundFileInputRef,
  logoFileInputRef,
  backgroundImage,
  logoImage,
  backgroundScope,
  logoScope,
  logoPosition,
  onBackgroundFileChange,
  onLogoFileChange,
  onBackgroundImageRemove,
  onLogoImageRemove,
  onBackgroundScopeToggleAll,
  onBackgroundScopeChange,
  onLogoScopeToggleAll,
  onLogoScopeChange,
  onLogoPositionChange
}: MediaSettingsSectionProps): JSX.Element {
  return (
    <div className='flex gap-4 flex-row'>
      <div className='flex flex-1 min-w-0 flex-col gap-2.5'>
        <p className='text-sm font-semibold text-ink-800'>Background:</p>
        <div className='max-w-[680px] space-y-2.5'>
          <input
            type='file'
            ref={backgroundFileInputRef}
            accept='.jpg,.jpeg,.png,image/jpeg,image/png'
            className='hidden'
            onChange={onBackgroundFileChange}
          />
          {backgroundImage ? (
            <div className={mediaFrameClass}>
              <img
                src={backgroundImage.src}
                alt={backgroundImage.name}
                className='h-full w-full object-cover'
              />
              <button
                type='button'
                onClick={onBackgroundImageRemove}
                className={removeMediaButtonClass}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => backgroundFileInputRef.current?.click()}
              className={uploadMediaButtonClass}
            >
              <ImagePlus className='h-7 w-7' strokeWidth={1.5} />
              <span className='max-w-[85%] truncate text-base font-medium'>
                Upload background image
              </span>
            </button>
          )}
          <p className='text-xs text-[#8A9AB6]'>
            Supports JPG, JPEG, and PNG. Recommended size: 1920x1080 px.
            Max size: 10 MB.
          </p>

          <MediaScopeSelector
            scope={backgroundScope}
            scopeKeyPrefix='background-scope'
            onToggleAll={onBackgroundScopeToggleAll}
            onToggleScope={onBackgroundScopeChange}
          />
        </div>
      </div>

      <div className='flex flex-1 min-w-0 flex-col gap-2.5'>
        <p className='text-sm font-semibold text-ink-800'>Logo:</p>
        <div className='max-w-[680px] space-y-2.5'>
          <input
            type='file'
            ref={logoFileInputRef}
            accept='.png,image/png'
            className='hidden'
            onChange={onLogoFileChange}
          />
          {logoImage ? (
            <div className={mediaFrameClass}>
              <img
                src={logoImage.src}
                alt={logoImage.name}
                className='h-full w-full object-contain p-4'
              />
              <button
                type='button'
                onClick={onLogoImageRemove}
                className={removeMediaButtonClass}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => logoFileInputRef.current?.click()}
              className={uploadMediaButtonClass}
            >
              <ImagePlus className='h-7 w-7' strokeWidth={1.5} />
              <span className='max-w-[85%] truncate text-base font-medium'>
                Upload logo
              </span>
            </button>
          )}
          <p className='text-xs text-[#8A9AB6]'>
            Supports PNG. Max size: 500x200 px.
          </p>

          <MediaScopeSelector
            scope={logoScope}
            scopeKeyPrefix='logo-scope'
            onToggleAll={onLogoScopeToggleAll}
            onToggleScope={onLogoScopeChange}
          />

          <div className='flex flex-wrap items-center gap-5 pt-0.5'>
            <label className='inline-flex items-center gap-2 text-xs font-medium text-ink-700'>
              <input
                type='radio'
                name='logo-position'
                className='h-4 w-4 accent-blue-600'
                checked={logoPosition === 'left'}
                onChange={() => onLogoPositionChange('left')}
              />
              Top-left
            </label>
            <label className='inline-flex items-center gap-2 text-xs font-medium text-ink-700'>
              <input
                type='radio'
                name='logo-position'
                className='h-4 w-4 accent-blue-600'
                checked={logoPosition === 'right'}
                onChange={() => onLogoPositionChange('right')}
              />
              Top-right
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
