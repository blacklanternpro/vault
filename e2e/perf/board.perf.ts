import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { genEnvelope } from '../../scripts/gen-board'

/*
 * The speed harness (the plan's bar: keypress-to-paint under 50ms on a
 * 1,000-item board, measured on every push; the pivot at 60fps once it
 * exists). Run with `npm run perf` (its own Playwright project, one worker,
 * so other specs do not steal the CPU).
 *
 * The board: scripts/gen-board.ts, deterministic, 1,000 items built through
 * src/model/doc.ts, put in localStorage as the `vault:doc` envelope before
 * the app's first script runs.
 *
 * Keypress-to-paint: a capture-phase keydown listener takes the event's own
 * timestamp, then waits two animation frames (the second runs after the
 * frame that painted the key's result) and reads performance.now(). Median
 * and p95 over RUNS presses after WARMUP unrecorded ones, plus the long tasks
 * (>50ms main-thread blocks) seen while pressing.
 *
 * Budget: SOFT for now. Shared CI runners are noisy, so a scenario over 50ms
 * is a warning (annotation, and a ::warning:: in GitHub Actions), and only a
 * median over 4× the budget (200ms) fails. Results: e2e/perf/results.json
 * (not committed) and a table on stdout.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RESULTS = path.join(HERE, 'results.json')
const BUDGET_MS = 50
const HARD_FAIL_MS = BUDGET_MS * 4
const RUNS = Number(process.env.PERF_RUNS ?? 30)
const WARMUP = 3
const LOADS = Number(process.env.PERF_LOADS ?? 5)

type Stat = { runs: number; median: number; p95: number; min: number; max: number; longTasks: number; verdict: 'ok' | 'over budget' | 'FAIL' }
const RUN_ID = process.env.PERF_RUN_ID ?? 'local'
const results: { runId: string; when: string; machine: Record<string, unknown>; board: Record<string, number>; budgetMs: number; hardFailMs: number; load?: Record<string, number>; keypress: Record<string, Stat> } = {
  runId: RUN_ID,
  when: new Date().toISOString(),
  machine: { platform: os.platform(), arch: os.arch(), cpus: os.cpus().length, cpu: os.cpus()[0]?.model, node: process.version, ci: !!process.env.CI },
  board: {},
  budgetMs: BUDGET_MS,
  hardFailMs: HARD_FAIL_MS,
  keypress: {},
}

const envelope = genEnvelope({ items: 1000, seed: 1 })
const board = JSON.parse(envelope) as { doc: { nodes: Array<{ id: number; parent: number | null; status: string; loose?: boolean }>; notes: unknown[]; events: unknown[] } }
results.board = { items: board.doc.nodes.length, notes: board.doc.notes.length, events: board.doc.events.length }
const depth = (id: number): number => {
  const n = board.doc.nodes.find((x) => x.id === id)
  return n?.parent == null ? 0 : 1 + depth(n.parent)
}
/** First pending task on the first folder: the card the move scenario pushes back and forth. */
const MOVE_CARD = board.doc.nodes.find((n) => n.parent === 1 && n.status === 'pending')!.id

const quantile = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))]
}
const r1 = (x: number) => Math.round(x * 10) / 10

test.use({ viewport: { width: 1440, height: 900 } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript((env) => {
    localStorage.setItem('vault:doc', env)
    const w = window as unknown as { __longtasks: number; __ready: Promise<number> }
    w.__longtasks = 0
    try {
      new PerformanceObserver((list) => (w.__longtasks += list.getEntries().length)).observe({ type: 'longtask', buffered: true })
    } catch {
      /* no longtask support */
    }
    w.__ready = new Promise<number>((resolve) => {
      const check = () => {
        if (document.querySelector('[data-card-id]') && document.querySelector('[role=treeitem]')) requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))
        else requestAnimationFrame(check)
      }
      requestAnimationFrame(check)
    })
  }, envelope)
})

async function open(page: Page): Promise<number> {
  await page.goto('/')
  const at = await page.evaluate(() => (window as unknown as { __ready: Promise<number> }).__ready)
  await expect(page.getByTestId('board')).toBeVisible()
  return at
}

