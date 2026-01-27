import { Button, buttonVariants } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { cn } from '../lib/utils'
import {
  LayoutTemplate,
  RotateCcw,
  FileJson,
  Presentation,
  Github
} from 'lucide-react'
import type { Deck } from '../types/ppt'

type TemplateEntry = {
  id: string
  name: string
}

type HeaderBarProps = {
  deck: Deck | null
  templates: TemplateEntry[]
  selectedTemplateId: string
  isExporting: boolean
  jsonError: string
  onTemplateChange: (templateId: string) => void
  onResetTemplate: () => void
  onExportJson: () => void
  onExportPptx: () => void
}

function getStatusText (deck: Deck | null, jsonError: string): string {
  if (jsonError) {
    return `JSON error: ${jsonError}`
  }
  if (deck?.title) {
    return `JSON valid · ${deck.title}`
  }
  return 'JSON valid'
}

export function HeaderBar ({
  deck,
  templates,
  selectedTemplateId,
  isExporting,
  jsonError,
  onTemplateChange,
  onResetTemplate,
  onExportJson,
  onExportPptx
}: HeaderBarProps): JSX.Element {
  return (
    <header className='flex flex-row justify-between rounded-xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur'>
      <div className='flex flex-col gap-2'>
        <h1 className='font-display text-3xl text-ink-900 md:text-4xl'>
          Live JSON to PPTX editor
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
        <Button onClick={onResetTemplate} variant='ghost'>
          <RotateCcw className='h-4 w-4' />
          重制模板
        </Button>
        <Button onClick={onExportJson} variant='ghost'>
          <FileJson className='h-4 w-4' />
          导出 JSON
        </Button>
        <a
          href='https://github.com/gezhiheng/json2ppt-editor'
          target='_blank'
          rel='noopener noreferrer'
          className={buttonVariants({ variant: 'ghost' })}
        >
          <Github className='h-4 w-4' />
          GitHub
        </a>
        <Button onClick={onExportPptx} disabled={isExporting}>
          <Presentation className='h-4 w-4' />
          {isExporting ? '导出中...' : '导出 PPTX'}
        </Button>
      </div>
    </header>
  )
}
