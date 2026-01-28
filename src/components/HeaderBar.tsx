import { Button, buttonVariants } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { LayoutTemplate, RotateCcw, Github } from 'lucide-react'
import type { Deck } from '../types/ppt'

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
}

export function HeaderBar ({
  templates,
  selectedTemplateId,
  onTemplateChange,
  onResetTemplate
}: HeaderBarProps): JSX.Element {
  return (
    <header className='flex flex-row justify-between rounded-xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur'>
      <div className='flex flex-col gap-2'>
        <h1 className='font-display text-3xl text-ink-900 md:text-4xl'>
          Live JSON <span className='text-ember-500'>to</span> PPTX editor
        </h1>
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
          <SelectTrigger className='tracking-wider'>
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
        <Button onClick={onResetTemplate} variant='ghost' size='icon'>
          <RotateCcw className='h-4 w-4' />
        </Button>
        <a
          href='https://github.com/gezhiheng/json2ppt-editor'
          target='_blank'
          rel='noopener noreferrer'
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <Github className='h-4 w-4' />
        </a>
      </div>
    </header>
  )
}
