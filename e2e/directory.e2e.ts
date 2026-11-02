import { expect, test, type Page } from '@playwright/test'

/*
 * The hellish directory: one screen, one selection, a shell at the foot of
 * the pane, a palette under the one input, vim keys on the board, and the
 * review fixes. Seed ids: homepage 1, SITE REDESIGN 2 (subtasks 3–7), NAV
 * RESTRUCTURE 8, brand 9, UPDATE BRANDING 10, DESIGN EXPLORATION 11, research
 * 12, MARKET RESEARCH 13, TECH SPIKE 14, vault-worldwide 15, AESTHETIC PASS
 * 19, archive 20, OLD LANDING PAGE 21.
 */

const card = (page: Page, id: number) => page.getByTestId(`card-${id}`)
const row = (page: Page, id: number) => page.getByTestId(`tree-row-${id}`)
const laneOfCard = (page: Page, id: number) => card(page, id).locator('xpath=ancestor::section[@data-lane]').getAttribute('data-lane')
const saved = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('vault:doc') ?? 'null')?.doc ?? null) as { nodes: Array<Record<string, unknown>>; notes: Array<Record<string, unknown>> })

/** One line at the prompt. */
async function sh(page: Page, line: string) {
  await page.getByTestId('shell-input').fill(line)
  await page.getByTestId('shell-input').press('Enter')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('board')).toBeVisible()
})

test.describe('one screen', () => {
  test('at 1440 the directory is a pane beside the board, with the notes as inbox/ and a prompt at its foot', async ({ page }) => {
    const dir = await page.getByTestId('directory').boundingBox()
    const board = await page.getByTestId('board').boundingBox()
    expect(dir!.x).toBeLessThan(board!.x)
    // Tonight's shelf heads the board's column (Night Shift merge): pane and shelf share a top, the board starts under the shelf.
    const shelf = await page.getByTestId('tonight').boundingBox()
    expect(shelf!.x).toBeGreaterThan(dir!.x + dir!.width - 2)
    expect(board!.y).toBeGreaterThanOrEqual(shelf!.y + shelf!.height - 2)
    expect(board!.y - dir!.y).toBeLessThan(90)
    expect(dir!.width).toBeGreaterThan(280)
    expect(board!.x + board!.width).toBeGreaterThan(1400)
    // Both panes scroll on their own; the page itself does not.
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)

    await expect(page.getByTestId('inbox-head')).toContainText('inbox/')
    const inbox = await page.getByTestId('inbox-head').boundingBox()
    expect(inbox!.y).toBeLessThan((await row(page, 1).boundingBox())!.y)
    await expect(page.getByTestId('dump')).toContainText('09.09.26')
    await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue('ask about the analytics export')
    const shell = await page.getByTestId('shell-input').boundingBox()
    expect(shell!.x).toBeLessThan(board!.x)
    expect(shell!.y + shell!.height).toBeLessThanOrEqual(900)
  })

  test('the pane resizes by its handle and remembers the width', async ({ page }) => {
    const handle = await page.getByTestId('pane-handle').boundingBox()
    await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + 300)
    await page.mouse.down()
    await page.mouse.move(handle!.x + handle!.width / 2 + 100, handle!.y + 300, { steps: 5 })
    await page.mouse.up()
    await expect.poll(async () => (await page.getByTestId('directory').boundingBox())!.width).toBeGreaterThan(400)
    expect(await page.evaluate(() => localStorage.getItem('vault:dir-width'))).toBe('420')
    await page.reload()
    expect((await page.getByTestId('directory').boundingBox())!.width).toBeGreaterThan(400)
  })

  test('below 1360 the field stacks: board, then the directory with inbox/ inside it', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 })
    const dir = await page.getByTestId('directory').boundingBox()
    const board = await page.getByTestId('board').boundingBox()
    expect(dir!.y).toBeGreaterThan(board!.y + board!.height - 1)
    await expect(page.getByTestId('pane-handle')).toBeHidden()
    await expect(page.getByTestId('inbox-head')).toBeVisible()
  })

  test('a note dragged onto a card is hitched to it', async ({ page }) => {
    const note = page.locator('[data-note-id]').first()
    const date = await note.locator('.note-date').boundingBox()
    const to = await card(page, 8).boundingBox()
    await page.mouse.move(date!.x + 4, date!.y + 6)
    await page.mouse.down()
    await page.mouse.move(to!.x + 60, to!.y + 20, { steps: 10 })
    await page.mouse.up()
    await expect(note.locator('.note-leash')).toContainText('NAV RESTRUCTURE')
  })
})

