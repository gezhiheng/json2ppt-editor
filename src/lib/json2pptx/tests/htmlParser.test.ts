import { describe, expect, it } from 'vitest'
import { toAST } from '../src/htmlParser'

describe('htmlParser', () => {
  it('parses basic html into AST', () => {
    const ast = toAST('<p>Hello <strong>world</strong></p>')
    expect(ast.length).toBeGreaterThan(0)

    const paragraph = ast[0]
    expect('tagName' in paragraph).toBe(true)
    if ('tagName' in paragraph) {
      expect(paragraph.tagName).toBe('p')
      expect(paragraph.children.length).toBeGreaterThan(0)
    }
  })
})
