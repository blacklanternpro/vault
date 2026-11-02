import { expect, test, type BrowserContext, type Page } from '@playwright/test'

/*
 * Night Shift: due dates, next action, tonight's shelf, the left-off question,
 * "since last time", the trail, the weekly review, dust and night mode. Seed
 * ids as in vault.e2e.ts: homepage 1, SITE REDESIGN 2 (lines 3–7), NAV
 * RESTRUCTURE 8, UPDATE BRANDING 10, MARKET RESEARCH 13, OLD LANDING PAGE 21.
 */

const DAY = 86_400_000
const card = (page: Page, id: number) => page.getByTestId(`card-${id}`)
const laneOfCard = (page: Page, id: number) => card(page, id).locator('xpath=ancestor::section[@data-lane]').getAttribute('data-lane')
const saved = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('vault:doc') ?? 'null')?.doc ?? null) as { nodes: Array<Record<string, unknown>>; events: Array<Record<string, unknown>> })

/** ISO YYYY-MM-DD for today plus `days`, in the browser's own clock, which is what the chips read. */
const isoFromToday = (page: Page, days: number) =>
  page.evaluate((d) => {
    const t = new Date()
    const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + d)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
  }, days)

type RawNode = { id: number; title: string; status: string; parent: number | null; touched?: number; due?: string }
type RawEvent = { at: number; kind: string; node?: number; text: string }

/** A board planted in localStorage before the first script runs, once per context. */
async function plant(ctx: BrowserContext, doc: { nodes: RawNode[]; events?: RawEvent[]; lastSeen?: number }) {
  await ctx.addInitScript((planted) => {
    if (sessionStorage.getItem('planted')) return
    sessionStorage.setItem('planted', '1')
    localStorage.setItem('vault:doc', JSON.stringify({ app: 'vault', version: 1, savedAt: Date.now(), doc: { notes: [], events: [], ...planted } }))
  }, doc)
}

const small = (): RawNode[] => [
  { id: 1, title: 'homepage', status: 'none', parent: null },
  { id: 2, title: 'SITE REDESIGN', status: 'active', parent: 1 },
  { id: 8, title: 'NAV RESTRUCTURE', status: 'pending', parent: 1 },
]

test.describe('due dates', () => {
  test('the chip renders on the card and warms as the day comes', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).click()
    const due = page.getByTestId('drawer-due')

    await due.fill(await isoFromToday(page, 10))
    const chip = card(page, 8).getByTestId('due-chip')
    await expect(chip).toHaveAttribute('data-tone', 'far')
    await expect(chip).toHaveText(/^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2}$/)

    await due.fill(await isoFromToday(page, 2))
    await expect(chip).toHaveAttribute('data-tone', 'near')

    await due.fill(await isoFromToday(page, 0))
    await expect(chip).toHaveText('today')
    await expect(chip).toHaveAttribute('data-tone', 'today')
    await expect(page.getByTestId('drawer-due-chip')).toHaveClass(/is-today/)

    await due.fill(await isoFromToday(page, -3))
    await expect(chip).toHaveText('3d overdue')
    await expect(chip).toHaveAttribute('data-tone', 'overdue')

    // Setting a date is on the trail, and clearing it takes the chip off the card.
    await expect(page.getByTestId('trail')).toContainText('due')
    await page.getByTestId('drawer-due-clear').click()
    await expect(card(page, 8).getByTestId('due-chip')).toHaveCount(0)
    const doc = await saved(page)
    expect(doc.nodes.find((n) => n.id === 8)?.due).toBeUndefined()
    expect(doc.events.filter((e) => e.kind === 'due').length).toBe(5)
  })

  test('the next action shows on the card face', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).click()
    await page.getByTestId('drawer-next').click()
    await page.getByTestId('drawer-next-input').fill('wire the contact form')
    await page.getByTestId('drawer-next-input').press('Enter')
    await expect(page.getByTestId('next-8')).toHaveText('next: wire the contact form')
    await expect(page.getByTestId('drawer-next')).toHaveText('wire the contact form')
  })
})

