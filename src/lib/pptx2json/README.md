# ppt2json

Convert `.pptx` files into JSON deck structures compatible with the `json2pptx` schema pipeline.

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

`deck` is schema-compatible JSON, and `warnings` contains non-fatal conversion warnings.
