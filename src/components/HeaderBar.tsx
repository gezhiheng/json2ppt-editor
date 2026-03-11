import { useEffect, useState } from 'react'
import { Button, buttonVariants } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { Github, LayoutTemplate, Palette, RotateCcw } from 'lucide-react'
import type { PresentationData } from '../types/ppt'
import { ThemeModal } from './ThemeModal'
import type { MediaScope, MediaScopeKey, ThemeMediaPayload } from './ThemeModal/types'
import { cn } from '../lib/utils'

type TemplateEntry = {
  id: string
  name: string
}

type HeaderBarProps = {
  deck: PresentationData | null
  templates: TemplateEntry[]
  selectedTemplateId: string
  jsonError: string
  onTemplateChange: (templateId: string) => void
  onResetTemplate: () => void
  onApplyTheme: (
    themeColors: string[],
    fontColor: string,
    backgroundColor: string,
    media: ThemeMediaPayload
  ) => void
}

type MediaCandidate = {
  src: string
  count: number
  scope: Set<MediaScopeKey>
  leftVotes: number
  rightVotes: number
  width?: number
  height?: number
}

const EMPTY_SCOPE: MediaScope = {
  cover: false,
  contents: false,
  transition: false,
  content: false,
  end: false
}

export function HeaderBar ({
  templates,
  selectedTemplateId,
  jsonError,
  deck,
  onTemplateChange,
  onResetTemplate,
  onApplyTheme
}: HeaderBarProps): JSX.Element {
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [themeColors, setThemeColors] = useState<string[]>([])
  const [fontColor, setFontColor] = useState('#333333')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [media, setMedia] = useState<ThemeMediaPayload>({})

  const isThemeDisabled = !deck || Boolean(jsonError)
  const commonTriggerClass =
    'border border-ink-200 bg-white/80 text-ink-900 shadow-soft hover:bg-white'

  useEffect(() => {
    if (isThemeOpen || !deck) return
    const nextThemeColors = (deck.theme?.themeColors ?? []).slice(0, 6)
    setThemeColors(nextThemeColors)
    setFontColor(deck.theme?.fontColor ?? '#333333')
    setBackgroundColor(deck.theme?.backgroundColor ?? '#FFFFFF')
    setMedia(extractThemeMedia(deck))
  }, [deck, isThemeOpen])

  function openThemeModal (): void {
    if (!deck) return
    const nextThemeColors = (deck.theme?.themeColors ?? []).slice(0, 6)
    setThemeColors(nextThemeColors)
    setFontColor(deck.theme?.fontColor ?? '#333333')
    setBackgroundColor(deck.theme?.backgroundColor ?? '#FFFFFF')
    setMedia(extractThemeMedia(deck))
    setIsThemeOpen(true)
  }

  function applyTheme (
    nextThemeColors: string[],
    nextFontColor: string,
    nextBackgroundColor: string,
    nextMedia: ThemeMediaPayload
  ): void {
    onApplyTheme(nextThemeColors, nextFontColor, nextBackgroundColor, nextMedia)
    const syncedMedia: ThemeMediaPayload = {}
    if (nextMedia.backgroundImage) syncedMedia.backgroundImage = nextMedia.backgroundImage
    if (nextMedia.logoImage) syncedMedia.logoImage = nextMedia.logoImage
    setMedia(syncedMedia)
    setIsThemeOpen(false)
  }

  return (
    <>
      <header className='flex flex-col gap-4 rounded-xl border border-white/70 bg-white/70 p-4 shadow-soft backdrop-blur sm:p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6'>
        <div className='flex flex-col gap-2'>
          <h1 className='font-display text-2xl leading-tight text-ink-900 sm:text-3xl lg:text-4xl'>
            Live JSON <span className='text-ember-500'>to</span> PPTX editor
          </h1>
        </div>
        <div className='flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:justify-end'>
          <Button
            onClick={openThemeModal}
            variant='secondary'
            className={cn('w-full justify-center gap-2 sm:w-auto', commonTriggerClass)}
            disabled={isThemeDisabled}
            title='Open theme settings'
            aria-label='Open theme settings'
          >
            <Palette className='h-4 w-4' />
            Theme
          </Button>
          <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
            <SelectTrigger
              className={cn('w-full tracking-wider sm:w-auto', commonTriggerClass)}
              title='Choose a template'
              aria-label='Choose a template'
            >
              <div className='flex items-center gap-2'>
                <LayoutTemplate className='h-4 w-4' />
                <SelectValue placeholder='Choose' />
              </div>
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem
                  className='tracking-wider'
                  key={template.id}
                  value={template.id}
                >
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onResetTemplate}
            variant='secondary'
            size='icon'
            className={commonTriggerClass}
            title='Reset to original template'
            aria-label='Reset to original template'
          >
            <RotateCcw className='h-4 w-4' />
          </Button>
          <a
            href='https://github.com/gezhiheng/json2ppt-editor'
            target='_blank'
            rel='noopener noreferrer'
            title='Open project repository on GitHub'
            aria-label='Open project repository on GitHub'
            className={buttonVariants({
              variant: 'secondary',
              size: 'icon',
              className: commonTriggerClass
            })}
          >
            <Github className='h-4 w-4' />
          </a>
        </div>
      </header>

      <ThemeModal
        isOpen={isThemeOpen}
        initialThemeColors={themeColors}
        initialFontColor={fontColor}
        initialBackgroundColor={backgroundColor}
        initialMedia={media}
        jsonError={jsonError}
        onClose={() => setIsThemeOpen(false)}
        onApply={applyTheme}
      />
    </>
  )
}

