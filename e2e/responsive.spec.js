import { test, expect } from '@playwright/test'

/** Matches design skill: mobile, straddle md, wide desktop */
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-md-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
]

for (const vp of viewports) {
  test.describe(`viewport ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    test('document has no horizontal overflow', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('tab', { name: 'Search' })).toBeVisible({ timeout: 30_000 })
      const overflows = await page.evaluate(() => {
        const doc = document.documentElement
        return doc.scrollWidth > doc.clientWidth
      })
      expect(overflows, 'documentElement scrollWidth should not exceed clientWidth').toBe(false)
    })

    test('open Add place sheet', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('tab', { name: 'Search' })).toBeVisible({ timeout: 30_000 })
      if (vp.width < 768) {
        await page.getByRole('navigation').getByRole('button', { name: 'Add a place' }).click()
      } else {
        await page.getByRole('button', { name: 'Add Place' }).click()
      }
      await expect(page.locator('h2:not(.sr-only)', { hasText: /^Add a place$/ })).toBeVisible()
    })
  })
}
