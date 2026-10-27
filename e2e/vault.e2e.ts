import { expect, test, type Page } from '@playwright/test'

/*
 * One test per bug from the October 2026 review, plus the flows that replaced
 * them. Seed ids: homepage 1, SITE REDESIGN 2 (subtasks 3–7: two done), NAV
 * RESTRUCTURE 8, brand 9, UPDATE BRANDING 10, research 12, MARKET RESEARCH 13,
 * vault-worldwide 15, archive 20, OLD LANDING PAGE 21.
 */

const card = (page: Page, id: number) => page.getByTestId(`card-${id}`)
const row = (page: Page, id: number) => page.getByTestId(`tree-row-${id}`)
const laneOfCard = (page: Page, id: number) => card(page, id).locator('xpath=ancestor::section[@data-lane]').getAttribute('data-lane')
const saved = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('vault:doc') ?? 'null')?.doc ?? null) as { nodes: Array<Record<string, unknown>>; notes: Array<Record<string, unknown>> })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('board')).toBeVisible()
})

test.describe('text survives exactly', () => {
  test('quotes and newlines in titles, descriptions and notes, across a reload', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('drawer-body').click()
    const body = page.getByTestId('drawer-body-input')
    await body.fill('Say "hello"\n\nthen a second paragraph')
    await body.press('Escape')

    await page.getByTestId('add-subtask-2').click()
    await page.getByTestId('new-subtask-2').fill('Ship "v2" — ünïcode 🔥')
    await page.getByTestId('new-subtask-2').press('Enter')
    await page.getByTestId('new-subtask-2').press('Escape')

    await page.getByTestId('new-note').click()
    const note = page.getByRole('textbox', { name: 'Note' }).last()
    await note.type('line one')
    await note.press('Enter')
    await note.type('line "two"')
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })

    await page.reload()
    const doc = await saved(page)
    expect(doc.nodes.find((n) => n.id === 2)?.body).toBe('Say "hello"\n\nthen a second paragraph')
    expect(doc.nodes.some((n) => n.title === 'Ship "v2" — ünïcode 🔥')).toBe(true)
    expect(doc.notes.some((n) => n.text === 'line one\nline "two"')).toBe(true)
    await expect(page.getByRole('textbox', { name: 'Note' }).last()).toHaveValue('line one\nline "two"')
  })
})

test.describe('no key changes data behind your back', () => {
  test('Space with a card open does not move it', async ({ page }) => {
    await card(page, 2).click()
    await page.keyboard.press('Space')
    await page.keyboard.press('Space')
    expect(await laneOfCard(page, 2)).toBe('active')
  })

  test('Backspace on a focused filter does not delete anything', async ({ page }) => {
    await card(page, 8).click()
    await page.getByTestId('project-filter').focus()
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Delete')
    await expect(card(page, 8)).toBeVisible()
    expect((await saved(page))?.nodes.length ?? 21).toBe(21)
  })

  test('Tab moves focus; it does not restructure the tree unless the tree has focus', async ({ page }) => {
    await card(page, 8).click()
    await page.keyboard.press('Escape')
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    const doc = await saved(page)
    expect(doc === null || doc.nodes.find((n) => n.id === 8)?.parent === 1).toBe(true)
  })
})

test.describe('deleting is reversible', () => {
  test('Delete on a focused card removes it, with Undo in the toast', async ({ page }) => {
    await card(page, 8).focus()
    await page.keyboard.press('Delete')
    await expect(card(page, 8)).toHaveCount(0)
    await expect(page.getByTestId('toast')).toContainText('Deleted “NAV RESTRUCTURE”')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(card(page, 8)).toBeVisible()
  })

  test('deleting a task with subtasks says so, and Ctrl+Z brings all of it back', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('drawer-delete').click()
    await expect(page.getByTestId('toast')).toContainText('and 5 inside')
    await expect(row(page, 5)).toHaveCount(0)
    await page.locator('body').click({ position: { x: 2, y: 600 } })
    await page.keyboard.press('Control+z')
    await expect(card(page, 2)).toBeVisible()
    await expect(row(page, 5)).toBeVisible()
  })
})

