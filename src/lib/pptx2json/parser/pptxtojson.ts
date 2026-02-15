import { parse as parseWithPptxtojson } from 'pptxtojson/dist/index.js'

export type PptxParseResult = Awaited<ReturnType<typeof parseWithPptxtojson>>

export async function parse(file: ArrayBuffer): Promise<PptxParseResult> {
  return parseWithPptxtojson(file)
}
