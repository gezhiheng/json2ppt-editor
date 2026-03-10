import type { Dispatch, SetStateAction } from 'react'
import { MEDIA_SCOPE_OPTIONS } from './constants'
import type { MediaScope, MediaScopeKey } from './types'

export function updateMediaScope (
  setScope: Dispatch<SetStateAction<MediaScope>>,
  key: MediaScopeKey,
  checked: boolean
): void {
  setScope(current => ({
    ...current,
    [key]: checked
  }))
}

export function toggleAllMediaScope (
  setScope: Dispatch<SetStateAction<MediaScope>>,
  checked: boolean
): void {
  setScope({
    cover: checked,
    contents: checked,
    transition: checked,
    content: checked,
    end: checked
  })
}

export function isAllMediaScopeSelected (scope: MediaScope): boolean {
  return MEDIA_SCOPE_OPTIONS.every(option => scope[option.key])
}
