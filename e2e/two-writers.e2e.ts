import { expect, test, type Page, type Request, type Route } from '@playwright/test'
import { openAppWithBridge, startAgent, type Agent } from './helpers/agent'

/*
 * Two writers, one board: the browser (bridge on) and a REAL vault-agent,
 * started from the test on a free port against a temp file. The agent writes
 * through its own CLI (`vault-agent report`, which adds a subtask), the same
 * path Claude's MCP tools use, not through a fake.
 *
 * Audit 2: a browser push stamped with send time beats an agent write made in
 *          the push's debounce window, so the agent's edit is lost.
 * Audit 1: after a late reconnect the agent's copy is taken whatever it is,
 *          so what the browser did while the bridge was down is lost.
 * After a sync, BOTH edits must exist in the file and in the page.
 *
 * Seed ids: homepage 1, SITE REDESIGN 2.
 */

test.setTimeout(90_000)

let agent: Agent
test.beforeEach(async () => {
  agent = await startAgent()
})
test.afterEach(async () => {
  await agent?.dispose()
})

const BROWSER_EDIT = 'BROWSER EDIT'
const AGENT_EDIT = 'agent edit from the cli'

async function sh(page: Page, line: string) {
  await page.getByTestId('shell-input').fill(line)
  await page.getByTestId('shell-input').press('Enter')
}

const fileTitles = () => {
  try {
    return agent.read().doc.nodes.map((n) => n.title)
  } catch {
    return [] as string[]
  }
}
const pageTitles = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem('vault:doc')
    return raw ? ((JSON.parse(raw) as { doc: { nodes: Array<{ title: string }> } }).doc.nodes.map((n) => n.title) as string[]) : []
  })

/** Waits until the browser has pushed its board to the empty agent file, i.e. first contact is done. */
async function firstContact(page: Page) {
  await expect(page.getByTestId('board')).toBeVisible()
  await expect.poll(() => fileTitles().includes('SITE REDESIGN'), { timeout: 20_000, message: 'the browser never pushed its board to the agent' }).toBe(true)
}

async function agentAddsSubtask(title: string) {
  const r = await agent.cli(['report', '2'], `## Report\n- [ ] ${title}\n`)
  expect(r.code, `vault-agent report failed:\n${r.stderr}`).toBe(0)
  expect(fileTitles()).toContain(title)
}

async function bothEditsEverywhere(page: Page) {
  await expect
    .poll(() => fileTitles().filter((t) => t === BROWSER_EDIT || t === AGENT_EDIT).sort(), { timeout: 15_000, message: 'the file should hold both edits' })
    .toEqual([AGENT_EDIT, BROWSER_EDIT].sort())
  await expect
    .poll(async () => (await pageTitles(page)).filter((t) => t === BROWSER_EDIT || t === AGENT_EDIT).sort(), { timeout: 15_000, message: 'the page should hold both edits' })
    .toEqual([AGENT_EDIT, BROWSER_EDIT].sort())
  await expect(page.getByTestId('directory')).toContainText(AGENT_EDIT)
  await expect(page.getByTestId('lane-pending')).toContainText(BROWSER_EDIT)
}

test('control: one writer at a time, the real agent and the page end up with both edits', async ({ page }) => {
  // One writer at a time: proves the harness (agent, CLI, page, bridge) works, so when a
  // two-writer case below fails it is the merge that is wrong, not a broken setup.
  await openAppWithBridge(page, agent)
  await firstContact(page)
  await agentAddsSubtask(AGENT_EDIT)
  await expect.poll(async () => (await pageTitles(page)).includes(AGENT_EDIT), { timeout: 15_000 }).toBe(true)
  await sh(page, `touch homepage/${BROWSER_EDIT}`)
  await bothEditsEverywhere(page)
})

test('audit 2: an agent write inside the browser’s push window survives, and so does the browser’s edit', async ({ page }) => {

  await openAppWithBridge(page, agent)
  await firstContact(page)

  // Hold the browser's next push in flight until the agent has written: the
  // agent's write lands inside the debounce/push window, every run, not by luck.
  let held: (() => void) | null = null
  let pushSeen!: () => void
  const pushed = new Promise<void>((r) => (pushSeen = r))
  await page.route(`${agent.url}/doc`, async (route: Route, req: Request) => {
    if (req.method() !== 'PUT' || held === null) return route.continue()
    const release = new Promise<void>((r) => (held = r))
    pushSeen()
    await release
    return route.continue()
  })
  held = () => {}

  await sh(page, `touch homepage/${BROWSER_EDIT}`)
  await expect(page.getByTestId('lane-pending')).toContainText(BROWSER_EDIT)
  await pushed // the browser's push (based on the rev before the agent's write) is on its way
  await agentAddsSubtask(AGENT_EDIT)
  const release = held as (() => void) | null
  held = null
  release?.()

  await bothEditsEverywhere(page)
})

test('audit 1: a late reconnect keeps what both sides did while the bridge was down', async ({ page }) => {

  await openAppWithBridge(page, agent)
  await firstContact(page)

  await agent.stop()
  // Past one poll (5s) plus its ping timeout, so the page has had its chance to notice the bridge is gone.
  // (Time, not a toast's wording: the wording is G1's to change, and a missed text must not pass a test.fail.)
  await page.waitForTimeout(7_500)

  await sh(page, `touch homepage/${BROWSER_EDIT}`)
  await expect(page.getByTestId('lane-pending')).toContainText(BROWSER_EDIT)
  // The agent works on the file directly (CLI/MCP need no bridge) while the bridge is down.
  await agentAddsSubtask(AGENT_EDIT)

  await agent.start()
  await bothEditsEverywhere(page)
})