test.describe('one selection', () => {
  test('clicking a card unfolds the directory to its row and lights it', async ({ page }) => {
    await row(page, 1).getByRole('button', { name: 'Collapse homepage' }).click()
    await expect(row(page, 2)).toHaveCount(0)
    await card(page, 2).click()
    await expect(row(page, 2)).toBeVisible()
    await expect(row(page, 2)).toHaveAttribute('aria-selected', 'true')
    await expect(row(page, 2)).toHaveClass(/is-live/)
    await expect(page.getByTestId('drawer')).toContainText('SITE REDESIGN')
  })

  test('a card selected on the board is scrolled into view in the pane', async ({ page }) => {
    // Pad the inbox so the tree runs well past the pane.
    for (let i = 0; i < 25; i++) {
      await page.getByTestId('new-note').click()
      await page.getByRole('textbox', { name: 'Note' }).last().fill(`note ${i}`)
    }
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
    const pane = page.getByTestId('directory')
    expect(await pane.evaluate((el) => el.scrollTop)).toBe(0)
    await card(page, 21).click()
    await expect(row(page, 21)).toHaveClass(/is-live/)
    await expect.poll(() => pane.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    const r = await row(page, 21).boundingBox()
    const p = await pane.boundingBox()
    expect(r!.y).toBeGreaterThanOrEqual(p!.y)
    expect(r!.y + r!.height).toBeLessThanOrEqual(p!.y + p!.height + 1)
  })
})

test.describe('shell', () => {
  test('touch, mv, done and rm -r all show on the board, and rm refuses children without -r', async ({ page }) => {
    await sh(page, 'touch homepage/NEW THING')
    await expect(page.getByTestId('lane-pending')).toContainText('NEW THING')
    await expect(page.getByTestId('shell-out')).toHaveText('created NEW THING in homepage/')
    await expect(page.getByTestId('toast')).toContainText('created NEW THING')

    await sh(page, 'mv homepage/nav brand/')
    await expect(page.getByTestId('shell-out')).toHaveText('moved NAV RESTRUCTURE → brand/')
    await expect(card(page, 8)).toContainText('brand')
    expect((await saved(page)).nodes.find((n) => n.id === 8)?.parent).toBe(9)

    await sh(page, 'done homepage/site')
    expect(await laneOfCard(page, 2)).toBe('done')

    await sh(page, 'rm homepage/site')
    await expect(page.getByTestId('shell-out')).toHaveText('SITE REDESIGN has 5 children; use rm -r')
    await expect(page.getByTestId('shell-out')).toHaveClass(/is-error/)
    await expect(card(page, 2)).toBeVisible()

    await sh(page, 'rm -r homepage/site')
    await expect(card(page, 2)).toHaveCount(0)
    await expect(page.getByTestId('toast')).toContainText('Deleted “SITE REDESIGN” and 5 inside')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(card(page, 2)).toBeVisible()
  })

  test('st, urgent, rename, mkdir, cd and open', async ({ page }) => {
    await sh(page, 'st homepage/nav a')
    expect(await laneOfCard(page, 8)).toBe('active')
    await sh(page, 'urgent homepage/nav')
    await expect(card(page, 8)).toContainText('URGENT')
    await sh(page, 'rename homepage/nav "NAV, FLAT"')
    await expect(card(page, 8)).toContainText('NAV, FLAT')
    await sh(page, 'mkdir side quests')
    await expect(page.getByTestId('directory')).toContainText('side quests/')
    await sh(page, 'cd brand')
    await expect(page.getByTestId('chip-project')).toContainText('brand')
    await expect(card(page, 2)).toHaveCount(0)
    await expect(page.getByTestId('shell')).toContainText('brand $')
    await sh(page, 'touch QUICK ONE')
    await expect(page.getByTestId('lane-pending')).toContainText('QUICK ONE')
    expect((await saved(page)).nodes.find((n) => n.title === 'QUICK ONE')?.parent).toBe(9)
    await sh(page, 'cd ..')
    await expect(page.getByTestId('chip-project')).toHaveCount(0)
    await sh(page, 'open homepage/site/create')
    await expect(page.getByTestId('drawer')).toContainText('SITE REDESIGN')
  })

  test('ls prints the tree, an unknown command says so, and nothing changes', async ({ page }) => {
    await sh(page, 'ls homepage')
    await expect(page.getByTestId('shell-out')).toContainText('├── SITE REDESIGN')
    await expect(page.getByTestId('shell-out')).toContainText('│   ├── [x] Review current homepage analytics')
    await sh(page, 'frob')
    await expect(page.getByTestId('shell-out')).toHaveText('unknown command "frob"; try help')
    await sh(page, 'clear')
    await expect(page.getByTestId('shell-out')).toHaveCount(0)
    expect(await saved(page)).toBeNull()
  })

  test('Tab completes the path a segment at a time, and Up recalls the last line', async ({ page }) => {
    const input = page.getByTestId('shell-input')
    await input.fill('done home')
    await input.press('Tab')
    await expect(input).toHaveValue('done homepage/')
    await input.type('na')
    await input.press('Tab')
    await expect(input).toHaveValue('done homepage/NAV RESTRUCTURE')
    await input.press('Enter')
    expect(await laneOfCard(page, 8)).toBe('done')
    await expect(input).toHaveValue('')
    await input.press('ArrowUp')
    await expect(input).toHaveValue('done homepage/NAV RESTRUCTURE')
    await input.press('ArrowDown')
    await expect(input).toHaveValue('')
    await input.fill('ls homepage/site/d')
    await input.press('Tab')
    await expect(page.getByTestId('shell-out')).toContainText('Define new information hierarchy')
    await expect(page.getByTestId('shell-out')).toContainText('Design high-fidelity mockups')
  })
})

test.describe('palette', () => {
  test('Ctrl+K opens it, typing lists the hits grouped by project, Enter opens the first', async ({ page }) => {
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('search')).toBeFocused()
    await expect(page.getByTestId('palette')).toBeVisible()
    await page.keyboard.type('design')
    await expect(page.getByTestId('palette-row-0')).toContainText('SITE REDESIGN')
    await expect(page.getByTestId('palette').locator('.palette-group')).toHaveText(['homepage/', 'brand/', 'vault-worldwide/'])
    await expect(page.getByTestId('search-count')).toHaveText('3 tasks')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('palette-row-1')).toHaveClass(/is-active/)
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('drawer')).toContainText('SITE REDESIGN')
    await expect(page.getByTestId('palette')).toHaveCount(0)
  })

  test('p:homepage filters the board and shows a chip, and the chip removes it', async ({ page }) => {
    await page.getByTestId('search').fill('p:homepage')
    await expect(page.getByTestId('palette-row-0')).toContainText('homepage/')
    // Filter words do not narrow the board as a search would.
    await expect(page.getByTestId('search-count')).toHaveCount(0)
    await page.getByTestId('search').press('Enter')
    await expect(page.getByTestId('chip-project')).toContainText('homepage')
    await expect(card(page, 13)).toHaveCount(0)
    await expect(card(page, 2)).toBeVisible()
    await expect(page.getByTestId('search')).toHaveValue('')
    await page.getByTestId('chip-project').getByRole('button').click()
    await expect(card(page, 13)).toBeVisible()
  })

  test('s:active and ! chips, Filter… opens on p:, and the search input opens the palette on focus', async ({ page }) => {
    await page.getByTestId('search').fill('s:act !')
    await page.getByTestId('search').press('Enter')
    await expect(page.getByTestId('chip-status')).toContainText('ACTIVE')
    await expect(page.getByTestId('chip-urgent')).toBeVisible()
    await expect(page.locator('[data-card-id]')).toHaveCount(0)
    await page.getByTestId('chip-urgent').getByRole('button').click()
    await expect(page.locator('[data-card-id]')).toHaveCount(2)
    await page.getByTestId('filter-open').click()
    await expect(page.getByTestId('search')).toHaveValue('p:')
    await expect(page.getByTestId('palette').locator('.palette-row')).toHaveCount(5)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('palette')).toHaveCount(0)
    await page.getByTestId('search').click()
    await expect(page.getByTestId('palette')).toBeVisible()
  })

  test('a > line runs in the shell and prints its result', async ({ page }) => {
    await page.getByTestId('search').fill('> mv homepage/nav brand')
    await expect(page.getByTestId('palette-row-0')).toContainText('mv homepage/nav brand')
    await page.getByTestId('search').press('Enter')
    await expect(page.getByTestId('palette-out')).toHaveText('moved NAV RESTRUCTURE → brand/')
    await expect(card(page, 8)).toContainText('brand')
    await page.getByTestId('search').fill('done homepage/site')
    await expect(page.getByTestId('palette-row-0')).toContainText('done homepage/site')
    await page.getByTestId('search').press('Enter')
    expect(await laneOfCard(page, 2)).toBe('done')
  })
})

