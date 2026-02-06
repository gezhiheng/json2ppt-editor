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
      background: { color: '#ffffff' },
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

### `createPPTX(template: Deck): Promise<{ blob: Blob; fileName: string }>`

根据 `Deck` 数据生成 PPTX 的 `Blob` 与建议文件名。

### `resolveImageData(src: string): Promise<string>`

将图片地址转换为 data URL（`data:image/*;base64,...`）。支持：
- data URL
- 远程 URL
- 本地文件路径（Node 环境）

## 类型

包内导出了常用类型：
`Deck`、`Slide`、`SlideElement`、`TextElement`、`ImageElement`、`ShapeElement`、`LineElement` 等。

## 开发

```bash
npm run build
npm run test
npm run typecheck
```
