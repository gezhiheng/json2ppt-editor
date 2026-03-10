export type ThemePreset = {
  id: string
  backgroundColor: string
  fontColor: string
  colors: [string, string, string, string, string, string]
}

export type MediaScopeKey = 'cover' | 'contents' | 'transition' | 'content' | 'end'

export type MediaScope = Record<MediaScopeKey, boolean>

export type MediaScopeOption = {
  key: MediaScopeKey
  label: string
}

export type LogoPosition = 'left' | 'right'

export type UploadedImage = {
  name: string
  src: string
  width?: number
  height?: number
}

export type ThemeMediaAsset = {
  src: string
  scope: MediaScope
  width?: number
  height?: number
}

export type ThemeLogoAsset = ThemeMediaAsset & {
  position: LogoPosition
}

export type ThemeMediaPayload = {
  backgroundImage?: ThemeMediaAsset
  logoImage?: ThemeLogoAsset
  clearBackgroundImage?: boolean
  clearLogoImage?: boolean
}

export type ThemeModalProps = {
  isOpen: boolean
  initialThemeColors: string[]
  initialFontColor: string
  initialBackgroundColor: string
  initialMedia: ThemeMediaPayload
  jsonError: string
  onClose: () => void
  onApply: (
    themeColors: string[],
    fontColor: string,
    backgroundColor: string,
    media: ThemeMediaPayload
  ) => void
}