test.describe('vim keys', () => {
  test('j/k walk the lane, h/l cross lanes, Shift+L moves the card, o opens, x deletes', async ({ page }) => {
    await card(page, 2).focus()
    await page.keyboard.press('j')
    await expect(card(page, 19)).toBeFocused()
    await page.keyboard.press('k')
    await expect(card(page, 2)).toBeFocused()
    await page.keyboard.press('h')
    await expect(card(page, 11)).toBeFocused()
    await page.keyboard.press('l')
    await expect(card(page, 2)).toBeFocused()
    await page.keyboard.press('Shift+L')
    await expect.poll(() => laneOfCard(page, 2)).toBe('done')
    await expect(card(page, 2)).toBeFocused()
    await page.keyboard.press('Shift+H')
    await expect.poll(() => laneOfCard(page, 2)).toBe('active')
    await page.keyboard.press('o')
    await expect(page.getByTestId('drawer')).toContainText('SITE REDESIGN')
    await page.keyboard.press('Escape')
    await card(page, 8).focus()
    await page.keyboard.press('x')
    await expect(card(page, 8)).toHaveCount(0)
    await expect(page.getByTestId('toast')).toContainText('Deleted “NAV RESTRUCTURE”')
    await expect(card(page, 10)).toBeFocused()
  })

  test('the board itself takes focus, and the keys do nothing from a field', async ({ page }) => {
    await page.getByTestId('board').focus()
    await page.keyboard.press('j')
    await expect(card(page, 8)).toBeFocused()
    await page.getByTestId('shell-input').fill('x')
    await page.keyboard.press('x')
    await expect(page.getByTestId('shell-input')).toHaveValue('xx')
    await expect(card(page, 8)).toBeVisible()
    await page.getByTestId('search').fill('nav')
    await page.keyboard.press('x')
    await expect(page.getByTestId('search')).toHaveValue('navx')
    await page.keyboard.press('Escape')
    await expect(card(page, 8)).toBeVisible()
    expect(await saved(page)).toBeNull()
  })

  test('/ goes to search, ? shows the shortcuts, Esc and the menu close and open them', async ({ page }) => {
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('/')
    await expect(page.getByTestId('search')).toBeFocused()
    await expect(page.getByTestId('search')).toHaveValue('')
    await page.keyboard.press('Escape')
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('?')
    await expect(page.getByTestId('help')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toContainText('⇧ H')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('help')).toHaveCount(0)
    await page.getByTestId('menu').click()
    await page.getByTestId('menu-help').click()
    await expect(page.getByTestId('help')).toBeVisible()
    await page.getByTestId('help-close').click()
    await expect(page.getByTestId('help')).toHaveCount(0)
  })
})