test.describe("tonight's shelf", () => {
  test('holds three, dims the rest, and lets the dim go', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('tonight-count')).toHaveText('0/3')
    await expect(page.getByTestId('board')).not.toHaveClass(/is-focus/)

    await card(page, 8).focus()
    await page.keyboard.press('t')
    await expect(page.getByTestId('tonight-card-8')).toBeVisible()
    await expect(page.getByTestId('board')).toHaveClass(/is-focus/)
    await expect.poll(() => card(page, 2).evaluate((el) => getComputedStyle(el).opacity)).toBe('0.45')
    await expect.poll(() => card(page, 8).evaluate((el) => getComputedStyle(el).opacity)).toBe('1')

    await card(page, 13).focus()
    await page.keyboard.press('t')
    await card(page, 10).focus()
    await page.keyboard.press('t')
    await expect(page.getByTestId('tonight-count')).toHaveText('3/3')

    await card(page, 2).focus()
    await page.keyboard.press('t')
    await expect(page.getByTestId('toast')).toContainText('Tonight holds three. Finish or drop one first.')
    await expect(page.getByTestId('tonight-card-2')).toHaveCount(0)

    // "show all" lifts the dim; Esc with nothing open does too.
    await page.getByTestId('tonight-focus').click()
    await expect(page.getByTestId('board')).not.toHaveClass(/is-focus/)
    await page.getByTestId('tonight-focus').click()
    await expect(page.getByTestId('board')).toHaveClass(/is-focus/)
    await page.locator('body').click({ position: { x: 2, y: 600 } })
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('board')).not.toHaveClass(/is-focus/)

    // Off the shelf: the x, or t again.
    await page.getByTestId('tonight-remove-13').click()
    await expect(page.getByTestId('tonight-card-13')).toHaveCount(0)
    await card(page, 8).focus()
    await page.keyboard.press('t')
    await expect(page.getByTestId('tonight-card-8')).toHaveCount(0)
    await expect(page.getByTestId('tonight-count')).toHaveText('1/3')
    const doc = await saved(page)
    expect(doc.events.filter((e) => e.kind === 'tonight').length).toBe(5)
  })

  test('the drawer pennant, a drop on the shelf, and t in the directory all shelve a card', async ({ page }) => {
    await page.goto('/')
    await card(page, 2).click()
    await page.getByTestId('drawer-tonight').click()
    await expect(page.getByTestId('tonight-card-2')).toBeVisible()
    await expect(page.getByTestId('drawer-tonight')).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')

    const from = await card(page, 10).boundingBox()
    const shelf = await page.getByTestId('tonight').boundingBox()
    await page.mouse.move(from!.x + 40, from!.y + 20)
    await page.mouse.down()
    await page.mouse.move(shelf!.x + shelf!.width - 60, shelf!.y + shelf!.height / 2, { steps: 10 })
    await page.mouse.up()
    await expect(page.getByTestId('tonight-card-10')).toBeVisible()
    expect(await laneOfCard(page, 10)).toBe('pending')

    await page.getByTestId('tree-row-13').click()
    await page.getByTestId('tree').press('t')
    await expect(page.getByTestId('tonight-card-13')).toBeVisible()
    await expect(page.getByTestId('tonight-count')).toHaveText('3/3')

    // A shelf card opens its drawer and shows its due chip.
    await page.getByTestId('tonight-card-2').getByRole('button').first().click()
    await expect(page.getByTestId('drawer')).toContainText('SITE REDESIGN')
    await page.getByTestId('drawer-due').fill(await isoFromToday(page, 0))
    await expect(page.getByTestId('tonight-card-2').getByTestId('due-chip')).toHaveText('today')
  })
})

test.describe('left off', () => {
  test('closing a drawer open past the threshold asks where you got to', async ({ page }) => {
    await page.goto('/?leftoffMs=100')
    await card(page, 8).click()
    await page.waitForTimeout(250)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('leftoff')).toBeVisible()
    await expect(page.getByTestId('drawer')).toContainText('NAV RESTRUCTURE')
    await page.getByTestId('leftoff-input').fill('hero copy done, nav next')
    await page.getByTestId('leftoff-input').press('Enter')
    await expect(page.getByTestId('drawer')).toHaveCount(0)
    await expect(card(page, 8)).toHaveAttribute('title', 'left off: hero copy done, nav next')

    await card(page, 8).click()
    await expect(page.getByTestId('drawer-leftoff')).toHaveText('left off: hero copy done, nav next')
    await expect(page.getByTestId('trail')).toContainText('left off: hero copy done, nav next')

    // Opening another card is a close too; Esc on the question skips it.
    await page.waitForTimeout(250)
    await card(page, 13).click()
    await expect(page.getByTestId('leftoff')).toBeVisible()
    await page.getByTestId('leftoff-input').press('Escape')
    await expect(page.getByTestId('drawer')).toContainText('MARKET RESEARCH')
    await expect(page.getByTestId('leftoff')).toHaveCount(0)
  })

  test('a quick look closes without the question', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('drawer')).toHaveCount(0)
    await expect(page.getByTestId('leftoff')).toHaveCount(0)
  })
})