test.describe('notes', () => {
  test('clearing one note removes only that note, and can be undone', async ({ page }) => {
    for (const text of ['second', 'third']) {
      await page.getByTestId('new-note').click()
      await page.getByRole('textbox', { name: 'Note' }).last().fill(text)
    }
    const notes = page.getByRole('textbox', { name: 'Note' })
    await expect(notes).toHaveCount(3)
    await notes.nth(1).fill('')
    await notes.nth(1).press('Backspace')
    await notes.nth(1).press('Backspace')
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
    await expect(notes).toHaveCount(2)
    await expect(notes.nth(1)).toHaveValue('third')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(notes).toHaveCount(3)
    await expect(notes.nth(1)).toHaveValue('second')
  })

  test('a new note left empty goes quietly', async ({ page }) => {
    await page.getByTestId('new-note').click()
    await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('textbox', { name: 'Note' })).toHaveCount(1)
    await expect(page.getByTestId('toast')).toHaveCount(0)
  })
})

test.describe('board', () => {
  test('moving a card to another lane and back keeps its subtask ticks', async ({ page }) => {
    const from = await card(page, 2).boundingBox()
    const to = await page.getByTestId('lane-pending').boundingBox()
    await page.mouse.move(from!.x + 40, from!.y + 20)
    await page.mouse.down()
    await page.mouse.move(to!.x + 60, to!.y + 400, { steps: 8 })
    await page.mouse.up()
    await expect.poll(() => laneOfCard(page, 2)).toBe('pending')
    for (let i = 0; i < 2; i++) {
      await card(page, 2).hover()
      await page.getByTestId('advance-2').click()
    }
    expect(await laneOfCard(page, 2)).toBe('active')
    const doc = await saved(page)
    expect(doc.nodes.filter((n) => n.parent === 2 && n.status === 'done').length).toBe(2)
    await expect(card(page, 2)).toContainText('2/5')
  })

  test('New task with a project filter lands in that project, visibly', async ({ page }) => {
    await page.getByTestId('project-filter').selectOption({ label: 'research' })
    await page.getByTestId('new-task').click()
    await page.getByRole('textbox', { name: 'New task name' }).fill('FIND COMPETITORS')
    await page.getByRole('textbox', { name: 'New task name' }).press('Enter')
    await expect(page.getByTestId('lane-pending')).toContainText('FIND COMPETITORS')
    const doc = await saved(page)
    expect(doc.nodes.find((n) => n.title === 'FIND COMPETITORS')?.parent).toBe(12)
  })

  test('a New task left empty leaves nothing behind', async ({ page }) => {
    await page.getByTestId('new-task').click()
    await page.getByRole('textbox', { name: 'New task name' }).press('Escape')
    await expect(page.getByTestId('draft-card')).toHaveCount(0)
    expect(await saved(page)).toBeNull()
  })

  test('urgent can be set, shows on the card and the tree, and filters', async ({ page }) => {
    await card(page, 13).click()
    await page.getByTestId('drawer-urgent').click()
    await expect(card(page, 13)).toContainText('URGENT')
    await expect(row(page, 13)).toContainText('!')
    await page.getByTestId('urgent-filter').click()
    await expect(page.locator('[data-card-id]')).toHaveCount(1)
  })
})

test.describe('search', () => {
  test('a subtask hit shows its card, counts it, and Enter opens it', async ({ page }) => {
    await page.getByTestId('search').fill('wire')
    await expect(page.getByTestId('search-count')).toHaveText('1 task')
    await expect(page.locator('[data-card-id]')).toHaveCount(1)
    await expect(card(page, 2).locator('mark')).toHaveCount(0)
    await expect(row(page, 5).locator('mark')).toHaveText('wire')
    await page.getByTestId('search').press('Enter')
    await expect(page.getByTestId('drawer')).toContainText('SITE REDESIGN')
    await expect(page.getByTestId('drawer').locator('mark')).toHaveText('wire')
  })

  test('descriptions are searched too', async ({ page }) => {
    await page.getByTestId('search').fill('footer')
    await expect(page.locator('[data-card-id]')).toHaveCount(1)
    await expect(card(page, 8)).toBeVisible()
  })
})

