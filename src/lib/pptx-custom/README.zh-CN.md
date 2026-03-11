# pptx-custom

[English](./README.md)

用于对 `json2pptx` JSON deck 进行两阶段定制：

- 内容阶段：将后端内容映射到模板 deck。
- 主题阶段：替换主题色/字体/背景，并按范围应用媒体资源。

## 安装

```bash
npm i pptx-custom
```

## 导出 API

- `applyCustomContent(template, input)`
- `parseCustomContent(raw)`
- `applyCustomContentToTemplate(template, slides)`
- `applyCustomTheme(deck, themeInput)`

同时导出类型，包括：
`CustomSlide`、`Presentation`、`PresentationData`、`PresentationTheme`、`PptxCustomContentInput`、`PptxCustomThemeInput`、
`PptxCustomOptions`、`TemplateJson`、`TemplateJsonSlide`、`TemplateJsonElement`、
`TemplateJsonTheme`。

## 快速开始

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

## 自定义内容输入格式

`parseCustomContent` 和 `applyCustomContent` 支持：

1. NDJSON（每行一个 slide）
2. JSON slide 数组
3. 带 `slides` 字段的 JSON 对象
4. 单个 slide JSON 对象（包含 `type`）

支持的 slide 类型：

- `cover`
- `contents`
- `transition`
- `content`
- `end`

兼容的历史别名：

- `agenda` -> `contents`
- `section` -> `transition`
- `ending` -> `end`

NDJSON 示例：

```json
{"type":"cover","data":{"title":"Title","text":"Subtitle"}}
{"type":"contents","data":{"items":["Part A","Part B"]}}
{"type":"transition","data":{"title":"Part A","text":"Section intro"}}
{"type":"content","data":{"title":"Topic","items":[{"title":"Point","text":"Detail"}]}}
{"type":"end"}
```

## 主题输入

`applyCustomTheme` 接收 `PptxCustomThemeInput`：

- `themeColors: string[]`（最多使用前 6 个）
- `fontColor: string`
- `backgroundColor?: string`
- `backgroundImage?: { src, scope, width?, height? }`
- `logoImage?: { src, scope, position, width?, height? }`
- `clearBackgroundImage?: boolean`
- `clearLogoImage?: boolean`

`scope` 可选键：
`cover | contents | transition | content | end`

## 行为说明

- `applyCustomContent` 与 `applyCustomTheme` 都会在返回前经过
  `json2pptx-schema` 的解析与规范化。
- `applyCustomContent` 按 `type` 选模板页；对 `contents/content` 会优先选择
  与输入条目数容量最接近的布局。
- `applyCustomContent` 会规范化 logo 元素（`imageType: "logo"`）：
  保持在顶部边距内，并移除 logo 裁剪配置。
- `applyCustomTheme` 会将背景图以元素形式写入（`imageType: "background"`），
  并将 logo 以 `imageType: "logo"` 写入。
- 当同时提供 `backgroundImage` 与 `backgroundColor` 时，会在目标页应用
  50% 透明度的背景色叠加效果。
- 当前行为下，`clearBackgroundImage` 也会同时清除 logo 图片。
- `Deck` 仍保留为兼容别名，但新的推荐根类型命名是 `Presentation`。