test.describe('since last time', () => {
  test('a strip under the top bar sums up what happened since the board was left', async ({ browser }) => {
    const ctx = await browser.newContext()
    const now = Date.now()
    await plant(ctx, {
      nodes: small(),
      lastSeen: now - 2 * DAY,
      events: [
        { at: now - 3 * DAY, kind: 'created', node: 2, text: 'created' },
        { at: now - 3600_000, kind: 'moved', node: 2, text: '→ ACTIVE' },
        { at: now - 1800_000, kind: 'ticked', node: 2, text: 'ticked “wireframes”' },
        { at: now - 600_000, kind: 'deleted', text: 'deleted “OLD”' },
      ],
    })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.getByTestId('since-text')).toHaveText('Since last time (2 days): 1 move, 1 ticked, 1 deleted')
    await page.getByTestId('since-show').click()
    const items = page.getByTestId('since-list').locator('li')
    await expect(items).toHaveCount(3)
    await expect(items.first()).toContainText('deleted “OLD”')
    await expect(items.nth(1)).toContainText('SITE REDESIGN ticked “wireframes”')
    await expect(items.nth(2)).toContainText('SITE REDESIGN → ACTIVE')
    await expect(items.nth(2)).toContainText(/[A-Z][a-z]{2} \d{2}:\d{2}/)
    await page.getByTestId('since-close').click()
    await expect(page.getByTestId('since')).toHaveCount(0)
    await ctx.close()
  })

  test('leaving the page stamps lastSeen', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).hover()
    await page.getByTestId('advance-8').click()
    await page.reload()
    const doc = await page.evaluate(() => JSON.parse(localStorage.getItem('vault:doc') ?? 'null')?.doc as { lastSeen?: number })
    expect(typeof doc?.lastSeen).toBe('number')
    expect(Date.now() - doc.lastSeen!).toBeLessThan(60_000)
    await expect(page.getByTestId('since')).toHaveCount(0)
  })
})

test.describe('trail', () => {
  test('every change writes a line, newest first, and undo takes it back', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).hover()
    await page.getByTestId('advance-8').click()
    await card(page, 8).click()
    const trail = page.getByTestId('trail')
    await expect(trail.locator('li').first()).toContainText('→ R&D')
    await expect(trail.locator('li').first()).toContainText('just now')

    await page.getByTestId('drawer-status').selectOption('done')
    await expect(trail.locator('li').first()).toContainText('→ DONE')
    await expect(trail.locator('li')).toHaveCount(2)

    await page.getByTestId('add-subtask-8').click()
    await page.getByTestId('new-subtask-8').fill('measure the footer')
    await page.getByTestId('new-subtask-8').press('Escape')
    await expect(trail.locator('li').first()).toContainText('added “measure the footer”')
    await page.getByTestId('drawer').getByRole('button', { name: 'Complete measure the footer' }).click()
    await expect(trail.locator('li').first()).toContainText('ticked “measure the footer”')

    await page.locator('body').click({ position: { x: 2, y: 600 } })
    await page.keyboard.press('Control+z')
    await expect(trail.locator('li').first()).toContainText('added “measure the footer”')

    const doc = await saved(page)
    const kinds = doc.events.map((e) => e.kind)
    expect(kinds).toEqual(['moved', 'moved', 'created'])
    expect(doc.nodes.find((n) => n.id === 8)?.touched).toBeGreaterThan(Date.now() - 60_000)
  })

  test('a delete and its restore are on the trail', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).focus()
    await page.keyboard.press('Delete')
    await card(page, 13).hover()
    await page.getByTestId('advance-13').click()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(card(page, 8)).toBeVisible()
    const doc = await saved(page)
    expect(doc.events.map((e) => e.kind)).toEqual(['deleted', 'moved', 'restored'])
    await card(page, 8).click()
    await expect(page.getByTestId('trail')).toContainText('restored')
  })
})

