import type { MediaScope, MediaScopeOption, ThemePreset } from './types'

export const MEDIA_SCOPE_OPTIONS: MediaScopeOption[] = [
  { key: 'cover', label: 'Cover' },
  { key: 'contents', label: 'Contents' },
  { key: 'transition', label: 'Section' },
  { key: 'content', label: 'Content' },
  { key: 'end', label: 'End' }
]

export const DEFAULT_BACKGROUND_SCOPE: MediaScope = {
  cover: true,
  contents: true,
  transition: true,
  content: true,
  end: false
}

export const DEFAULT_LOGO_SCOPE: MediaScope = {
  cover: true,
  contents: false,
  transition: false,
  content: false,
  end: false
}

export const MAX_BACKGROUND_IMAGE_SIZE = 10 * 1024 * 1024

export const DEFAULT_THEME_PRESETS: ThemePreset[] = [
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
