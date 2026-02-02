import { lexer } from './lexer'
import { parser } from './parser'
import { format } from './format'
export type { AST } from './types'

export const toAST = (str: string) => {
  const tokens = lexer(str)
  const nodes = parser(tokens)
  return format(nodes)
}
