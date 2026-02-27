import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

type MonacoWorkerFactory = new () => Worker

type MonacoGlobal = typeof self & {
  MonacoEnvironment?: {
    getWorker: (_moduleId: string, label: string) => Worker
  }
}

const workerFactoryByLabel: Record<string, MonacoWorkerFactory> = {
  json: jsonWorker,
  css: cssWorker,
  scss: cssWorker,
  less: cssWorker,
  html: htmlWorker,
  handlebars: htmlWorker,
  razor: htmlWorker,
  javascript: tsWorker,
  typescript: tsWorker
}

const monacoGlobal = self as MonacoGlobal
monacoGlobal.MonacoEnvironment = {
  getWorker (_moduleId: string, label: string) {
    const WorkerFactory = workerFactoryByLabel[label] ?? editorWorker
    return new WorkerFactory()
  }
}

loader.config({ monaco })
