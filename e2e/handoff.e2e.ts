import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

/*
 * The agent handoff: links on a job, the brief that goes out, the report
 * that comes back, the session clock, and the inbox. Seed ids: homepage 1,
 * SITE REDESIGN 2 (subtasks 3–7, of which 3 and 4 are done; 5 is "Create
 * wireframes"), NAV RESTRUCTURE 8.
 */

const card = (page: Page, id: number) => page.getByTestId(`card-${id}`)
type SavedDoc = {
  nodes: Array<Record<string, unknown>>
  events: Array<{ at: number; kind: string; node?: number; text: string }>
}
const saved = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('vault:doc') ?? 'null')?.doc ?? null) as SavedDoc)

/** A paste the way the browser would deliver it, without going through the system clipboard. */
async function pasteInto(page: Page, selector: string, text: string) {
  await page.evaluate(
    ([sel, body]) => {
      const el = document.querySelector(sel)
      if (!el) throw new Error(`no ${sel}`)
      const data = new DataTransfer()
      data.setData('text/plain', body)
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
    },
    [selector, text],
  )
}

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('board')).toBeVisible()
})

test.describe('links', () => {
  test('a link added in the drawer is a chip of its kind, counted on the card, and removable', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('add-link-2').click()
    await page.getByTestId('link-url').fill('https://github.com/bad-form/vault')
    await page.getByTestId('link-url').press('Enter')

    const repo = page.getByTestId('links').locator('.link[data-kind="repo"]')
    await expect(repo).toHaveCount(1)
    await expect(repo.locator('.link-chip')).toHaveText('github.com')
    await expect(repo.locator('.link-chip')).toHaveAttribute('href', 'https://github.com/bad-form/vault')
    await expect(repo.locator('.link-chip')).toHaveAttribute('target', '_blank')
    await expect(repo.locator('.link-chip')).toHaveAttribute('rel', /noopener/)
    await expect(page.getByTestId('links-2')).toHaveText('1')

    // A label of your own, a bare host without its scheme, and the kind read off the host.
    await page.getByTestId('add-link-2').click()
    await page.getByTestId('link-url').fill('vault-xyz.vercel.app')
    await page.getByTestId('link-label').fill('Preview')
    await page.getByTestId('link-label').press('Enter')
    await expect(page.getByTestId('links').locator('.link[data-kind="deploy"] .link-chip')).toHaveText('Preview')
    await expect(page.getByTestId('links-2')).toHaveText('2')
    await expect(page.getByTestId('link-form')).toHaveCount(0)

    const doc = await saved(page)
    expect(doc.nodes.find((n) => n.id === 2)?.links).toEqual([
      { label: 'github.com', url: 'https://github.com/bad-form/vault' },
      { label: 'Preview', url: 'https://vault-xyz.vercel.app' },
    ])

    await repo.hover()
    await repo.getByRole('button', { name: 'Remove link github.com' }).click()
    await expect(page.getByTestId('links-2')).toHaveText('1')
    await expect(page.getByTestId('links').locator('.link[data-kind]')).toHaveCount(1)
  })

  test('something that is not an address is refused, and Esc leaves the form', async ({ page }) => {
    await card(page, 8).click()
    await page.getByTestId('add-link-8').click()
    await page.getByTestId('link-url').fill('not a link')
    await page.getByTestId('link-url').press('Enter')
    await expect(page.getByTestId('link-form')).toContainText('Needs an http(s) address')
    await page.getByTestId('link-url').press('Escape')
    await expect(page.getByTestId('link-form')).toHaveCount(0)
    await expect(page.getByTestId('drawer')).toBeVisible()
    expect(await saved(page)).toBeNull()
  })

  test('a URL pasted into the description is offered as a link', async ({ page }) => {
    await card(page, 8).click()
    await page.getByTestId('drawer-body').click()
    await pasteInto(page, '[data-testid="drawer-body-input"]', 'comps are at https://www.figma.com/file/abc/Homepage, see there')
    await expect(page.getByTestId('link-offer')).toContainText('Pasted figma.com')
    // The offer outlives the edit: leave the description, then take it.
    await page.getByTestId('drawer-body-input').press('Escape')
    await expect(page.getByTestId('drawer-body-input')).toHaveCount(0)
    await page.getByRole('button', { name: 'Add as link' }).click()
    await expect(page.getByTestId('link-offer')).toHaveCount(0)
    await expect(page.getByTestId('links').locator('.link[data-kind="figma"] .link-chip')).toHaveText('figma.com')
    await expect(page.getByTestId('links-8')).toHaveText('1')
  })
})

