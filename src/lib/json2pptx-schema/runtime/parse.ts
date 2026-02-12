import type { V1Document } from '../versions/v1/types'
import { migrateDocument } from './migrate'
import { normalizeDocument } from './normalize'
import { validateDocument } from './validate'

export function parseDocument(input: unknown): V1Document {
  const migrated = migrateDocument(input)
  const validated = validateDocument(migrated)
  return normalizeDocument(validated)
}
