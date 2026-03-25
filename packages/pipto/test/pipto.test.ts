import { describe, expect, it } from 'vitest'

import {
  applyCustomTheme,
  buildPptxBlob,
  createPPTX,
  importPPTXPreviewer,
  json2pptx,
  parseDocument,
  parsePptxToJson,
  ppt2json,
  pptxCustom,
  schema
} from '@henryge/pipto'
import { createPPTX as createPPTXSubpath } from '@henryge/pipto/json2pptx'
import {
  DEFAULT_SCHEMA_VERSION,
  parseDocument as parseDocumentSubpath
} from '@henryge/pipto/json2pptx-schema'
import { parsePptxToJson as parsePptxToJsonSubpath } from '@henryge/pipto/ppt2json'
import { applyCustomTheme as applyCustomThemeSubpath } from '@henryge/pipto/pptx-custom'
import { PPTXPreviewer } from '@henryge/pipto/pptx-previewer'

describe('@henryge/pipto', () => {
  it('re-exports the core package APIs from the root entrypoint', () => {
    const parsed = parseDocument({
      title: 'Root API',
      theme: {},
      slides: [{ elements: [] }]
    })

    expect(parsed.schemaVersion).toBe(DEFAULT_SCHEMA_VERSION)
    expect(schema.parseDocument).toBe(parseDocumentSubpath)
    expect(json2pptx.createPPTX).toBe(createPPTXSubpath)
    expect(ppt2json.parsePptxToJson).toBe(parsePptxToJsonSubpath)
    expect(pptxCustom.applyCustomTheme).toBe(applyCustomThemeSubpath)
    expect(createPPTX).toBe(createPPTXSubpath)
    expect(buildPptxBlob).toBe(createPPTXSubpath)
    expect(parsePptxToJson).toBe(parsePptxToJsonSubpath)
    expect(applyCustomTheme).toBe(applyCustomThemeSubpath)
  })

  it('lazy-loads the previewer surface from the root package', async () => {
    const previewerModule = await importPPTXPreviewer()

    expect(previewerModule.PPTXPreviewer).toBe(PPTXPreviewer)
  })

  it('re-exports the previewer subpath directly', () => {
    expect(typeof PPTXPreviewer).toBe('function')
  })
})
