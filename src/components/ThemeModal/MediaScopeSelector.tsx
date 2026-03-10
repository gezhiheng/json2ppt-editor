import type { ChangeEvent } from 'react'
import { MEDIA_SCOPE_OPTIONS } from './constants'
import { isAllMediaScopeSelected } from './media-scope-utils'
import type { MediaScope, MediaScopeKey } from './types'

type MediaScopeSelectorProps = {
  scope: MediaScope
  scopeKeyPrefix: string
  onToggleAll: (checked: boolean) => void
  onToggleScope: (key: MediaScopeKey, checked: boolean) => void
}

export function MediaScopeSelector ({
  scope,
  scopeKeyPrefix,
  onToggleAll,
  onToggleScope
}: MediaScopeSelectorProps): JSX.Element {
  function handleToggleAllChange (event: ChangeEvent<HTMLInputElement>): void {
    onToggleAll(event.target.checked)
  }

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5'>
      <label className='inline-flex items-center gap-2 text-xs font-medium text-ink-700'>
        <input
          type='checkbox'
          className='h-4 w-4 accent-blue-600'
          checked={isAllMediaScopeSelected(scope)}
          onChange={handleToggleAllChange}
        />
        All
      </label>
      {MEDIA_SCOPE_OPTIONS.map(option => (
        <label
          key={`${scopeKeyPrefix}-${option.key}`}
          className='inline-flex items-center gap-2 text-xs font-medium text-ink-700'
        >
          <input
            type='checkbox'
            className='h-4 w-4 accent-blue-600'
            checked={scope[option.key]}
            onChange={event => onToggleScope(option.key, event.target.checked)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
