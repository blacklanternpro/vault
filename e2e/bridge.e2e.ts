import { expect, test, type Page, type Route } from '@playwright/test'

/*
 * The local agent bridge, with `vault-agent serve` stood in for by routes
 * that speak the Phase 1 contract: every request but /health needs the
 * token; the board carries `rev`; a PUT must name its `base` (428 without
 * one) and is refused with 409 and the current envelope unless the base is
 * the current rev; inbox items have ids and are removed by id only.
 */

type Node = Record<string, unknown> & { id: number; title: string }
type Doc = { nodes: Node[]; notes: unknown[]; events: unknown[] }
type Env = { app: 'vault'; version: number; savedAt: number; rev?: number; doc: Doc }
type Item = { id: string; at: number; taskId?: number; text: string }

const TOKEN = 'e2e-token'
const CORS = { 'access-control-allow-origin': '*' }

async function fakeBridge(page: Page, serverDoc: Env, inbox: Item[] = [], token = TOKEN) {
  const state = {
    env: { ...serverDoc, rev: serverDoc.rev ?? 1 },
    inbox: [...inbox],
    puts: [] as Array<{ base: unknown; status: number }>,
    down: false,
    /** An agent writing to the file: the doc changes and the rev moves on. */
    agent(fn: (doc: Doc) => void) {
      const doc = JSON.parse(JSON.stringify(state.env.doc)) as Doc
      fn(doc)
      state.env = { ...state.env, doc, rev: state.env.rev + 1, savedAt: Date.now() }
    },
    has: (title: string) => state.env.doc.nodes.some((n) => n.title === title),
  }
  await page.route('http://localhost:7331/**', async (route: Route) => {
    if (state.down) return route.abort()
    const req = route.request()
    const url = new URL(req.url())
    const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: CORS })
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': 'Content-Type, Authorization', 'access-control-allow-methods': 'GET, PUT, POST, DELETE' } })
    const authed = req.headers()['authorization'] === `Bearer ${token}`
    if (url.pathname === '/health') return json(200, authed ? { app: 'vault-agent', version: 1, authorized: true, rev: state.env.rev } : { app: 'vault-agent', version: 1, authorized: false })
    if (!authed) return json(401, { error: 'token missing or wrong; run vault-agent token' })
    if (url.pathname === '/doc' && req.method() === 'GET') return json(200, state.env)
    if (url.pathname === '/doc' && req.method() === 'PUT') {
      const body = JSON.parse(req.postData() ?? '{}') as Env & { base?: number }
      if (typeof body.base !== 'number') {
        state.puts.push({ base: body.base, status: 428 })
        return json(428, { error: 'send base' })
      }
      if (body.base !== state.env.rev) {
        state.puts.push({ base: body.base, status: 409 })
        return json(409, state.env)
      }
      state.env = { app: 'vault', version: 1, savedAt: body.savedAt, rev: state.env.rev + 1, doc: body.doc }
      state.puts.push({ base: body.base, status: 200 })
      return json(200, { ok: true, savedAt: body.savedAt, rev: state.env.rev })
    }
    if (url.pathname === '/inbox' && req.method() === 'GET') return json(200, { inbox: state.inbox })
    if (url.pathname.startsWith('/inbox/') && req.method() === 'DELETE') {
      const key = decodeURIComponent(url.pathname.slice('/inbox/'.length))
      if (/^\d+$/.test(key)) return json(400, { error: 'remove by id' })
      const at = state.inbox.findIndex((e) => e.id === key)
      if (at < 0) return json(404, { error: 'no such item' })
      const [removed] = state.inbox.splice(at, 1)
      return json(200, { removed, inbox: state.inbox })
    }
    return json(404, { error: 'not found' })
  })
  return state
}

/** The seed as the app builds it, read off a fresh page via Export (the exact envelope the app would send). */
async function seedEnvelope(page: Page): Promise<Env> {
  await page.goto('/')
  await page.getByTestId('menu').click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('menu-export').click()])
  return JSON.parse(await (await import('node:fs')).promises.readFile((await download.path())!, 'utf8')) as Env
}

function withAgentWork(env: Env): Env {
  const maxId = Math.max(...env.doc.nodes.map((n) => n.id))
  const doc = JSON.parse(JSON.stringify(env.doc)) as Doc
  doc.nodes.push({ id: maxId + 1, title: 'added by an agent', status: 'pending', parent: 2 })
  return { ...env, doc, savedAt: Date.now() - 1_000, rev: 3 }
}

/** The token as `vault-agent serve`'s link hands it over, once, before the app first loads. */
async function giveToken(page: Page) {
  await page.addInitScript((token) => {
    if (!localStorage.getItem('vault:bridge')) localStorage.setItem('vault:bridge', JSON.stringify({ enabled: false, url: 'http://localhost:7331', token }))
  }, TOKEN)
}

