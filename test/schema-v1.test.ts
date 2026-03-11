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

  it('migrates legacy fill and background shapes into explicit fill unions', () => {
    const parsed = parseDocument({
      slides: [
        {
          background: {
            type: 'solid',
            color: '#FFFFFF',
            gradient: {
              type: 'linear',
              rotate: 0,
              colors: [
                { pos: 0, color: '#FFFFFF' },
                { pos: 100, color: '#DDDDDD' }
              ]
            }
          },
          elements: [
            {
              type: 'shape',
              left: 0,
              top: 0,
              width: 100,
              height: 100,
              path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
              viewBox: [200, 200],
              fill: '#FF0000'
            },
            {
              type: 'shape',
              left: 120,
              top: 0,
              width: 100,
              height: 100,
              path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
              viewBox: [200, 200],
              fill: '#00FF00',
              gradient: {
                type: 'linear',
                rotate: 45,
                colors: [
                  { pos: 0, color: '#00FF00' },
                  { pos: 100, color: '#0000FF' }
                ]
              }
            }
          ]
        }
      ]
    })

    expect(parsed.slides[0].background).toEqual({
      type: 'gradient',
      gradient: {
        type: 'linear',
        rotate: 0,
        colors: [
          { pos: 0, color: '#FFFFFF' },
          { pos: 100, color: '#DDDDDD' }
        ]
      }
    })
    expect(parsed.slides[0].elements[0]).toMatchObject({
      type: 'shape',
      fill: {
        type: 'solid',
        color: '#FF0000'
      }
    })
    expect(parsed.slides[0].elements[1]).toMatchObject({
      type: 'shape',
      fill: {
        type: 'gradient',
        gradient: {
          type: 'linear',
          rotate: 45
        }
      }
    })
  })
})
