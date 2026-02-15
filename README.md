# JSON2PPT Editor

[中文](./README.zh-CN.md)

## Introduction

JSON2PPT Editor is a local-first slide editing app for JSON-based decks.  
You can pick a template, edit slide JSON with Monaco, preview changes instantly, apply custom content/theme transforms, and export to PPTX.

A single-page app that turns JSON slide data into a live preview and exports PPTX files with PptxGenJS. It ships with a Monaco-based JSON editor, real-time slide preview, and a template selector that reads JSON files from `/template`.

## Features

- Inspired by [PPTist](https://github.com/pipipi-pikachu/PPTist)
- Live JSON editing with Monaco Editor and folding
- Real-time slide preview
- Export PPTX via PptxGenJS
- Import PPTX back into editable JSON (round-trips JSON metadata)
- Export current JSON to file
- Template selector powered by `/mock/*.json`

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn-style components
- PptxGenJS
- Monaco Editor

## Core dependencies

- Related npm packages:
  - [`json2pptx`](https://www.npmjs.com/package/json2pptx)
  - [`json2pptx-schema`](https://www.npmjs.com/package/json2pptx-schema)
  - [`ppt2json`](https://www.npmjs.com/package/ppt2json)
  - [`pptx-custom`](https://www.npmjs.com/package/pptx-custom)
  - [`pptx-previewer`](https://www.npmjs.com/package/pptx-previewer)
- Runtime app: `react`, `react-dom`, `vite`
- Editor/UI: `monaco-editor`, `@monaco-editor/react`, `lucide-react`, `@radix-ui/react-select`
- Styling utilities: `tailwindcss`, `tailwind-merge`, `class-variance-authority`, `clsx`

## Project Structure

- `mock/` JSON templates loaded into the selector
- `src/components/` UI and layout components
- `src/lib/` utilities (PPTX generation, templates)
- `src/types/` shared types

## Getting Started

### 1) Install dependencies

```bash
pnpm i
```

### 2) Start the dev server

```bash
pnpm dev
```

## Common Commands

Use these in `/Users/henry/codebase/personal/json2ppt-editor`:

```bash
# App dev server (Vite HMR for app code)
pnpm dev

# Watch all workspace libs + app together (recommended for lib development + HMR)
pnpm dev:workspace

# Watch workspace libs only (json2pptx, schema, pptx-previewer, pptx-custom, pptx2json)
pnpm dev:libs

# Run tests
pnpm test

# Build production app bundle
pnpm build

# Preview production build locally
pnpm preview

# Build specific workspace packages
pnpm build:schema
pnpm build:json2pptx
pnpm build:ppt2json
pnpm build:pptx-previewer
pnpm build:pptx-custom
```

## Usage

### Choose a template

Add JSON templates to `template/` (e.g. `template/template_2.json`). Restart the dev server to refresh the template list.
Templates in this repo are sourced from [PPTist](https://github.com/pipipi-pikachu/PPTist).

### Export / Import

- **Export JSON**: downloads the current editor content.
- **Export PPTX**: generates a `.pptx` file via PptxGenJS.
- **Import PPTX**: upload a `.pptx` to convert into JSON. If the PPTX was generated
  by this app, the embedded JSON is used to preserve fidelity.

## Notes

- The preview uses the `width` and `height` from the JSON to maintain aspect ratio.
- The PPTX export is a best-effort mapping of shapes, text, images, and lines.
- Remote images in templates must be publicly accessible for PPTX export.