function extractThemeMedia (deck: PresentationData): ThemeMediaPayload {
  const backgroundCandidates = collectMediaCandidates(deck, 'background')
  const logoCandidates = collectMediaCandidates(deck, 'logo')

  const background = pickTopCandidate(backgroundCandidates)
  const logo = pickTopCandidate(logoCandidates)

  const result: ThemeMediaPayload = {}

  if (background) {
    result.backgroundImage = {
      src: background.src,
      scope: buildScopeRecord(background.scope),
      width: background.width,
      height: background.height
    }
  }

  if (logo) {
    result.logoImage = {
      src: logo.src,
      scope: buildScopeRecord(logo.scope),
      position: logo.leftVotes >= logo.rightVotes ? 'left' : 'right',
      width: logo.width,
      height: logo.height
    }
  }

  return result
}

function collectMediaCandidates (
  deck: PresentationData,
  imageType: 'background' | 'logo'
): Map<string, MediaCandidate> {
  const candidates = new Map<string, MediaCandidate>()
  const slideWidth = deck.width ?? 1000

  for (const slide of deck.slides ?? []) {
    const scopeKey = mapSlideTypeToScopeKey(slide.type)
    if (!scopeKey) continue

    for (const element of slide.elements ?? []) {
      if (element.type !== 'image' || element.imageType !== imageType || !element.src) {
        continue
      }

      let candidate = candidates.get(element.src)
      if (!candidate) {
        candidate = {
          src: element.src,
          count: 0,
          scope: new Set<MediaScopeKey>(),
          leftVotes: 0,
          rightVotes: 0,
          width: element.width,
          height: element.height
        }
        candidates.set(element.src, candidate)
      }

      candidate.count += 1
      candidate.scope.add(scopeKey)

      if (imageType === 'logo') {
        if (inferLogoPosition(element.left, element.width, slideWidth) === 'left') {
          candidate.leftVotes += 1
        } else {
          candidate.rightVotes += 1
        }
      }
    }
  }

  return candidates
}

function pickTopCandidate (
  candidates: Map<string, MediaCandidate>
): MediaCandidate | undefined {
  const values = [...candidates.values()]
  if (!values.length) return undefined
  values.sort((a, b) => b.count - a.count)
  return values[0]
}

function buildScopeRecord (scopeSet: Set<MediaScopeKey>): MediaScope {
  return {
    ...EMPTY_SCOPE,
    cover: scopeSet.has('cover'),
    contents: scopeSet.has('contents'),
    transition: scopeSet.has('transition'),
    content: scopeSet.has('content'),
    end: scopeSet.has('end')
  }
}

function mapSlideTypeToScopeKey (type?: string): MediaScopeKey | null {
  const normalized = type?.trim().toLowerCase()
  if (!normalized) return null

  if (normalized === 'cover') return 'cover'
  if (normalized === 'contents' || normalized === 'agenda') return 'contents'
  if (normalized === 'transition' || normalized === 'section') return 'transition'
  if (normalized === 'content') return 'content'
  if (normalized === 'end' || normalized === 'ending') return 'end'

  return null
}

function inferLogoPosition (
  left: number | undefined,
  width: number | undefined,
  slideWidth: number
): 'left' | 'right' {
  if (left === undefined) return 'right'
  if (width === undefined) {
    return left < slideWidth / 2 ? 'left' : 'right'
  }

  const centerX = left + width / 2
  return centerX < slideWidth / 2 ? 'left' : 'right'
}
