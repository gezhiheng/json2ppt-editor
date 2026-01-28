# JSON2PPT Editor

A single-page app that turns JSON slide data into a live preview and exports PPTX files with PptxGenJS. It ships with a Monaco-based JSON editor, real-time slide preview, and a template selector that reads JSON files from `/mock`.

## Features

- Inspired by [PPTist](https://github.com/pipipi-pikachu/PPTist)
- Live JSON editing with Monaco Editor and folding
- Real-time slide preview
- Export PPTX via PptxGenJS
- Export current JSON to file
- Template selector powered by `/mock/*.json`

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn-style components
- PptxGenJS
- Monaco Editor

## Project Structure

- `mock/` JSON templates loaded into the selector
- `src/components/` UI and layout components
- `src/lib/` utilities (PPTX generation, templates)
- `src/types/` shared types

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the dev server

```bash
npm run dev
```

## Usage

### Choose a template

Add JSON templates to `mock/` (e.g. `mock/template_2.json`). Restart the dev server to refresh the template list.
Templates in this repo are sourced from [PPTist](https://github.com/pipipi-pikachu/PPTist).

### Export

- **Export JSON**: downloads the current editor content.
- **Export PPTX**: generates a `.pptx` file via PptxGenJS.

## Notes

- The preview uses the `width` and `height` from the JSON to maintain aspect ratio.
- The PPTX export is a best-effort mapping of shapes, text, images, and lines.
- Remote images in templates must be publicly accessible for PPTX export.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```