test.describe('weekly review', () => {
  test('three columns, stuck cards can be dusted, Esc closes', async ({ browser }) => {
    const ctx = await browser.newContext()
    const now = Date.now()
    const nodes = small()
    nodes[1].touched = now - 10 * DAY
    nodes[2].due = new Date(now + 2 * DAY).toISOString().slice(0, 10)
    await plant(ctx, { nodes, events: [{ at: now - 2 * DAY, kind: 'moved', node: 8, text: '→ DONE' }] })
    const page = await ctx.newPage()
    await page.goto('/')
    await page.getByTestId('menu').click()
    await page.getByTestId('menu-review').click()
    const review = page.getByTestId('review')
    await expect(review).toBeVisible()
    // The DONE line is only counted while the card is still done; card 8 is pending, so it is not.
    await expect(page.getByTestId('review-done')).toContainText('0')
    await expect(page.getByTestId('review-stuck')).toContainText('SITE REDESIGN')
    await expect(page.getByTestId('review-stuck')).toContainText('10d untouched')
    await expect(page.getByTestId('review-due')).toContainText('NAV RESTRUCTURE')
    await page.getByTestId('review-dust-2').click()
    await expect(page.getByTestId('review-stuck')).not.toContainText('SITE REDESIGN')
    await page.keyboard.press('Escape')
    await expect(review).toHaveCount(0)
    expect(await laneOfCard(page, 2)).toBe('dusted')
    await ctx.close()
  })
})

test.describe('dust', () => {
  test('a card untouched for two weeks greys its name and offers DUSTED in the drawer', async ({ browser }) => {
    const ctx = await browser.newContext()
    const nodes = small()
    nodes[2].touched = Date.now() - 16 * DAY
    await plant(ctx, { nodes })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(card(page, 8)).toHaveClass(/is-stale/)
    await expect(page.getByTestId('dust-8')).toHaveText('16d')
    await expect(card(page, 2)).not.toHaveClass(/is-stale/)
    await card(page, 8).click()
    await expect(page.getByTestId('drawer-stale')).toContainText('Untouched for 16 days — move to DUSTED?')
    await page.getByTestId('drawer-dust').click()
    expect(await laneOfCard(page, 8)).toBe('dusted')
    await expect(page.getByTestId('drawer-stale')).toHaveCount(0)
    await ctx.close()
  })
})

test.describe('night mode', () => {
  test('toggles data-theme, repaints the field, and is remembered', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    await expect(html).not.toHaveAttribute('data-theme', 'night')
    await page.getByTestId('menu').click()
    await page.getByTestId('menu-night').click()
    await expect(html).toHaveAttribute('data-theme', 'night')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(16, 17, 20)')
    expect(await page.evaluate(() => localStorage.getItem('vault:theme'))).toBe('night')

    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'night')
    await page.getByTestId('menu').click()
    await expect(page.getByTestId('menu-night')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('menu-night').click()
    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(242, 243, 246)')
  })

  test('follows a dark system preference when nothing is stored', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(16, 17, 20)')
    await ctx.close()
  })
})

test.describe('focus and rest states', () => {
  test('the drawer opens on its title and hands focus back to the card', async ({ page }) => {
    await page.goto('/')
    await card(page, 8).click()
    await expect(page.getByTestId('drawer-title')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(card(page, 8)).toBeFocused()
  })

  test('opened from the directory, the tree keeps the keyboard', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('tree-row-8').click()
    await expect(page.getByTestId('drawer')).toContainText('NAV RESTRUCTURE')
    await expect(page.getByTestId('tree')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('tree-row-7')).toHaveAttribute('aria-selected', 'true')
  })

  test('the ledger row, the chevron and the row tools are visible at rest', async ({ page }) => {
    await page.goto('/')
    expect(await page.getByTestId('lane-add-pending').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5')
    expect(await page.getByTestId('advance-8').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5')
    expect(await page.getByTestId('tree-row-8').locator('.stem-tools').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5')
    // Visible means hittable: the chevron works without a hover first.
    await page.getByTestId('advance-8').click()
    expect(await laneOfCard(page, 8)).toBe('rnd')
  })
})
