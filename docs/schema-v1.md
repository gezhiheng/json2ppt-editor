# Schema V1 (`json2pptx-schema`)

## 1) Derivation from `/template`

V1 is derived from the real JSON fixtures in:

- `/Users/henry/codebase/personal/json2ppt-editor/template/template_1.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_2.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_3.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_4.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_5.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_6.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_7.json`
- `/Users/henry/codebase/personal/json2ppt-editor/template/template_8.json`

Observed core shape in samples:

- root document with `title`, `width`, `height`, `theme`, `slides`
- slide list with `id`, `type`, `background`, `elements`, optional `remark`
- element union with `text`, `shape`, `line`, `image`
- nested theme/background/gradient/shadow/outline structures

## 2) Required vs optional fields

Validation enforces critical fields while keeping compatibility flexibility.

Required in input schema:

- root: `slides`
- slide: `elements`
- element: `type`
- additional required fields for known element types:
  - `text`: `content`, `left`, `top`, `width`, `height`
  - `shape`: `path`, `viewBox`, `fill`, `left`, `top`, `width`, `height`
  - `line`: `start`, `end`, `points`, `color`, `width`, `left`, `top`
  - `image`: `src`, `left`, `top`, `width`, `height`

Optional in input and normalized with defaults where applicable:

- root: `title`, `width`, `height`, `theme`, `schemaVersion`
- theme details (`themeColors`, `fontColor`, `fontName`, `backgroundColor`, `shadow`, `outline`)
- slide metadata (`id`, `type`, `remark`, `background`)
- many element style/detail fields

Guaranteed after `parseDocument`:

- `schemaVersion: '1.0.0'`
- normalized `title`, `width`, `height`, `theme`, `slides`

## 3) Enum decisions

Primary enum-like fields from sample frequency:

- `elements[].type`: `text | shape | line | image`
- `slides[].type`: `cover | contents | transition | content | end`
- `line.style`: `solid | dashed | dotted`
- `image.imageType`: `pageFigure | background | itemFigure`

Schema keeps these as string-compatible to preserve backwards compatibility with existing editor/renderer flows.

## 4) Migration rules

`migrateDocument(input, toVersion = '1.0.0')` applies:

- `version` -> `schemaVersion`
- `1`, `1.0`, `1.0.0` -> `schemaVersion: '1.0.0'`
- unsupported versions -> `UnsupportedSchemaVersionError`
- legacy slide type aliases:
  - `agenda` -> `contents`
  - `section` -> `transition`
  - `ending` -> `end`
- `theme.fontname` -> `theme.fontName`

## 5) Parse pipeline usage examples

```ts
import { parseDocument } from 'json2pptx-schema'

const normalized = parseDocument(input)
// internally: migrate -> validate -> normalize
```

Direct stage usage:

```ts
import {
  migrateDocument,
  validateDocument,
  normalizeDocument
} from 'json2pptx-schema'

const migrated = migrateDocument(input)
const validated = validateDocument(migrated)
const normalized = normalizeDocument(validated)
```

Integrated paths:

- `json2pptx.createPPTX` parses before render/export
- `pptx-previewer` parses before preview rendering (fail-open fallback)
- `pptx-custom` parses before and after content/theme transformations

## 6) Future extraction plan (`packages/json2pptx-schema`)

To extract with minimal import churn:

1. Move `src/lib/json2pptx-schema` into `packages/json2pptx-schema/src`.
2. Keep public exports stable (`index.ts` contract unchanged).
3. Publish as `json2pptx-schema` package.
4. Replace current alias mapping with workspace package dependency.
5. Keep current import statements unchanged in internal libs.
