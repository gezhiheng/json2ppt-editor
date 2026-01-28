import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Download, Sparkles, Upload } from 'lucide-react'
import { Button } from './ui/button'

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 12,
  lineHeight: 20,
  wordWrap: 'off',
  scrollBeyondLastLine: false,
  automaticLayout: true
} as const

type EditorPanelProps = {
  value: string
  onChange: (nextValue: string) => void
  onDownload?: () => void
}

export function EditorPanel ({
  value,
  onChange,
  onDownload
}: EditorPanelProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFormat () {
    try {
      const obj = JSON.parse(value)
      const formatted = JSON.stringify(obj, null, 2)
      onChange(formatted)
    } catch {
      // Ignore parse errors
    }
  }

  function handleImportClick () {
    fileInputRef.current?.click()
  }

  function handleFileChange (event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result
      if (typeof content === 'string') {
        onChange(content)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section className='h-full flex min-h-0 flex-col rounded-xl border border-ink-200/60 bg-[#1f1b16] p-5 shadow-sharp'>
      <input
        type='file'
        ref={fileInputRef}
        className='hidden'
        accept='.json,application/json'
        onChange={handleFileChange}
      />
      <div className='flex items-center justify-between'>
        <h2 className='font-display text-lg text-white'>JSON Editor</h2>
        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
            onClick={handleFormat}
            title='Format JSON'
          >
            <Sparkles className='h-4 w-4' />
            <span className='sr-only'>Format</span>
          </Button>
          <Button
            variant='secondary'
            size='sm'
            className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
            onClick={handleImportClick}
            title='Import JSON'
          >
            <Download className='h-4 w-4' />
            <span className='sr-only'>Import</span>
          </Button>
          {onDownload && (
            <Button
              variant='secondary'
              size='sm'
              className='h-8 px-2 text-ink-200 hover:bg-white/10 hover:text-white'
              onClick={onDownload}
              title='Download JSON'
            >
              <Upload className='h-4 w-4' />
              <span className='sr-only'>Download</span>
            </Button>
          )}
        </div>
      </div>
      <div className='mt-4 h-full border border-white/10'>
        <Editor
          height='100%'
          defaultLanguage='json'
          theme='vs-dark'
          value={value}
          onChange={next => onChange(next ?? '')}
          options={editorOptions}
        />
      </div>
    </section>
  )
}
