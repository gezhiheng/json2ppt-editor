import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/npm-package-install.smoke.ts'],
    hookTimeout: 300_000,
    testTimeout: 300_000
  }
})