test.describe('directory', () => {
  test('rename works for a subtask and for a task in any project, and the board follows', async ({ page }) => {
    await row(page, 5).dblclick()
    await page.getByTestId('tree-input-5').fill('Wireframes, rough')
    await page.getByTestId('tree-input-5').press('Enter')
    await expect(row(page, 5)).toContainText('Wireframes, rough')

    await row(page, 13).click()
    await page.keyboard.press('Enter')
    await page.getByTestId('tree-input-13').fill('MARKET SCAN')
    await page.getByTestId('tree-input-13').press('Enter')
    await expect(card(page, 13)).toContainText('MARKET SCAN')
  })

  test('add, indent and delete from the keyboard', async ({ page }) => {
    await row(page, 10).click()
    await page.keyboard.press('+')
    await page.getByTestId('tree-draft-input').fill('pick a typeface')
    await page.getByTestId('tree-draft-input').press('Enter')
    await page.getByTestId('tree-draft-input').fill('pick colours')
    await page.getByTestId('tree-draft-input').press('Escape')
    let doc = await saved(page)
    const kids = doc.nodes.filter((n) => n.parent === 10).map((n) => n.title)
    expect(kids).toEqual(['pick a typeface', 'pick colours'])

    const colours = doc.nodes.find((n) => n.title === 'pick colours')!.id as number
    // The row just made is already selected and the tree has focus again.
    await expect(row(page, colours)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Tab')
    doc = await saved(page)
    expect(doc.nodes.find((n) => n.id === colours)?.parent).toBe(doc.nodes.find((n) => n.title === 'pick a typeface')!.id)

    await page.keyboard.press('Delete')
    await expect(row(page, colours)).toHaveCount(0)
    await page.keyboard.press('Control+z')
    await expect(row(page, colours)).toBeVisible()
  })

  test('status set from the tree moves the card; ticking a subtask updates progress', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Status of NAV RESTRUCTURE' }).selectOption('done')
    expect(await laneOfCard(page, 8)).toBe('done')
    await row(page, 5).getByRole('button', { name: 'Complete Create wireframes' }).click()
    await expect(card(page, 2)).toContainText('3/5')
  })

  test('arrow keys walk the tree without opening or changing anything', async ({ page }) => {
    await row(page, 1).click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(row(page, 3)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(row(page, 2)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(row(page, 3)).toHaveCount(0)
    expect(await saved(page)).toBeNull()
  })
})

test.describe('persistence', () => {
  test('migrates the old SPECK save on first load and says so', async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(
        'speck-os-v2',
        'PIPE vault\nNEST\n  NODE 1 "client" status none\n    NODE 10 "MY REAL TASK" status rnd\n      NODE 11 "line" status done\nDUMP\n  NOTE 01.02.26 "kept"',
      )
    })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.getByText(/Brought across 3 items and 1 notes/)).toBeVisible()
    await expect(card(page, 10)).toContainText('MY REAL TASK')
    expect(await laneOfCard(page, 10)).toBe('rnd')
    await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue('kept')
    await ctx.close()
  })

  test('an unreadable save is set aside and the newest snapshot loads', async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      const doc = { nodes: [{ id: 1, title: 'p', status: 'none', parent: null }, { id: 2, title: 'FROM SNAPSHOT', status: 'active', parent: 1 }], notes: [] }
      localStorage.setItem('vault:backups', JSON.stringify([{ at: Date.now() - 60000, doc }]))
      localStorage.setItem('vault:doc', '{"app":"vault","doc":{"nodes":[{"id":1,')
    })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.getByText(/couldn't be read/)).toBeVisible()
    await expect(card(page, 2)).toContainText('FROM SNAPSHOT')
    const parked = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('vault:unreadable:')).length)
    expect(parked).toBe(1)
    await ctx.close()
  })

  test('export then import gives back the same board', async ({ page }) => {
    await card(page, 8).focus()
    await page.keyboard.press('Delete')
    await page.getByTestId('menu').click()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('menu-export').click()])
    const path = await download.path()
    expect(download.suggestedFilename()).toMatch(/^vault-\d{4}-\d{2}-\d{2}-\d{4}\.json$/)

    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(card(page, 8)).toBeVisible()
    await page.getByTestId('import-file').setInputFiles(path!)
    await expect(card(page, 8)).toHaveCount(0)
    await expect(page.getByTestId('toast')).toContainText('Imported 20 items')
  })

  test('two tabs stay in step', async ({ context }) => {
    const a = await context.newPage()
    const b = await context.newPage()
    await a.goto('/')
    await b.goto('/')
    await card(a, 13).click()
    await a.getByTestId('drawer-urgent').click()
    await expect(card(b, 13)).toContainText('URGENT')
    await card(b, 8).focus()
    await b.keyboard.press('Delete')
    await expect(card(a, 8)).toHaveCount(0)
  })
})