async function turnBridgeOn(page: Page) {
  await page.getByTestId('menu').click()
  await page.getByTestId('menu-bridge').click()
  await expect(page.getByText('bridge on · localhost:7331')).toBeVisible()
}

/** A data notice (sticky, docs/VOICE.md §3.5): merged, took, token refused. */
const notice = (page: Page, text: string | RegExp) => page.locator('.banner', { hasText: text })

test('turning the bridge on takes the agent’s board, pushes local changes with a base, and surfaces its report', async ({ browser }) => {
  const prep = await browser.newContext({ acceptDownloads: true })
  const server = withAgentWork(await seedEnvelope(await prep.newPage()))
  await prep.close()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await giveToken(page)
  const state = await fakeBridge(page, server, [{ id: 'i1', at: 1, taskId: 2, text: '## Report\n- [x] Create wireframes\nLeft off: hero done' }])
  await page.goto('/')
  await page.getByTestId('menu').click()
  await page.getByTestId('menu-bridge').click()

  // This browser never saved a board of its own (the sample), so it takes the agent's, and says so,
  // with no "restore mine": that would push the sample over the real board.
  await expect(notice(page, "took vault-agent's copy (rev 3)")).toBeVisible()
  await expect(notice(page, 'took').getByRole('button', { name: 'restore mine' })).toHaveCount(0)
  await expect(page.getByTestId('directory')).toContainText('added by an agent')
  await expect(page.getByTestId('inbox-banner')).toContainText('SITE REDESIGN')
  await expect.poll(() => state.inbox.length).toBe(0)

  await page.getByTestId('card-8').focus()
  await page.keyboard.press('Delete')
  await expect.poll(() => state.env.doc.nodes.some((n) => n.id === 8), { timeout: 10_000 }).toBe(false)
  expect(state.puts.length).toBeGreaterThan(0)
  expect(state.puts.every((p) => typeof p.base === 'number' && p.status !== 428)).toBe(true)
  expect(state.has('added by an agent')).toBe(true)

  await page.getByTestId('menu').click()
  await expect(page.getByTestId('menu-bridge')).toContainText('on')
  await ctx.close()
})

test('with no bridge running the toggle says so and the board carries on locally', async ({ page }) => {
  await page.route('http://localhost:7331/**', (route) => route.abort())
  await page.goto('/')
  await page.getByTestId('menu').click()
  await page.getByTestId('menu-bridge').click()
  await page.getByTestId('menu').click()
  await expect(page.getByTestId('menu-bridge')).toContainText('no answer')
  await page.keyboard.press('Escape')
  await page.getByTestId('card-8').focus()
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('card-8')).toHaveCount(0)
})

test('an agent write while the browser has unpushed edits: both survive', async ({ browser }) => {
  const prep = await browser.newContext({ acceptDownloads: true })
  const seed = await seedEnvelope(await prep.newPage())
  await prep.close()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await giveToken(page)
  const state = await fakeBridge(page, { ...seed, rev: 1 })
  await page.goto('/')
  await turnBridgeOn(page)

  // The browser deletes a card; before its push goes out, an agent adds a task to the file.
  await page.getByTestId('card-8').focus()
  await page.keyboard.press('Delete')
  state.agent((doc) => {
    const id = Math.max(...doc.nodes.map((n) => n.id)) + 1
    doc.nodes.push({ id, title: 'agent wrote this meanwhile', status: 'pending', parent: 12 })
  })

  await expect(page.getByTestId('directory')).toContainText('agent wrote this meanwhile', { timeout: 10_000 })
  await expect(page.getByTestId('card-8')).toHaveCount(0)
  await expect.poll(() => state.has('agent wrote this meanwhile') && !state.env.doc.nodes.some((n) => n.id === 8), { timeout: 10_000 }).toBe(true)
  // Both changed since the last agreed copy: merged, and the person is told (with a way back).
  await expect(notice(page, /^merged 1 change from vault-agent \(rev \d+\)/).getByRole('button', { name: 'restore mine' })).toBeVisible()
  expect(state.puts.every((p) => typeof p.base === 'number')).toBe(true)
  await ctx.close()
})

