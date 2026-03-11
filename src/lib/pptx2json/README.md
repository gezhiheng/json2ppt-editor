# ppt2json

Convert `.pptx` files into JSON deck structures normalized by the `json2pptx-schema` pipeline.

## Install

```bash
npm i ppt2json
```

## Usage

```ts
import { parsePptxToJson } from 'ppt2json'

const file = new File([arrayBuffer], 'deck.pptx', {
  type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
})

const { deck, warnings } = await parsePptxToJson(file)
```

`deck` is normalized `PresentationData`, and `warnings` contains non-fatal conversion warnings.

## Notes

- Parsing is based on Office XML only. The package does not read embedded custom JSON payloads from `.pptx` files.
- Returned output is normalized through `json2pptx-schema`, whose parse layer returns `PresentationDocument`.
- Visual round-trip is optimized for the built-in templates in this repo and shared primitives such as fills, text, paths, lines, images, and image clipping.
- Arbitrary third-party PPTX files are best-effort conversions.
- `Deck` remains exported as a compatibility alias, but the recommended application-layer type name is `PresentationData`.
