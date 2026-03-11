# json2pptx-schema

Schema and parsing pipeline for json2pptx documents.

## Features

- `migrateDocument(input)`
- `validateDocument(input)` (Ajv)
- `normalizeDocument(input)`
- `parseDocument(input)` -> `migrate -> validate -> normalize`
- explicit visual fill/background unions: `solid | gradient | image`
- legacy input compatibility through migration before validation

## Install

```bash
npm i json2pptx-schema
```

## Usage

```ts
import { parseDocument, type PresentationDocument } from 'json2pptx-schema'

const doc: PresentationDocument = parseDocument({
  title: 'Demo',
  width: 960,
  height: 540,
  slides: [
    {
      background: { type: 'solid', color: '#ffffff' },
      elements: []
    }
  ]
})
```

`parseDocument` returns a normalized `PresentationDocument`, including normalized fill/background unions.

## Publish

```bash
pnpm -C src/lib/json2pptx-schema build
pnpm -C src/lib/json2pptx-schema publish --access public
```