test('bridge offline, both sides edit, bridge returns: merged, not replaced, and "restore mine" works', async ({ browser }) => {
  const prep = await browser.newContext({ acceptDownloads: true })
  const seed = await seedEnvelope(await prep.newPage())
  await prep.close()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await giveToken(page)
  const state = await fakeBridge(page, { ...seed, rev: 1 })
  await page.goto('/')
  await turnBridgeOn(page)

  state.down = true
  await expect(page.getByText('bridge offline · working locally')).toBeVisible({ timeout: 10_000 })

  // Offline: the browser deletes a card, an agent renames a task in the file.
  await page.getByTestId('card-8').focus()
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('card-8')).toHaveCount(0)
  state.agent((doc) => {
    const n = doc.nodes.find((x) => x.id === 13)!
    n.title = 'RENAMED BY THE AGENT'
  })
  state.down = false

  const merged = notice(page, /^merged 1 change from vault-agent \(rev \d+\)/)
  await expect(merged).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('directory')).toContainText('RENAMED BY THE AGENT')
  await expect(page.getByTestId('card-8')).toHaveCount(0)
  await expect.poll(() => state.has('RENAMED BY THE AGENT') && !state.env.doc.nodes.some((n) => n.id === 8), { timeout: 10_000 }).toBe(true)

  // Restore mine: the board as it was before the merge (card 8 still deleted, no agent rename), pushed with a base.
  await merged.getByRole('button', { name: 'restore mine' }).click()
  await expect(page.getByTestId('toast')).toContainText(/^restored yours \(\d\d:\d\d\)\. theirs is in snapshots/)
  await expect(merged).toHaveCount(0)
  await expect(page.getByTestId('directory')).not.toContainText('RENAMED BY THE AGENT')
  await expect(page.getByTestId('card-8')).toHaveCount(0)
  await expect.poll(() => state.has('RENAMED BY THE AGENT'), { timeout: 10_000 }).toBe(false)
  expect(state.puts.every((p) => typeof p.base === 'number')).toBe(true)

  // …and restoring is itself one undoable change.
  await page.keyboard.press('Control+z')
  await expect(page.getByTestId('directory')).toContainText('RENAMED BY THE AGENT')
  await ctx.close()
})

test('a token in the link is taken, stripped from the address, and the bridge stays off until turned on', async ({ page }) => {
  const state = await fakeBridge(page, { app: 'vault', version: 1, savedAt: 0, rev: 0, doc: { nodes: [], notes: [], events: [] } })
  await page.goto(`/#bridge-token=${TOKEN}`)
  await expect(page.getByTestId('toast')).toContainText('bridge token saved. turn the bridge on in the menu to connect')
  expect(page.url()).not.toContain('bridge-token')
  expect(page.url()).not.toContain(TOKEN)
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('vault:bridge')))!)).toMatchObject({ enabled: false, token: TOKEN })
  await page.getByTestId('menu').click()
  await expect(page.getByTestId('menu-bridge')).toContainText('off')
  await page.getByTestId('menu-bridge').click()
  await expect(page.getByText('bridge on · localhost:7331')).toBeVisible()
  // The never-saved sample is not pushed into an empty bridge…
  await page.waitForTimeout(1_500)
  expect(state.puts).toHaveLength(0)
  expect(state.env.doc.nodes).toHaveLength(0)
  // …the first board of the person's own is.
  await page.getByTestId('card-8').focus()
  await page.keyboard.press('Delete')
  await expect.poll(() => state.env.doc.nodes.length, { timeout: 10_000 }).toBeGreaterThan(0)
  expect(state.env.doc.nodes.some((n) => n.id === 8)).toBe(false)
})

test('Ctrl+Z across an agent’s change says so, and redo puts it back', async ({ browser }) => {
  const prep = await browser.newContext({ acceptDownloads: true })
  const seed = await seedEnvelope(await prep.newPage())
  await prep.close()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await giveToken(page)
  const state = await fakeBridge(page, { ...seed, rev: 1 })
  await page.goto('/')
  await turnBridgeOn(page)

  state.agent((doc) => {
    doc.nodes.find((x) => x.id === 13)!.title = 'RENAMED BY THE AGENT'
  })
  await expect(notice(page, /^took vault-agent's copy \(rev 2\)/).getByRole('button', { name: 'restore mine' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('directory')).toContainText('RENAMED BY THE AGENT')

  await page.keyboard.press('Escape')
  await page.keyboard.press('Control+z')
  const undid = notice(page, "undid vault-agent's change")
  await expect(undid).toBeVisible()
  await expect(page.getByTestId('directory')).not.toContainText('RENAMED BY THE AGENT')
  await undid.getByRole('button', { name: 'redo' }).click()
  await expect(page.getByTestId('directory')).toContainText('RENAMED BY THE AGENT')
  await expect.poll(() => state.has('RENAMED BY THE AGENT'), { timeout: 10_000 }).toBe(true)
  await ctx.close()
})

test('a missing or wrong token: no answer, and the toast says how to get one', async ({ page }) => {
  await fakeBridge(page, { app: 'vault', version: 1, savedAt: 0, rev: 0, doc: { nodes: [], notes: [], events: [] } }, [], 'the-real-token')
  await page.goto(`/#bridge-token=stale-token`)
  await page.getByTestId('menu').click()
  await page.getByTestId('menu-bridge').click()
  await expect(notice(page, 'bridge refused: wrong token. run vault-agent token (or serve) for the link')).toBeVisible()
  await page.getByTestId('menu').click()
  await expect(page.getByTestId('menu-bridge')).toContainText('no answer')
})