test.describe('brief', () => {
  test('Copy as brief puts the task on the clipboard as markdown and notes it on the trail', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('copy-brief').click()
    await expect(page.getByTestId('toast')).toContainText(/Brief copied \(\d+ lines\)/)
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toContain('# SITE REDESIGN\nProject: homepage · Status: ACTIVE · Due: — · Urgent: no\n## Goal\n')
    expect(text).toContain('- [x] Review current homepage analytics\n- [x] Define new information hierarchy\n- [ ] Create wireframes\n')
    expect(text).toContain('## Done when\nEvery subtask above is ticked and the status is DONE.\n## Report back\n')
    const doc = await saved(page)
    expect(doc.events.filter((e) => e.kind === 'report' && e.node === 2).map((e) => e.text)).toEqual(['brief copied'])
  })

  test('the ⋯ menu copies a brief for the selected card', async ({ page }) => {
    await page.getByTestId('menu').click()
    await expect(page.getByTestId('menu-copy-brief')).toBeDisabled()
    await page.keyboard.press('Escape')
    await card(page, 8).click()
    await page.getByTestId('menu').click()
    await page.getByTestId('menu-copy-brief').click()
    await expect(page.getByTestId('toast')).toContainText('Brief copied')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('# NAV RESTRUCTURE')
  })

  test('Download .md saves the brief under the task name', async ({ page }) => {
    await card(page, 2).click()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-brief').click()])
    expect(download.suggestedFilename()).toBe('site-redesign-brief.md')
    expect(readFileSync((await download.path())!, 'utf8')).toContain('# SITE REDESIGN')
  })
})

test.describe('report', () => {
  test('a pasted report ticks the matched line and adds the new one, and one Ctrl+Z takes all of it back', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('paste-report').click()
    const input = page.getByTestId('report-input')
    await expect(input).toBeFocused()
    await input.fill('## Report\n- [x] create wireframe\n- [ ] Ship to staging\nLeft off: waiting on copy\nRan the build twice.')

    const plan = page.getByTestId('report-plan')
    await expect(plan.locator('li')).toHaveCount(3)
    await expect(plan.locator('li[data-kind="tick"]')).toContainText('Create wireframes')
    await expect(plan.locator('li[data-kind="add"]')).toContainText('Ship to staging')
    await expect(plan.locator('li[data-kind="leftOff"]')).toContainText('waiting on copy')
    await expect(page.getByTestId('report-modal')).toContainText('Not applied: Ran the build twice.')

    await page.getByTestId('report-apply').click()
    await expect(page.getByTestId('report-modal')).toHaveCount(0)
    await expect(page.getByTestId('toast')).toContainText('report: 1 ticked, 1 added, left off noted')
    await expect(card(page, 2)).toContainText('3/6')
    await expect(page.getByTestId('drawer')).toContainText('Ship to staging')
    let doc = await saved(page)
    expect(doc.nodes.find((n) => n.id === 2)?.leftOff).toBe('waiting on copy')
    expect(doc.events.filter((e) => e.kind === 'report').map((e) => e.text)).toEqual(['report: 1 ticked, 1 added, left off noted'])

    await page.keyboard.press('Control+z')
    await expect(card(page, 2)).toContainText('2/5')
    await expect(page.getByTestId('drawer')).not.toContainText('Ship to staging')
    doc = await saved(page)
    expect(doc.nodes.find((n) => n.id === 2)?.leftOff).toBeUndefined()
    expect(doc.events.filter((e) => e.kind === 'report')).toHaveLength(0)
  })

  test('an unticked row in the plan is left out', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('paste-report').click()
    await page.getByTestId('report-input').fill('* [X] Add motion prototypes\n* [ ] Something new')
    await expect(page.getByTestId('report-apply')).toHaveText('Apply (2)')
    await page.getByTestId('report-plan').locator('li[data-kind="add"] input').uncheck()
    await expect(page.getByTestId('report-apply')).toHaveText('Apply (1)')
    await page.getByTestId('report-apply').click()
    await expect(page.getByTestId('toast')).toContainText('report: 1 ticked')
    await expect(card(page, 2)).toContainText('3/5')
  })

  test('Esc closes the panel and leaves the drawer open', async ({ page }) => {
    await card(page, 2).click()
    await page.getByTestId('paste-report').click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('report-modal')).toHaveCount(0)
    await expect(page.getByTestId('drawer')).toBeVisible()
  })
})

