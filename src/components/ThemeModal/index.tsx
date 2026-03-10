import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { ColorSettingSection } from './ColorSettingSection'
import {
  DEFAULT_BACKGROUND_SCOPE,
  DEFAULT_LOGO_SCOPE,
  MAX_BACKGROUND_IMAGE_SIZE
} from './constants'
import { MediaSettingsSection } from './MediaSettingsSection'
import { toggleAllMediaScope, updateMediaScope } from './media-scope-utils'
import { normalizeThemeColor } from './color-utils'
import { ThemeColorsSection } from './ThemeColorsSection'
import { ThemePresetSection } from './ThemePresetSection'
import type {
  LogoPosition,
  MediaScope,
  ThemeMediaPayload,
  ThemeModalProps,
  ThemePreset,
  UploadedImage
} from './types'

export function ThemeModal ({
  isOpen,
  initialThemeColors,
  initialFontColor,
  initialBackgroundColor,
  initialMedia,
  jsonError,
  onClose,
  onApply
}: ThemeModalProps): JSX.Element | null {
  const [themeColors, setThemeColors] = useState<string[]>([])
  const [fontColor, setFontColor] = useState('#333333')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [backgroundImage, setBackgroundImage] = useState<UploadedImage | null>(null)
  const [logoImage, setLogoImage] = useState<UploadedImage | null>(null)
  const [backgroundScope, setBackgroundScope] = useState<MediaScope>({
    ...DEFAULT_BACKGROUND_SCOPE
  })
  const [logoScope, setLogoScope] = useState<MediaScope>({ ...DEFAULT_LOGO_SCOPE })
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('right')
  const backgroundFileInputRef = useRef<HTMLInputElement>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setThemeColors(initialThemeColors.slice(0, 6))
    setFontColor(initialFontColor || '#333333')
    setBackgroundColor(initialBackgroundColor || '#FFFFFF')
    setBackgroundImage(
      initialMedia.backgroundImage
        ? {
            name: getImageName(initialMedia.backgroundImage.src),
            src: initialMedia.backgroundImage.src,
            width: initialMedia.backgroundImage.width,
            height: initialMedia.backgroundImage.height
          }
        : null
    )
    setLogoImage(
      initialMedia.logoImage
        ? {
            name: getImageName(initialMedia.logoImage.src),
            src: initialMedia.logoImage.src,
            width: initialMedia.logoImage.width,
            height: initialMedia.logoImage.height
          }
        : null
    )
    setBackgroundScope(
      normalizeScope(initialMedia.backgroundImage?.scope, DEFAULT_BACKGROUND_SCOPE)
    )
    setLogoScope(normalizeScope(initialMedia.logoImage?.scope, DEFAULT_LOGO_SCOPE))
    setLogoPosition(initialMedia.logoImage?.position ?? 'right')
  }, [
    initialThemeColors,
    initialFontColor,
    initialBackgroundColor,
    initialMedia,
    isOpen
  ])

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

    const media: ThemeMediaPayload = {}
    if (backgroundImage) {
      media.backgroundImage = {
        src: backgroundImage.src,
        scope: { ...backgroundScope },
        width: backgroundImage.width,
        height: backgroundImage.height
      }
    }
    if (logoImage) {
      media.logoImage = {
        src: logoImage.src,
        scope: { ...logoScope },
        position: logoPosition,
        width: logoImage.width,
        height: logoImage.height
      }
    }
    if (initialMedia.backgroundImage && !backgroundImage) {
      media.clearBackgroundImage = true
      media.clearLogoImage = true
    } else if (initialMedia.logoImage && !logoImage) {
      media.clearLogoImage = true
    }

    onApply(normalizedColors, normalizedFontColor, normalizedBackgroundColor, media)
    onClose()
  }

  function applyThemePreset (preset: ThemePreset): void {
    setThemeColors([...preset.colors])
    setFontColor(preset.fontColor)
    setBackgroundColor(preset.backgroundColor)
  }

  async function handleBackgroundFileChange (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
    const hasAllowedExt =
      name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')

    if (!isImage && !hasAllowedExt) {
      alert('背景图仅支持 JPG / JPEG / PNG 格式。')
      event.target.value = ''
      return
    }

    if (file.size > MAX_BACKGROUND_IMAGE_SIZE) {
      alert('背景图大小不能超过 10MB。')
      event.target.value = ''
      return
    }

    const src = URL.createObjectURL(file)
    const dimensions = await getImageDimensions(src)
    setBackgroundImage({
      name: file.name,
      src,
      width: dimensions?.width,
      height: dimensions?.height
    })
    event.target.value = ''
  }

  async function handleLogoFileChange (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    const isPng = file.type === 'image/png' || name.endsWith('.png')
    if (!isPng) {
      alert('LOGO 仅支持 PNG 格式。')
      event.target.value = ''
      return
    }

    const src = URL.createObjectURL(file)
    const dimensions = await getImageDimensions(src)
    setLogoImage({
      name: file.name,
      src,
      width: dimensions?.width,
      height: dimensions?.height
    })
    event.target.value = ''
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
              Custom PPTX
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
            <MediaSettingsSection
              backgroundFileInputRef={backgroundFileInputRef}
              logoFileInputRef={logoFileInputRef}
              backgroundImage={backgroundImage}
              logoImage={logoImage}
              backgroundScope={backgroundScope}
              logoScope={logoScope}
              logoPosition={logoPosition}
              onBackgroundFileChange={handleBackgroundFileChange}
              onLogoFileChange={handleLogoFileChange}
              onBackgroundImageRemove={() => {
                setBackgroundImage(null)
                setLogoImage(null)
              }}
              onLogoImageRemove={() => setLogoImage(null)}
              onBackgroundScopeToggleAll={checked =>
                toggleAllMediaScope(setBackgroundScope, checked)
              }
              onBackgroundScopeChange={(key, checked) =>
                updateMediaScope(setBackgroundScope, key, checked)
              }
              onLogoScopeToggleAll={checked =>
                toggleAllMediaScope(setLogoScope, checked)
              }
              onLogoScopeChange={(key, checked) =>
                updateMediaScope(setLogoScope, key, checked)
              }
              onLogoPositionChange={setLogoPosition}
            />

            <ThemePresetSection
              themeColors={themeColors}
              fontColor={fontColor}
              backgroundColor={backgroundColor}
              onApplyThemePreset={applyThemePreset}
            />

            <ThemeColorsSection
              themeColors={themeColors}
              onAddThemeColor={addThemeColor}
              onRemoveThemeColor={removeThemeColor}
              onUpdateThemeColor={updateThemeColor}
            />

            <ColorSettingSection
              title='Font Color'
              value={fontColor}
              fallbackColor='#333333'
              helperText='Applied to theme fontColor'
              onChange={setFontColor}
            />

            <ColorSettingSection
              title='Background Color'
              value={backgroundColor}
              fallbackColor='#FFFFFF'
              helperText='Applied to theme backgroundColor'
              onChange={setBackgroundColor}
            />
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

function normalizeScope (
  scope: MediaScope | undefined,
  fallback: MediaScope
): MediaScope {
  if (!scope) return { ...fallback }
  return {
    cover: Boolean(scope.cover),
    contents: Boolean(scope.contents),
    transition: Boolean(scope.transition),
    content: Boolean(scope.content),
    end: Boolean(scope.end)
  }
}

function getImageName (src: string): string {
  if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
    return 'uploaded-image'
  }

  try {
    const url = new URL(src)
    const name = url.pathname.split('/').pop()
    if (!name) return 'uploaded-image'
    return decodeURIComponent(name)
  } catch {
    const name = src.split('/').pop()
    return name || 'uploaded-image'
  }
}

async function getImageDimensions (
  src: string
): Promise<{ width: number; height: number } | null> {
  return await new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      })
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}