test.describe('review fixes', () => {
  test('cards are compact with one meta line', async ({ page }) => {
    const box = await card(page, 2).boundingBox()
    expect(box!.height).toBeLessThan(70)
    await expect(card(page, 2).locator('.slab-meta')).toContainText('homepage')
    await expect(card(page, 2).locator('.slab-meta')).toContainText('2/5')
    const folder = await card(page, 2).locator('.slab-folder').boundingBox()
    const progress = await card(page, 2).locator('.slab-progress').boundingBox()
    expect(Math.abs(folder!.y - progress!.y)).toBeLessThan(3)
  })

  test('the tree puts the status right after the name, and its tools are 28px targets', async ({ page }) => {
    const name = await row(page, 2).locator('.stem-name').boundingBox()
    const status = await row(page, 2).locator('.stem-status').boundingBox()
    expect(status!.x - (name!.x + name!.width)).toBeLessThan(20)
    await row(page, 2).hover()
    const tool = await row(page, 2).locator('.stem-tool').first().boundingBox()
    expect(tool!.width).toBeGreaterThanOrEqual(28)
    expect(tool!.height).toBeGreaterThanOrEqual(28)
    const fold = await row(page, 1).locator('.stem-fold').boundingBox()
    expect(Math.round(fold!.width)).toBe(18)
  })

  test('the ⋯ menu walks with the arrow keys', async ({ page }) => {
    await page.getByTestId('menu').click()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-help')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-export')).toBeFocused()
    await page.keyboard.press('End')
    // The last item is whatever the menu ends with now (night mode, after the merge).
    await expect(page.locator('[role=menu] [role^=menuitem]:not([disabled])').last()).toBeFocused()
    await page.keyboard.press('Home')
    await expect(page.getByTestId('menu-help')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('a quiet saved stamp appears after a change', async ({ page }) => {
    await expect(page.getByTestId('saved')).toHaveCount(0)
    await sh(page, 'done homepage/nav')
    await expect(page.getByTestId('saved')).toHaveText('saved · just now')
  })
})
