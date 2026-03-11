# json2pptx

将 JSON 幻灯片数据转换为 PPTX 的工具库，基于 PptxGenJS。

## 安装

```bash
npm i json2pptx
```

## 使用

```ts
import { createPPTX } from 'json2pptx'

const deck = {
  title: 'Demo',
  width: 1000,
  height: 562.5,
  slides: [
    {
      background: { type: 'solid', color: '#ffffff' },
      elements: [
        {
          type: 'text',
          left: 100,
          top: 100,
          width: 400,
          height: 200,
          content: '<p><strong>Hello</strong> PPTX</p>'
        }
      ]
    }
  ]
}

const { blob, fileName } = await createPPTX(deck)
// 在浏览器中下载：
// const url = URL.createObjectURL(blob)
// const a = document.createElement('a')
// a.href = url
// a.download = fileName
// a.click()
```

## API

### `createPPTX(template: Presentation): Promise<{ blob: Blob; fileName: string }>`

根据 `Presentation` 数据生成 PPTX 的 `Blob` 与建议文件名。输入会先经过
`json2pptx-schema` 的迁移、校验和规范化流程。

### `resolveImageData(src: string): Promise<string>`

将图片地址转换为 data URL（`data:image/*;base64,...`）。支持：
- data URL
- 远程 URL
- 本地文件路径（Node 环境）

## 类型

包内导出了常用类型：
`Presentation`、`PresentationData`、`PresentationTheme`、`Slide`、`SlideElement`、
`TextElement`、`ImageElement`、`ShapeElement`、`LineElement` 等。

## 说明

- `background` / `fill` 使用显式联合类型：`solid | gradient | image`。
- 导出的 `.pptx` 只使用 Office 原生 XML 表达视觉信息，不会嵌入自定义 JSON 文件。
- 与 `ppt2json` 的视觉 round-trip 优先围绕共享视觉 primitive 和仓库内模板优化。
- `Deck` / `DeckTheme` 仍保留为兼容别名，但新的推荐命名是 `Presentation` / `PresentationTheme`。

## 开发

```bash
npm run build
npm run test
npm run typecheck
```
