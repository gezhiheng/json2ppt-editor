# pptx-previewer

`pptx-previewer` is a React component for rendering PPTX-like slide JSON in the browser.

It is designed to work with JSON produced by PPTX parsers (for example the `pptx2json` output used in this repository) and supports common slide elements:

- `shape`
- `line`
- `text`
- `image`
- `table`

## Installation

```bash
pnpm add pptx-previewer
```

## Usage

```tsx
import { PPTXPreviewer, type Slide } from 'pptx-previewer';

const slide: Slide = {
  background: { color: '#ffffff' },
  elements: [
    {
      type: 'text',
      left: 40,
      top: 32,
      width: 300,
      height: 60,
      content: '<p>Hello PPTX Preview</p>',
      defaultColor: '#111827',
      defaultFontName: 'Arial'
    }
  ]
};

export function App() {
  return (
    <div style={{ width: 960, height: 540 }}>
      <PPTXPreviewer slide={slide} />
    </div>
  );
}
```

## API

### `PPTXPreviewer`

Props:

- `slide: Slide` (required)
- `className?: string`

The component fills the size of its parent container. Set width/height on the parent element.

## Types

The package exports:

- `Slide`
- `SlideElement`
- `PPTXPreviewerProps`

## Development

```bash
cd src/lib/pptx-previewer
pnpm install
pnpm run typecheck
pnpm run build
```

Build output is generated in `dist/`:

- `dist/index.mjs`
- `dist/index.js`
- `dist/index.d.ts`

## Notes

- This package is `react` peer-dependent (`>=18`).
- Element coordinates, sizes, and style semantics follow the input JSON schema.
- Text content is rendered via `dangerouslySetInnerHTML`; sanitize external/untrusted HTML before rendering.
