import { expect, test, type Page } from '@playwright/test'

/*
 * Below 1200px (audit 7: the side-by-side split needs 1360px; audit 12: no
 * test below 1200). A smoke pass at 1024×768 and 800×900: record how the
 * field lays out (as annotations, not assertions, since Phase 2 rebuilds it),
 * and hold the line on what must not break — nothing overflows sideways, and
 * the core actions still work.
 *
 * Seed ids: homepage 1, SITE REDESIGN 2, NAV RESTRUCTURE 8.
 */

const SIZES = [
  { width: 1024, height: 768 },
  { width: 800, height: 900 },
]

const card = (page: Page, id: number) => page.getByTestId(`card-${id}`)
const laneOfCard = (page: Page, id: number) => card(page, id).locator('xpath=ancestor::section[@data-lane]').getAttribute('data-lane')

/** Elements whose right edge passes the viewport, ignoring ones inside a scroller that clips them. */
async function overflow(page: Page): Promise<{ scrollWidth: number; innerWidth: number; offenders: string[] }> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const offenders: string[] = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue
      // Clipped by a scrolling or hidden-overflow ancestor: not page overflow.
      let clipped = false
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if ((ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') && p.getBoundingClientRect().right <= vw + 1) {
          clipped = true
          break
        }
      }
      if (clipped) continue
      const tid = el.getAttribute('data-testid')
      offenders.push(`${el.tagName.toLowerCase()}${tid ? `[data-testid=${tid}]` : ''}.${[...el.classList].join('.')} right=${Math.round(r.right)}`)
    }
    return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, offenders: offenders.slice(0, 10) }
  })
}

async function noSidewaysOverflow(page: Page, where: string) {
  const o = await overflow(page)
  expect(o.scrollWidth, `${where}: the page scrolls sideways (${o.scrollWidth} > ${o.innerWidth}); offenders:\n  ${o.offenders.join('\n  ')}`).toBeLessThanOrEqual(o.innerWidth)
  expect(o.offenders, `${where}: elements stick out past the right edge`).toEqual([])
}

for (const size of SIZES) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size })

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await expect(page.getByTestId('board')).toBeVisible()
    })

    test('lays out without sideways overflow, and records how', async ({ page }, info) => {
      await noSidewaysOverflow(page, 'at rest')
      const box = async (id: string) => page.getByTestId(id).boundingBox()
      const [board, dir, top] = [await box('board'), await box('directory'), await box('search')]
      const stacked = !!(board && dir && dir.y >= board.y + board.height - 1)
      info.annotations.push({
        type: 'layout',
        description: `${size.width}×${size.height}: ${stacked ? 'stacked (board, then directory)' : 'side by side'}; board ${Math.round(board?.width ?? 0)}px wide at y=${Math.round(board?.y ?? 0)}, directory ${Math.round(dir?.width ?? 0)}px at y=${Math.round(dir?.y ?? 0)}; page height ${await page.evaluate(() => document.documentElement.scrollHeight)}px`,
      })
      // Below the split width the field stacks (audit 7); the board and the search stay reachable.
      expect(stacked).toBe(true)
      expect(top).not.toBeNull()
      await expect(page.locator('section[data-lane]')).toHaveCount(5)
      // The lanes may run past the edge inside the board's own sideways scroller (the page does not); record how many show whole.
      let whole = 0
      for (const lane of await page.locator('section[data-lane]').all()) {
        const b = await lane.boundingBox()
        if (b && b.x >= -1 && b.x + b.width <= size.width + 1) whole++
      }
      info.annotations.push({ type: 'layout', description: `${size.width}×${size.height}: ${whole} of 5 lanes fully in view without scrolling the board` })
    })

    test('a card opens its drawer, inside the viewport, and Esc closes it', async ({ page }) => {
      await card(page, 2).click()
      const drawer = page.getByTestId('drawer')
      await expect(drawer).toBeVisible()
      await expect(drawer).toContainText('SITE REDESIGN')
      // Measured once its slide-in has settled.
      await expect.poll(async () => {
        const b = await drawer.boundingBox()
        return b!.x >= -1 && b!.x + b!.width <= size.width + 1
      }).toBe(true)
      await noSidewaysOverflow(page, 'drawer open')
      await page.keyboard.press('Escape')
      await expect(drawer).toHaveCount(0)
    })

    test('the keyboard moves a card to the next lane and Ctrl+Z puts it back', async ({ page }) => {
      await card(page, 8).focus()
      const from = await laneOfCard(page, 8)
      await page.keyboard.press('Shift+L')
      await expect.poll(() => laneOfCard(page, 8)).not.toBe(from)
      await page.keyboard.press('Control+z')
      await expect.poll(() => laneOfCard(page, 8)).toBe(from)
    })

    test('the shell in the directory adds a task', async ({ page }) => {
      const input = page.getByTestId('shell-input')
      await input.scrollIntoViewIfNeeded()
      await input.fill('touch homepage/NARROW ONE')
      await input.press('Enter')
      await expect(page.getByTestId('lane-pending')).toContainText('NARROW ONE')
      await noSidewaysOverflow(page, 'after adding a task')
    })

    test('Ctrl+K opens the palette inside the viewport and finds a task', async ({ page }) => {
      await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
      await page.keyboard.press('Control+k')
      await expect(page.getByTestId('palette')).toBeVisible()
      await page.keyboard.type('nav')
      await expect(page.getByTestId('palette-row-0')).toContainText('NAV RESTRUCTURE')
      const b = await page.getByTestId('palette').boundingBox()
      expect(b!.x).toBeGreaterThanOrEqual(-1)
      expect(b!.x + b!.width).toBeLessThanOrEqual(size.width + 1)
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('drawer')).toContainText('NAV RESTRUCTURE')
    })

    test('the ⋯ menu opens inside the viewport', async ({ page }) => {
      await page.getByTestId('menu').click()
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible()
      const b = await menu.boundingBox()
      expect(b!.x).toBeGreaterThanOrEqual(-1)
      expect(b!.x + b!.width).toBeLessThanOrEqual(size.width + 1)
    })
  })
}