test.describe('second review', () => {
  test("the toast's Undo brings back the delete it reports, not whatever happened since", async ({ page }) => {
    await card(page, 8).focus()
    await page.keyboard.press('Delete')
    await card(page, 13).hover()
    await page.getByTestId('advance-13').click()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(card(page, 8)).toBeVisible()
    expect(await laneOfCard(page, 13)).toBe('active')
  })

  test("Ctrl+Z in one tab does not undo the other tab's work", async ({ context }) => {
    const a = await context.newPage()
    const b = await context.newPage()
    await a.goto('/')
    await b.goto('/')
    await card(a, 8).focus()
    await a.keyboard.press('Delete')
    await expect(card(b, 8)).toHaveCount(0)
    await b.locator('body').click({ position: { x: 2, y: 2 } })
    await b.keyboard.press('Control+z')
    await expect(card(b, 8)).toHaveCount(0)
    await expect(card(a, 8)).toHaveCount(0)
  })

  for (const setup of ['urgent', 'status', 'search'] as const) {
    test(`a new task made under the ${setup} filter is visible`, async ({ page }) => {
      if (setup === 'urgent') await page.getByTestId('urgent-filter').click()
      if (setup === 'status') await page.getByTestId('status-filter').selectOption('active')
      if (setup === 'search') await page.getByTestId('search').fill('wire')
      await page.getByTestId('new-task').click()
      await page.getByRole('textbox', { name: 'New task name' }).fill('MADE UNDER FILTER')
      await page.getByRole('textbox', { name: 'New task name' }).press('Enter')
      await expect(page.locator('[data-card-id]', { hasText: 'MADE UNDER FILTER' })).toBeVisible()
      // A status filter puts the new task in that lane, so nothing needs clearing.
      if (setup !== 'status') await expect(page.getByTestId('toast')).toContainText('Cleared the')
    })
  }

  test('+ in the tree during a search shows the new row', async ({ page }) => {
    await page.getByTestId('search').fill('wire')
    await row(page, 5).click()
    await page.getByTestId('tree').press('+')
    await expect(page.getByTestId('tree-draft-input')).toBeVisible()
    await page.getByTestId('tree-draft-input').fill('rough sketches')
    await page.getByTestId('tree-draft-input').press('Escape')
    await expect(page.getByTestId('directory')).toContainText('rough sketches')
  })

  test('outdent then indent keeps the lane', async ({ page }) => {
    await row(page, 2).click()
    await page.getByTestId('tree').press('Shift+Tab')
    await page.getByTestId('tree').press('Tab')
    expect(await laneOfCard(page, 2)).toBe('active')
  })

  test("a click on the selected row's name renames it", async ({ page }) => {
    await row(page, 13).click()
    await row(page, 13).locator('.stem-name').click()
    await expect(page.getByTestId('tree-input-13')).toBeVisible()
  })

  test('a nested subtask shows in the drawer and counts', async ({ page }) => {
    await row(page, 5).click()
    await page.getByTestId('tree').press('+')
    await page.getByTestId('tree-draft-input').fill('low-fi first')
    await page.getByTestId('tree-draft-input').press('Escape')
    await card(page, 2).click()
    await expect(page.getByTestId('drawer')).toContainText('low-fi first')
    await expect(card(page, 2)).toContainText('2/6')
  })

  test('Esc on the menu leaves the drawer open', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('menu').click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.getByTestId('drawer')).toBeVisible()
  })

  test('a hostile import loads safely and the board keeps working', async ({ page }, info) => {
    test.setTimeout(60_000)
    const chain = Array.from({ length: 3000 }, (_, i) => ({ id: i + 1, title: `n${i}`, status: 'pending', parent: i === 0 ? null : i }))
    const nodes = [{ id: 9007199254740992, title: 'HUGE', status: 'none', parent: null }, ...chain]
    const file = info.outputPath('hostile.json')
    await import('node:fs').then((fs) => fs.writeFileSync(file, JSON.stringify({ nodes, notes: [] })))
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.getByTestId('import-file').setInputFiles(file)
    await expect(page.getByTestId('toast')).toContainText('Imported', { timeout: 20_000 })
    await page.getByTestId('new-task').click()
    await page.getByRole('textbox', { name: 'New task name' }).fill('STILL WORKS')
    await page.getByRole('textbox', { name: 'New task name' }).press('Enter')
    await expect(page.locator('[data-card-id]', { hasText: 'STILL WORKS' })).toBeVisible()
    expect(errors).toEqual([])
  })
})
