import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/json2pptx-schema.ts',
    'src/json2pptx.ts',
    'src/ppt2json.ts',
    'src/pptx-custom.ts',
    'src/pptx-previewer.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020'
})
