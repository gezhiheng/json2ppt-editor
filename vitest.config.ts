import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@henryge/pipto/json2pptx-schema': fileURLToPath(
        new URL('./packages/pipto/src/json2pptx-schema.ts', import.meta.url)
      ),
      '@henryge/pipto/json2pptx': fileURLToPath(
        new URL('./packages/pipto/src/json2pptx.ts', import.meta.url)
      ),
      '@henryge/pipto/ppt2json': fileURLToPath(
        new URL('./packages/pipto/src/ppt2json.ts', import.meta.url)
      ),
      '@henryge/pipto/pptx-custom': fileURLToPath(
        new URL('./packages/pipto/src/pptx-custom.ts', import.meta.url)
      ),
      '@henryge/pipto/pptx-previewer': fileURLToPath(
        new URL('./packages/pipto/src/pptx-previewer.ts', import.meta.url)
      ),
      '@henryge/pipto': fileURLToPath(
        new URL('./packages/pipto/src/index.ts', import.meta.url)
      ),
      'json2pptx-schema': fileURLToPath(
        new URL('./packages/json2pptx-schema/index.ts', import.meta.url)
      ),
      'json2pptx': fileURLToPath(
        new URL('./packages/json2pptx/src/index.ts', import.meta.url)
      ),
      'pptx-custom': fileURLToPath(
        new URL('./packages/pptx-custom/src/index.ts', import.meta.url)
      ),
      'pptx-previewer': fileURLToPath(
        new URL('./packages/pptx-previewer/index.ts', import.meta.url)
      ),
      'ppt2json': fileURLToPath(
        new URL('./packages/pptx2json/index.ts', import.meta.url)
      )
    }
  },
  test: {
    environment: 'node',
    include: [
      'test/**/*.test.ts',
      'packages/**/test/**/*.test.ts',
      'packages/**/tests/**/*.test.ts'
    ]
  }
})
