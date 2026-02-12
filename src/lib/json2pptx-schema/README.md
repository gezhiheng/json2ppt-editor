# json2pptx-schema

Schema and parsing pipeline for json2pptx documents.

## Features

- `migrateDocument(input)`
- `validateDocument(input)` (Ajv)
- `normalizeDocument(input)`
- `parseDocument(input)` -> `migrate -> validate -> normalize`

## Install

```bash
npm i json2pptx-schema
```

## Usage

```ts
import { parseDocument } from 'json2pptx-schema'

const doc = parseDocument(input)
```

## Publish

```bash
pnpm -C src/lib/json2pptx-schema build
pnpm -C src/lib/json2pptx-schema publish --access public
```