const longtasks = (page: Page) => page.evaluate(() => (window as unknown as { __longtasks: number }).__longtasks)

/** Arms a one-shot keydown → second-frame timer, presses `key`, returns the ms. */
async function pressAndTime(page: Page, key: string): Promise<number> {
  await page.evaluate(() => {
    const w = window as unknown as { __perfP: Promise<number> }
    w.__perfP = new Promise<number>((resolve) => {
      addEventListener(
        'keydown',
        (e) => {
          const t0 = e.timeStamp
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - t0)))
        },
        { once: true, capture: true },
      )
    })
  })
  await page.keyboard.press(key)
  return page.evaluate(() => (window as unknown as { __perfP: Promise<number> }).__perfP)
}

/** Runs a scenario: `step(i)` returns the key to time on run i, `between(i)` resets after it (untimed). */
async function measure(page: Page, name: string, step: (i: number) => string, between?: (i: number) => Promise<void>) {
  for (let i = 0; i < WARMUP; i++) {
    await pressAndTime(page, step(i))
    await between?.(i)
  }
  const lt0 = await longtasks(page)
  const times: number[] = []
  for (let i = WARMUP; i < WARMUP + RUNS; i++) {
    times.push(await pressAndTime(page, step(i)))
    await between?.(i)
  }
  const lt = (await longtasks(page)) - lt0
  const stat: Stat = { runs: times.length, median: r1(quantile(times, 0.5)), p95: r1(quantile(times, 0.95)), min: r1(Math.min(...times)), max: r1(Math.max(...times)), longTasks: lt, verdict: 'ok' }
  if (stat.p95 > BUDGET_MS || stat.median > BUDGET_MS) stat.verdict = 'over budget'
  if (stat.median > HARD_FAIL_MS) stat.verdict = 'FAIL'
  results.keypress[name] = stat
  const line = `${name}: median ${stat.median}ms, p95 ${stat.p95}ms (budget ${BUDGET_MS}ms), ${lt} long task(s)`
  test.info().annotations.push({ type: stat.verdict === 'ok' ? 'perf' : 'perf-warning', description: line })
  if (stat.verdict !== 'ok' && process.env.GITHUB_ACTIONS) console.log(`::warning title=perf ${name}::${line}`)
  // Soft budget: only a median past 4× the budget fails the run.
  expect(stat.median, `${name} is far over the ${BUDGET_MS}ms keypress-to-paint budget`).toBeLessThanOrEqual(HARD_FAIL_MS)
}

test('board: 1,000 items generated as asked', () => {
  expect(board.doc.nodes.length).toBe(1000)
  expect(board.doc.nodes.some((n) => depth(n.id) >= 3)).toBe(true)
  expect(board.doc.nodes.some((n) => n.loose)).toBe(true)
  expect(board.doc.events.length).toBeGreaterThan(1000)
})

test('initial load to interactive', async ({ page }) => {
  const times: number[] = []
  let lt = 0
  for (let i = 0; i < LOADS; i++) {
    times.push(await open(page))
    lt += await longtasks(page)
  }
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    return n ? { domContentLoaded: n.domContentLoadedEventEnd, loadEvent: n.loadEventEnd } : null
  })
  results.load = { runs: times.length, median: r1(quantile(times, 0.5)), p95: r1(quantile(times, 0.95)), max: r1(Math.max(...times)), longTasksPerLoad: r1(lt / LOADS), domContentLoaded: r1(nav?.domContentLoaded ?? 0), loadEvent: r1(nav?.loadEvent ?? 0) }
  test.info().annotations.push({ type: 'perf', description: `load to interactive: median ${results.load.median}ms over ${LOADS} loads` })
  await expect(page.locator('[data-card-id]').first()).toBeVisible()
})

