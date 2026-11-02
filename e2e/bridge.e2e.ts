import { expect, test, type Page, type Route } from '@playwright/test'

/*
 * The local agent bridge, with `vault-agent serve` stood in for by routes.
 * The server's board is the seed plus a subtask an agent added; its inbox
 * holds one report.
 */

type Env = { app: 'vault'; version: number; savedAt: number; doc: { nodes: Array<Record<string, unknown>>; notes: unknown[]; events: unknown[] } }

async function fakeBridge(page: Page, serverDoc: Env, inbox: Array<{ at: number; taskId?: number; text: string }>) {
  const state = { doc: serverDoc, inbox: [...inbox], puts: 0 }
  await page.route('http://localhost:7331/**', async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } })
    if (url.pathname === '/doc' && req.method() === 'HEAD') return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } })
    if (url.pathname === '/doc' && req.method() === 'GET') return json(200, state.doc)
    if (url.pathname === '/doc' && req.method() === 'PUT') {
      const body = JSON.parse(req.postData() ?? '{}') as Env
      if (body.savedAt < state.doc.savedAt) return json(409, state.doc)
      state.doc = body
      state.puts += 1
      return json(200, { ok: true, savedAt: body.savedAt })
    }
    if (url.pathname === '/inbox' && req.method() === 'GET') return json(200, { inbox: state.inbox })
    if (url.pathname.startsWith('/inbox/') && req.method() === 'DELETE') {
      state.inbox.splice(Number(url.pathname.split('/')[2]), 1)
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    return route.fulfill({ status: 404 })
  })
  return state
}

/** The seed as the app builds it, read off a fresh page, with one subtask added "by an agent". */
async function seedWithAgentWork(page: Page): Promise<Env> {
  await page.goto('/')
  // Export gives the exact envelope the app would send.
  await page.getByTestId('menu').click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('menu-export').click()])
  const env = JSON.parse(await (await import('node:fs')).promises.readFile((await download.path())!, 'utf8')) as Env
  const maxId = Math.max(...env.doc.nodes.map((n) => n.id as number))
  env.doc.nodes.push({ id: maxId + 1, title: 'added by an agent', status: 'pending', parent: 2 })
  env.savedAt = Date.now() - 1_000
  return env
}

test('turning the bridge on takes the agent’s newer board, pushes local changes, and surfaces its report', async ({ browser }) => {
  const prep = await browser.newContext({ acceptDownloads: true })
  const server = await seedWithAgentWork(await prep.newPage())
  await prep.close()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const state = await fakeBridge(page, server, [{ at: 1, taskId: 2, text: '## Report\n- [x] Create wireframes\nLeft off: hero done' }])
  await page.goto('/')
  await page.getByTestId('menu').click()
  await page.getByTestId('menu-bridge').click()

  await expect(page.getByText('Agent bridge connected')).toBeVisible()
  await expect(page.getByTestId('directory')).toContainText('added by an agent')
  await expect(page.getByTestId('inbox-banner')).toContainText('SITE REDESIGN')
  await expect.poll(() => state.inbox.length).toBe(0)

  await page.getByTestId('card-8').focus()
  await page.keyboard.press('Delete')
  await expect.poll(() => state.doc.doc.nodes.some((n) => n.id === 8), { timeout: 10_000 }).toBe(false)
  expect(state.puts).toBeGreaterThan(0)

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
