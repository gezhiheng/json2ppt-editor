import { expect, test } from '@playwright/test'

const MAX_VALIDATION_LOOPS = 8
const MAX_DIFF_PIXELS = 15000
const referenceResourcesPromise = Promise.all([
  import('node:fs/promises'),
  import('pngjs'),
  import('pixelmatch')
]).then(async ([{ readFile }, pngjsModule, pixelmatchModule]) => {
  const referenceImage = pngjsModule.PNG.sync.read(
    await readFile(new URL('./reference/docs-header.png', import.meta.url))
  )
  const pixelmatchFn = pixelmatchModule.default ?? pixelmatchModule

  return {
    referenceImage,
    pngModule: pngjsModule,
    pixelmatch: pixelmatchFn
  }
})

test.describe('Docs header overlap on mobile', () => {
  test('sub-nav overlaps outline area while preserving docs surface background', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'networkidle' })

    const bodyBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor
    )
    expect(bodyBackground).toBe('rgb(244, 240, 234)')

    const subnav = page.locator('#nd-subnav')
    const article = page.locator('#nd-page article')

    await expect(subnav).toBeVisible()
    await expect(article).toBeVisible()

    const gap = await waitForOverlap(subnav, article, page)
    expect(gap).toBeLessThanOrEqual(0)
  })

  test('sticky header matches the approved visual specimen', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 1366 })
    await page.goto('/docs', { waitUntil: 'networkidle' })

    const subnav = page.locator('#nd-subnav')
    const article = page.locator('#nd-page article')

    await waitForOverlap(subnav, article, page)

    await expect(subnav).toBeVisible()

    const computedStyle = await subnav.evaluate(() => {
      const style = getComputedStyle(document.querySelector('#nd-subnav'))
      return {
        position: style?.position ?? '',
        top: style?.top ?? ''
      }
    })

    expect(computedStyle.position).toBe('sticky')
    expect(computedStyle.top).toBe('0px')

    const boundingBox = await subnav.boundingBox()
    expect((boundingBox?.y ?? 0)).toBeLessThanOrEqual(1)

    const diffPixels = await compareTopClipAgainstReference(page)
    expect(diffPixels).toBeLessThanOrEqual(MAX_DIFF_PIXELS)
  })
})

async function waitForOverlap(subnav, article, page) {
  let gap = await measureGap(subnav, article)

  for (let attempt = 1; attempt <= MAX_VALIDATION_LOOPS && gap > 0; attempt++) {
    await page.waitForTimeout(200)
    gap = await measureGap(subnav, article)
  }

  return gap
}

async function measureGap(subnav, article) {
  const [subnavBox, articleBox] = await Promise.all([
    subnav.boundingBox(),
    article.boundingBox()
  ])

  if (!subnavBox || !articleBox) {
    throw new Error('Unable to measure layout for docs header and content')
  }

  return articleBox.y - (subnavBox.y + subnavBox.height)
}

async function compareTopClipAgainstReference(page) {
  const { referenceImage, pngModule, pixelmatch } = await referenceResourcesPromise
  const clip = { x: 0, y: 0, width: referenceImage.width, height: referenceImage.height }
  let diffPixels = referenceImage.width * referenceImage.height

  for (let attempt = 1; attempt <= MAX_VALIDATION_LOOPS && diffPixels > MAX_DIFF_PIXELS; attempt++) {
    const screenshotBuffer = await page.screenshot({
      clip,
      animations: 'disabled'
    })

    const screenshotImage = pngModule.PNG.sync.read(screenshotBuffer)

    if (
      screenshotImage.width === referenceImage.width &&
      screenshotImage.height === referenceImage.height
    ) {
      diffPixels = pixelmatch(
        referenceImage.data,
        screenshotImage.data,
        null,
        referenceImage.width,
        referenceImage.height,
        { threshold: 0.18 }
      )
    } else {
      diffPixels = referenceImage.width * referenceImage.height
    }

    if (diffPixels <= MAX_DIFF_PIXELS) {
      break
    }

    await page.waitForTimeout(200)
  }

  return diffPixels
}
