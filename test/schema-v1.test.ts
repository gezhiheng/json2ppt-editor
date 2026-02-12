import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HEIGHT,
  DEFAULT_TITLE,
  DEFAULT_WIDTH,
  parseDocument,
  SchemaValidationError
} from 'json2pptx-schema'

const TEMPLATE_DIR = join(process.cwd(), 'template')

function loadTemplate(name: string) {
  const raw = readFileSync(join(TEMPLATE_DIR, name), 'utf8')
  return JSON.parse(raw)
}

describe('schema v1 parseDocument', () => {
  it('parses all real template fixtures', () => {
    const files = readdirSync(TEMPLATE_DIR)
      .filter((name) => name.endsWith('.json'))
      .sort()

    expect(files.length).toBe(8)

    for (const file of files) {
      const parsed = parseDocument(loadTemplate(file))
      expect(parsed.schemaVersion).toBe('1.0.0')
      expect(Array.isArray(parsed.slides)).toBe(true)
      expect(parsed.slides.length).toBeGreaterThan(0)
    }
  })

  it('fails with structured validation errors when required fields are missing', () => {
    try {
      parseDocument({
        title: 'Broken document',
        theme: {}
      })
      throw new Error('expected parseDocument to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaValidationError)
      const issues = (error as SchemaValidationError).issues
      expect(issues.length).toBeGreaterThan(0)
      expect(issues[0].code).toBe('SCHEMA_VALIDATION_ERROR')
      expect(typeof issues[0].path).toBe('string')
      expect(typeof issues[0].message).toBe('string')
    }
  })

  it('migrates legacy version into schemaVersion', () => {
    const legacy = loadTemplate('template_1.json')
    const parsed = parseDocument({
      ...legacy,
      version: '1.0'
    })

    expect(parsed.schemaVersion).toBe('1.0.0')
  })

  it('applies defaults during normalization', () => {
    const parsed = parseDocument({
      slides: [{ elements: [] }],
      theme: {}
    })

    expect(parsed.title).toBe(DEFAULT_TITLE)
    expect(parsed.width).toBe(DEFAULT_WIDTH)
    expect(parsed.height).toBe(DEFAULT_HEIGHT)
    expect(parsed.schemaVersion).toBe('1.0.0')
    expect(parsed.slides[0].remark).toBe('')
  })
})
