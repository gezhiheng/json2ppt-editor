# pptx-custom

[中文文档](./README.zh-CN.md)

Utilities for customizing `json2pptx` JSON decks in two stages:

- Content stage: map backend slide content into a template deck.
- Theme stage: replace theme colors/font/background and apply scoped media.

## Install

```bash
npm i pptx-custom
```

## Exports

- `applyCustomContent(template, input)`
- `parseCustomContent(raw)`
- `applyCustomContentToTemplate(template, slides)`
- `applyCustomTheme(deck, themeInput)`

Types are also exported, including:
`CustomSlide`, `Presentation`, `PresentationData`, `PresentationTheme`, `PptxCustomContentInput`, `PptxCustomThemeInput`,
`PptxCustomOptions`, `TemplateJson`, `TemplateJsonSlide`, `TemplateJsonElement`,
`TemplateJsonTheme`.

## Quick Start

```ts
import {
  applyCustomContent,
  applyCustomTheme,
  parseCustomContent,
  applyCustomContentToTemplate
} from 'pptx-custom'

const withContent = applyCustomContent(templateDeck, backendText)

const withTheme = applyCustomTheme(withContent, {
  themeColors: ['#111111', '#333333', '#555555', '#777777', '#999999', '#BBBBBB'],
  fontColor: '#222222',
  backgroundColor: '#FFFFFF',
  backgroundImage: {
    src: 'https://example.com/background.png',
    scope: {
      cover: false,
      contents: true,
      transition: true,
      content: true,
      end: false
    }
  },
  logoImage: {
    src: 'https://example.com/logo.png',
    position: 'right',
    scope: {
      cover: true,
      contents: true,
      transition: true,
      content: true,
      end: true
    }
  }
})

const slides = parseCustomContent(backendText)
const withContentDirect = applyCustomContentToTemplate(templateDeck, slides)
```

## Custom Content Input

`parseCustomContent` and `applyCustomContent` support:

1. NDJSON (one slide per line)
2. JSON array of slides
3. JSON object with a `slides` array
4. JSON object containing a single slide (with `type`)

Supported slide types:

- `cover`
- `contents`
- `transition`
- `content`
- `end`

Legacy aliases accepted in input:

- `agenda` -> `contents`
- `section` -> `transition`
- `ending` -> `end`

Example NDJSON:

```json
{"type":"cover","data":{"title":"Title","text":"Subtitle"}}
{"type":"contents","data":{"items":["Part A","Part B"]}}
{"type":"transition","data":{"title":"Part A","text":"Section intro"}}
{"type":"content","data":{"title":"Topic","items":[{"title":"Point","text":"Detail"}]}}
{"type":"end"}
```

## Theme Input

`applyCustomTheme` accepts `PptxCustomThemeInput`:

- `themeColors: string[]` (uses first 6)
- `fontColor: string`
- `backgroundColor?: string`
- `backgroundImage?: { src, scope, width?, height? }`
- `logoImage?: { src, scope, position, width?, height? }`
- `clearBackgroundImage?: boolean`
- `clearLogoImage?: boolean`

`scope` keys:
`cover | contents | transition | content | end`

## Behavior Notes

- Both `applyCustomContent` and `applyCustomTheme` run through `json2pptx-schema`
  parsing/normalization before returning.
- `applyCustomContent` selects template slides by `type`, and for `contents/content`
  prefers layouts with the closest capacity to the requested item count.
- `applyCustomContent` normalizes logo elements (`imageType: "logo"`) to stay within
  top margins and removes logo clipping.
- `applyCustomTheme` inserts scoped background images as slide elements with
  `imageType: "background"` and logo images with `imageType: "logo"`.
- When both `backgroundImage` and `backgroundColor` are provided, background color is
  applied as a 50% alpha overlay color on targeted slides.
- `clearBackgroundImage` also clears logo images in current behavior.
- `Deck` remains available as a compatibility alias, but the recommended root type name is `Presentation`.
