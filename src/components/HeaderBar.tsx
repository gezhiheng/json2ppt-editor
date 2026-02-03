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
import type { Deck } from '../types/ppt'
import { ThemeModal } from './ThemeModal'
import { cn } from '../lib/utils'

type TemplateEntry = {
  id: string
  name: string
}

type HeaderBarProps = {
  deck: Deck | null
  templates: TemplateEntry[]
  selectedTemplateId: string
  jsonError: string
  onTemplateChange: (templateId: string) => void
  onResetTemplate: () => void
  onApplyTheme: (
    themeColors: string[],
    fontColor: string,
    backgroundColor: string
  ) => void
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

  const isThemeDisabled = !deck || Boolean(jsonError)
  const commonTriggerClass =
    'border border-ink-200 bg-white/80 text-ink-900 shadow-soft hover:bg-white'

  useEffect(() => {
    if (isThemeOpen || !deck) return
    const nextThemeColors = (deck.theme?.themeColors ?? []).slice(0, 6)
    setThemeColors(nextThemeColors)
    setFontColor(deck.theme?.fontColor ?? '#333333')
    setBackgroundColor(deck.theme?.backgroundColor ?? '#FFFFFF')
  }, [deck, isThemeOpen])

  function openThemeModal (): void {
    if (!deck) return
    const nextThemeColors = (deck.theme?.themeColors ?? []).slice(0, 6)
    setThemeColors(nextThemeColors)
    setFontColor(deck.theme?.fontColor ?? '#333333')
    setBackgroundColor(deck.theme?.backgroundColor ?? '#FFFFFF')
    setIsThemeOpen(true)
  }

  function applyTheme (
    nextThemeColors: string[],
    nextFontColor: string,
    nextBackgroundColor: string
  ): void {
    onApplyTheme(nextThemeColors, nextFontColor, nextBackgroundColor)
    setIsThemeOpen(false)
  }

  return (
    <>
      <header className='flex flex-row justify-between rounded-xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur'>
        <div className='flex flex-col gap-2'>
          <h1 className='font-display text-3xl text-ink-900 md:text-4xl'>
            Live JSON <span className='text-ember-500'>to</span> PPTX editor
          </h1>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Button
            onClick={openThemeModal}
            variant='secondary'
            className={cn('gap-2', commonTriggerClass)}
            disabled={isThemeDisabled}
          >
            <Palette className='h-4 w-4' />
            Theme
          </Button>
          <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
            <SelectTrigger className={cn('tracking-wider', commonTriggerClass)}>
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
          >
            <RotateCcw className='h-4 w-4' />
          </Button>
          <a
            href='https://github.com/gezhiheng/json2ppt-editor'
            target='_blank'
            rel='noopener noreferrer'
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
        jsonError={jsonError}
        onClose={() => setIsThemeOpen(false)}
        onApply={applyTheme}
      />
    </>
  )
}
