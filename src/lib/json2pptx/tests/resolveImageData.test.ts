import { describe, expect, it } from 'vitest'
import { resolveImageData } from '../src/resolveImageData'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

const fixturePath = path.join(__dirname, 'fixtures', 'tiny.png')

const ensureFixture = async () => {
  await fs.mkdir(path.dirname(fixturePath), { recursive: true })
  await fs.writeFile(fixturePath, Buffer.from(pngBase64, 'base64'))
}

describe('resolveImageData', () => {
  it('returns data url when given data url', async () => {
    const dataUrl = `data:image/png;base64,${pngBase64}`
    await expect(resolveImageData(dataUrl)).resolves.toBe(dataUrl)
  })

  it('resolves local file paths to data url', async () => {
    await ensureFixture()
    const result = await resolveImageData(fixturePath)
    expect(result.startsWith('data:image/png;base64,')).toBe(true)
    expect(result.endsWith(pngBase64)).toBe(true)
  })
})
