# pptx-custom

Utilities to customize PPTX JSON templates in two stages:

- `applyCustomContent`: replace default slide content from backend JSON text.
- `applyCustomTheme`: apply user theme settings (palette/font/background).
- `parseCustomContent`: parse custom content to slide data

## Install

```bash
npm i pptx-custom
```

## Usage

```ts
import {
  applyCustomContent,
  applyCustomTheme,
  parseCustomContent,
} from 'pptx-custom'

const deckWithContent = applyCustomContent(templateDeck, backendText)

const deckWithTheme = applyCustomTheme(deckWithContent, {
  themeColors: ['#111111', '#333333', '#555555', '#777777', '#999999', '#BBBBBB'],
  fontColor: '#222222',
  backgroundColor: '#FFFFFF'
})

const slides = parseCustomContent(backendText)
const deckFromSlides = applyCustomContentToTemplate(templateDeck, slides)

```

## Custom Content Format

`applyCustomContent` and `parseCustomContent` accept NDJSON-style lines or JSON arrays/objects of slides:

```json
{"type":"cover","data":{"title":"Title","text":"Subtitle"}}
{"type":"contents","data":{"items":["Part A","Part B"]}}
{"type":"transition","data":{"title":"Part A","text":"Section intro"}}
{"type":"content","data":{"title":"Topic","items":[{"title":"Point","text":"Detail"}]}}
{"type":"end"}
```

## Exported APIs

- `applyCustomContent(template, input)`
- `parseCustomContent(raw)`
- `applyCustomTheme(deck, themeUpdate)`
