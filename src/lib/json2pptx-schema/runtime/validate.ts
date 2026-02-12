import Ajv, { type ErrorObject } from 'ajv'
import schemaV1 from '../versions/v1/schema.json'
import type { V1DocumentInput } from '../versions/v1/types'
import { SchemaValidationError, type SchemaValidationIssue } from './errors'

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  allowUnionTypes: true
})

const validateV1 = ajv.compile(schemaV1)

function mapError(error: ErrorObject): SchemaValidationIssue {
  return {
    code: 'SCHEMA_VALIDATION_ERROR',
    path: error.instancePath || '/',
    message: error.message ?? 'Invalid value',
    keyword: error.keyword,
    params:
      error.params && typeof error.params === 'object'
        ? (error.params as Record<string, unknown>)
        : undefined
  }
}

export function validateDocument(input: unknown): V1DocumentInput {
  const valid = validateV1(input)
  if (!valid) {
    const issues = (validateV1.errors ?? []).map(mapError)
    throw new SchemaValidationError(issues)
  }

  return input as V1DocumentInput
}