test.describe('session clock', () => {
  test('the clock resumes after a reload, Stop books the time, and the month shows it', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('vault:session', JSON.stringify({ id: 2, startedAt: Date.now() - 95_000 })))
    await page.reload()
    const clock = page.getByTestId('clock')
    await expect(clock).toHaveAttribute('aria-label', /^Session on SITE REDESIGN/)
    await expect(page.getByTestId('clock-time')).toHaveText(/^00:01:(3[5-9]|4\d|5\d)$/)
    // At 1440 the chips need the room, so the plaque waits for a wider field; the clock never covers a chip.
    await expect(clock.locator('.clock-name')).toBeHidden()
    const [chip, box] = await Promise.all([page.getByTestId('urgent-filter').boundingBox(), clock.boundingBox()])
    expect(chip!.x + chip!.width).toBeLessThanOrEqual(box!.x)
    await page.setViewportSize({ width: 1680, height: 900 })
    await expect(clock.locator('.clock-name')).toHaveText('SITE REDESIGN')
    await page.setViewportSize({ width: 1440, height: 900 })

    await page.getByTestId('clock-stop').click()
    await expect(page.getByTestId('clock')).toHaveCount(0)
    await expect(page.getByTestId('toast')).toContainText(/1m \d\ds logged to SITE REDESIGN/)
    const doc = await saved(page)
    const spent = doc.nodes.find((n) => n.id === 2)?.spent as number
    expect(spent).toBeGreaterThanOrEqual(95)
    expect(spent).toBeLessThan(120)
    expect(doc.events.some((e) => e.kind === 'note' && e.node === 2 && /^session 1m \d\ds$/.test(e.text))).toBe(true)
    expect(await page.evaluate(() => localStorage.getItem('vault:session'))).toBeNull()

    await card(page, 2).click()
    await expect(page.getByTestId('spent')).toContainText(/1m \d\ds spent/)

    await page.getByTestId('menu').click()
    await page.getByTestId('menu-timesheet').click()
    const sheet = page.getByTestId('timesheet')
    await expect(sheet.locator('tbody tr')).toHaveCount(1)
    await expect(sheet.locator('tbody tr')).toContainText(['homepage'])
    // The month's column is read back off the trail and agrees with what the task was given.
    await expect(sheet.locator('tbody td').nth(0)).toHaveText(/^1m \d\ds$/)
    await expect(sheet.locator('tbody td').nth(1)).toHaveText('0.03')
    await expect(sheet.locator('tbody td').nth(2)).toHaveText(await sheet.locator('tbody td').nth(0).innerText())
  })

  test('Start session in the drawer starts the clock on that task; the menu stops it', async ({ page }) => {
    await card(page, 8).click()
    await page.getByTestId('session-toggle').click()
    await expect(page.getByTestId('clock')).toHaveAttribute('aria-label', /^Session on NAV RESTRUCTURE/)
    await expect(page.getByTestId('session-toggle')).toHaveText(/Stop session/)
    await expect(page.getByTestId('spent')).toContainText('Clock running')
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('vault:session') ?? 'null'))?.id).toBe(8)

    // The clock itself is the way back to the task.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('drawer')).toHaveCount(0)
    await page.getByTestId('clock').locator('.clock-task').click()
    await expect(page.getByTestId('drawer')).toContainText('NAV RESTRUCTURE')

    await page.getByTestId('menu').click()
    await expect(page.getByTestId('menu-session')).toHaveText('Stop session')
    await page.getByTestId('menu-session').click()
    await expect(page.getByTestId('clock')).toHaveCount(0)
    await expect(page.getByTestId('session-toggle')).toHaveText(/Start session/)
  })
})

test.describe('inbox', () => {
  test('a report left in vault:inbox shows a banner, and Review applies it', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
    await ctx.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem('vault:inbox', JSON.stringify([{ at: Date.now(), taskId: 2, text: '## Report\n- [x] Create wireframes\nLeft off: handed back' }]))
    })
    const page = await ctx.newPage()
    await page.goto('/')
    const banner = page.getByTestId('inbox-banner')
    await expect(banner).toContainText('1 report waiting for SITE REDESIGN')
    await page.getByTestId('inbox-review').click()
    await expect(page.getByTestId('report-modal')).toContainText('For SITE REDESIGN')
    await expect(page.getByTestId('report-input')).toHaveValue(/Create wireframes/)
    await page.getByTestId('report-apply').click()
    await expect(card(page, 2)).toContainText('3/5')
    await expect(banner).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('vault:inbox'))).toBeNull()
    await ctx.close()
  })

  test('a report written by another tab shows up without a reload, and can be dismissed', async ({ context }) => {
    const a = await context.newPage()
    const b = await context.newPage()
    await a.goto('/')
    await b.goto('/')
    await b.evaluate(() => localStorage.setItem('vault:inbox', JSON.stringify([{ at: Date.now(), text: '- [x] something' }])))
    await expect(a.getByTestId('inbox-banner')).toContainText('1 report waiting')
    await a.getByTestId('inbox-review').click()
    // No task named: the panel asks which one.
    await expect(a.getByTestId('report-task')).toBeVisible()
    await a.keyboard.press('Escape')
    await a.getByRole('button', { name: 'Dismiss report' }).click()
    await expect(a.getByTestId('inbox-banner')).toHaveCount(0)
    await expect(b.getByTestId('inbox-banner')).toHaveCount(0)
  })
})
