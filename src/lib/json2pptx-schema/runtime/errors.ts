export type SchemaValidationIssue = {
  code: string
  path: string
  message: string
  keyword?: string
  params?: Record<string, unknown>
}

export class SchemaValidationError extends Error {
  readonly issues: SchemaValidationIssue[]

  constructor(issues: SchemaValidationIssue[], message = 'Schema validation failed') {
    super(message)
    this.name = 'SchemaValidationError'
    this.issues = issues
  }
}

export class UnsupportedSchemaVersionError extends Error {
  readonly code = 'UNSUPPORTED_SCHEMA_VERSION'
  readonly supportedVersion: string
  readonly receivedVersion?: string

  constructor(receivedVersion: unknown, supportedVersion: string) {
    const received =
      receivedVersion === undefined || receivedVersion === null
        ? undefined
        : String(receivedVersion)

    super(
      received
        ? `Unsupported schema version: ${received}. Supported version: ${supportedVersion}.`
        : `Unsupported schema version. Supported version: ${supportedVersion}.`
    )

    this.name = 'UnsupportedSchemaVersionError'
    this.supportedVersion = supportedVersion
    this.receivedVersion = received
  }
}
