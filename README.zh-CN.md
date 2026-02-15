# JSON2PPT Editor

[English](./README.md)

## 项目简介

JSON2PPT Editor 是一个本地优先的 JSON 幻灯片编辑应用。  
你可以选择模板、用 Monaco 编辑 JSON、实时预览、应用自定义内容/主题，并导出 PPTX。

一个单页应用，用于将 JSON 幻灯片数据转换为实时预览，并通过 PptxGenJS 导出 PPTX 文件。它内置基于 Monaco 的 JSON 编辑器、实时幻灯片预览，以及从 `/template` 读取 JSON 文件的模板选择器。

## 功能特性

- 灵感来源于 [PPTist](https://github.com/pipipi-pikachu/PPTist)
- 基于 Monaco Editor 的实时 JSON 编辑与代码折叠
- 实时幻灯片预览
- 通过 PptxGenJS 导出 PPTX
- 支持将 PPTX 导入回可编辑 JSON（可回传 JSON 元数据）
- 导出当前 JSON 为文件
- 基于 `/template/*.json` 的模板选择器

## 技术栈

- React + Vite + TypeScript
- Tailwind CSS + shadcn 风格组件
- PptxGenJS
- Monaco Editor

## 核心依赖

- 相关 npm 包：
  - [`json2pptx`](https://www.npmjs.com/package/json2pptx)
  - [`json2pptx-schema`](https://www.npmjs.com/package/json2pptx-schema)
  - [`ppt2json`](https://www.npmjs.com/package/ppt2json)
  - [`pptx-custom`](https://www.npmjs.com/package/pptx-custom)
  - [`pptx-previewer`](https://www.npmjs.com/package/pptx-previewer)
- 运行时应用：`react`、`react-dom`、`vite`
- 编辑器/UI：`monaco-editor`、`@monaco-editor/react`、`lucide-react`、`@radix-ui/react-select`
- 样式工具：`tailwindcss`、`tailwind-merge`、`class-variance-authority`、`clsx`

## 项目结构

- `template/`：模板选择器加载的 JSON 模板
- `src/components/`：UI 与布局组件
- `src/lib/`：工具库（PPTX 生成、模板相关）
- `src/types/`：共享类型

## 快速开始

### 1) 安装依赖

```bash
pnpm i
```

### 2) 启动开发服务器

```bash
pnpm dev
```

## 常用命令

在 `/Users/henry/codebase/personal/json2ppt-editor` 目录执行：

```bash
# 应用开发服务器（Vite HMR，适合改页面/应用代码）
pnpm dev

# 同时监听工作区库 + 应用（推荐：改 lib 时也能联动 HMR）
pnpm dev:workspace

# 仅监听工作区库（json2pptx、schema、ppt2json、pptx-previewer、pptx-custom）
pnpm dev:libs

# 运行测试
pnpm test

# 构建生产包
pnpm build

# 本地预览生产包
pnpm preview

# 分库构建
pnpm build:schema
pnpm build:json2pptx
pnpm build:ppt2json
pnpm build:pptx-previewer
pnpm build:pptx-custom
```

## 使用方式

### 选择模板

将 JSON 模板放入 `template/`（例如 `template/template_2.json`）。重启开发服务器后可刷新模板列表。  
本仓库模板来源于 [PPTist](https://github.com/pipipi-pikachu/PPTist)。

### 导出 / 导入

- **导出 JSON**：下载当前编辑器内容。
- **导出 PPTX**：通过 PptxGenJS 生成 `.pptx` 文件。
- **导入 PPTX**：上传 `.pptx` 并转换为 JSON。若该 PPTX 由本应用生成，则优先使用内嵌 JSON 以尽量保持一致性。

## 说明

- 预览会使用 JSON 中的 `width` 与 `height` 维持画布比例。
- PPTX 导出对形状、文本、图片、线条采用尽力映射策略。
- 模板中的远程图片需可公开访问，才能用于 PPTX 导出。