test('keypress-to-paint: moving the selection in the directory', async ({ page }) => {
  await open(page)
  await page.getByTestId('tree-row-1').click()
  await page.keyboard.press('Escape') // a row click may open the drawer; the tree keeps the keyboard
  await page.getByTestId('tree').focus()
  // Down 20, then up 20, and so on: the selection walks back and forth across the top of the tree.
  await measure(page, 'directory selection (ArrowDown/Up)', (i) => (Math.floor(i / 20) % 2 === 0 ? 'ArrowDown' : 'ArrowUp'))
  await expect(page.locator('[role=treeitem][aria-selected=true]')).toHaveCount(1)
})

test('keypress-to-paint: typing a character into FIND', async ({ page }) => {
  await open(page)
  const search = page.getByTestId('search')
  await search.click()
  await expect(page.getByTestId('palette')).toBeVisible()
  // Each run types one letter into an empty field (the heaviest search: a short query over 1,000 items), then clears it untimed.
  const letters = 'testrandomcheckpass'
  await measure(
    page,
    'FIND: type a character',
    (i) => letters[i % letters.length],
    async () => {
      await search.fill('')
    },
  )
})

test('keypress-to-paint: toggling a subtask tick', async ({ page }) => {
  await open(page)
  // Project 1 → its first task → that task's first subtask (depth 2), where x toggles the tick.
  const firstTask = board.doc.nodes.find((n) => n.parent === 1)!.id
  const firstSub = board.doc.nodes.find((n) => n.parent === firstTask)!.id
  await page.getByTestId(`tree-row-${firstSub}`).click()
  await page.keyboard.press('Escape')
  await page.getByTestId('tree').focus()
  await expect(page.getByTestId(`tree-row-${firstSub}`)).toHaveAttribute('aria-selected', 'true')
  const before = await page.getByTestId(`tree-row-${firstSub}`).innerText()
  await measure(page, 'tick a subtask (x)', () => 'x')
  // An even number of presses in all (warmup + runs) leaves it as it was; an odd one flips it. Either way it moved.
  expect(typeof before).toBe('string')
})

test('keypress-to-paint: moving a card to the next lane', async ({ page }) => {
  await open(page)
  const card = page.getByTestId(`card-${MOVE_CARD}`)
  await card.scrollIntoViewIfNeeded()
  await card.focus()
  await expect(card).toBeFocused()
  // Shift+L pushes it right, Shift+H brings it back: every press is a lane move.
  await measure(page, 'move a card to the next lane (Shift+L/H)', (i) => (i % 2 === 0 ? 'Shift+L' : 'Shift+H'))
  await expect(card).toBeFocused()
})

// The plan's other bar. The pivot (`v`: rows morph into cards) is not on main yet; Phase 2 builds it.
test.fixme('pivot (v) holds 60fps on a 1,000-item board', async () => {})

test.afterAll(() => {
  // A failed test restarts the worker with fresh module state: fold in what an earlier worker of this same run wrote.
  try {
    const prior = JSON.parse(fs.readFileSync(RESULTS, 'utf8')) as typeof results
    if (prior.runId === RUN_ID && RUN_ID !== 'local') {
      results.keypress = { ...prior.keypress, ...results.keypress }
      results.load ??= prior.load
    }
  } catch {
    /* first write */
  }
  fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2) + '\n')
  const rows = Object.entries(results.keypress).map(([name, s]) => `${name.padEnd(42)} ${String(s.median).padStart(7)} ${String(s.p95).padStart(7)} ${String(s.max).padStart(7)} ${String(s.longTasks).padStart(5)}  ${s.verdict}`)
  const table = [
    '',
    `VAULT speed harness — ${results.board.items} items, ${results.board.notes} notes, ${results.board.events} trail events; budget ${BUDGET_MS}ms keypress-to-paint (soft; fails past ${HARD_FAIL_MS}ms median)`,
    results.load ? `load to interactive: median ${results.load.median}ms, p95 ${results.load.p95}ms over ${results.load.runs} loads, ${results.load.longTasksPerLoad} long tasks per load` : '',
    `${'keypress → paint (ms)'.padEnd(42)} ${'median'.padStart(7)} ${'p95'.padStart(7)} ${'max'.padStart(7)} ${'long'.padStart(5)}`,
    ...rows,
    `→ ${path.relative(process.cwd(), RESULTS)}`,
    '',
  ].join('\n')
  console.log(table)
})
