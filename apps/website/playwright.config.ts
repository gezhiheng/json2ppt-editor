import path from 'node:path'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 2 * 60 * 1000,
  fullyParallel: false,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    actionTimeout: 0,
    viewport: { width: 740, height: 1366 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    colorScheme: 'light'
  },
  webServer: {
    command: 'PORT=4173 pnpm dev',
    cwd: path.resolve(__dirname),
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NO_PROXY: '127.0.0.1,localhost'
    }
  }
})
