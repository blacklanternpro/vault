import { describe, expect, it } from 'vitest'
import { deriveKeys, s256 } from './auth'
import { MemoryStore } from './board'
import { createWireHandler } from './mcp'
import { handleOAuth, type OAuthConfig } from './oauth'

/*
 * The whole round trip a client makes, in-process: discovery, DCR,
 * /authorize (page, wrong passphrase, right passphrase), /token (code, then
 * refresh), and /api/mcp with the token. The deployed run of the same flow
 * is in docs/WIRE_SPIKE.md.
 */

const ORIGIN = 'https://wire.example'
const CALLBACK = 'https://claude.ai/api/mcp/auth_callback'
const keys = deriveKeys('test-secret-test-secret-test-secret-0123')
const PASS = 'a long test passphrase'
const cfg: OAuthConfig = { keys, passphrase: PASS, wrongDelayMs: 1 }
const VERIFIER = 'x'.repeat(20) + 'verifier-for-the-test-flow-0123456789'

const call = (op: string, path: string, init: RequestInit = {}) => handleOAuth(new Request(ORIGIN + path, init), op, cfg)

async function registerClient(redirects = [CALLBACK]): Promise<string> {
  const res = await call('register', '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: redirects, client_name: 'Claude' }) })
  expect(res.status).toBe(201)
  return ((await res.json()) as { client_id: string }).client_id
}

function authorizeUrl(clientId: string, over: Record<string, string | null> = {}): string {
  const q = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: CALLBACK, code_challenge: s256(VERIFIER), code_challenge_method: 'S256', state: 'st-1', resource: `${ORIGIN}/api/mcp`, scope: 'vault' })
  for (const [k, v] of Object.entries(over)) if (v == null) q.delete(k)
  else q.set(k, v)
  return `/authorize?${q}`
}

async function txnFrom(res: Response): Promise<string> {
  const html = await res.text()
  const m = /name="txn" value="([^"]+)"/.exec(html)
  expect(m).toBeTruthy()
  return m![1]
}

async function codeFor(clientId: string): Promise<string> {
  const page = await call('authorize', authorizeUrl(clientId))
  const txn = await txnFrom(page)
  const res = await call('authorize', '/authorize', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ txn, passphrase: PASS }).toString() })
  expect(res.status).toBe(302)
  const loc = new URL(res.headers.get('location')!)
  return loc.searchParams.get('code')!
}

const tokenReq = (params: Record<string, string>) => call('token', '/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() })

describe('discovery', () => {
  it('serves protected-resource and authorization-server metadata', async () => {
    const prm = (await (await call('prm', '/.well-known/oauth-protected-resource/api/mcp')).json()) as Record<string, unknown>
    expect(prm.resource).toBe(`${ORIGIN}/api/mcp`)
    expect(prm.authorization_servers).toEqual([ORIGIN])
    const as = (await (await call('as', '/.well-known/oauth-authorization-server')).json()) as Record<string, unknown>
    expect(as.issuer).toBe(ORIGIN)
    expect(as.code_challenge_methods_supported).toEqual(['S256'])
    expect(as.token_endpoint_auth_methods_supported).toContain('none')
    expect(as.registration_endpoint).toBe(`${ORIGIN}/register`)
    expect(as.client_id_metadata_document_supported).toBe(true)
  })
})

describe('dynamic client registration', () => {
  it("refuses redirects that are not Claude's or loopback", async () => {
    const res = await call('register', '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: [CALLBACK, 'https://evil.com/cb'] }) })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toBe('invalid_redirect_uri')
  })
})

describe('authorize', () => {
  it('renders the passphrase page and names where it sends you', async () => {
    const res = await call('authorize', authorizeUrl(await registerClient()))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    const html = await res.text()
    expect(html).toContain('VAULT<b>_</b>')
    expect(html).toContain('claude.ai')
  })
  it('requires PKCE S256 and state, sending the error back to the client', async () => {
    const cid = await registerClient()
    const cases: Record<string, string | null>[] = [{ code_challenge_method: 'plain' }, { code_challenge: null }, { state: null }]
    for (const over of cases) {
      const res = await call('authorize', authorizeUrl(cid, over))
      expect(res.status).toBe(302)
      expect(new URL(res.headers.get('location')!).searchParams.get('error')).toBe('invalid_request')
    }
  })
  it('never redirects to a URI the client did not register', async () => {
    const cid = await registerClient()
    const res = await call('authorize', authorizeUrl(cid, { redirect_uri: 'http://localhost:9999/callback' }))
    expect(res.status).toBe(400)
    expect(res.headers.get('location')).toBeNull()
  })
  it('refuses a forged client id', async () => {
    const res = await call('authorize', authorizeUrl('eyJhbGciOiJIUzI1NiJ9.e30.bad'))
    expect(res.status).toBe(400)
  })
  it('a wrong passphrase gets the page again, slowly, and no code', async () => {
    const txn = await txnFrom(await call('authorize', authorizeUrl(await registerClient())))
    const res = await call('authorize', '/authorize', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ txn, passphrase: 'wrong' }).toString() })
    expect(res.status).toBe(401)
    expect(res.headers.get('location')).toBeNull()
    expect(await res.text()).toContain('no. not that.')
  })
  it('cancel sends access_denied back', async () => {
    const txn = await txnFrom(await call('authorize', authorizeUrl(await registerClient())))
    const res = await call('authorize', '/authorize', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ txn, deny: '1' }).toString() })
    expect(new URL(res.headers.get('location')!).searchParams.get('error')).toBe('access_denied')
  })
  it('accepts a Client ID Metadata Document from claude.ai only', async () => {
    const cimd = 'https://claude.ai/oauth/test-client-metadata'
    const fetchImpl = (async () => new Response(JSON.stringify({ client_id: cimd, redirect_uris: [CALLBACK] }))) as typeof fetch
    const ok = await handleOAuth(new Request(ORIGIN + authorizeUrl(cimd)), 'authorize', { ...cfg, fetchImpl })
    expect(ok.status).toBe(200)
    const bad = await handleOAuth(new Request(ORIGIN + authorizeUrl('https://evil.com/meta')), 'authorize', { ...cfg, fetchImpl })
    expect(bad.status).toBe(400)
  })
})

describe('token', () => {
  it('exchanges a code with the right verifier, then refreshes', async () => {
    const cid = await registerClient()
    const code = await codeFor(cid)
    const bad = await tokenReq({ grant_type: 'authorization_code', code, client_id: cid, redirect_uri: CALLBACK, code_verifier: VERIFIER.replace('x', 'y') })
    expect(bad.status).toBe(400)
    expect(((await bad.json()) as { error: string }).error).toBe('invalid_grant')
    const other = await registerClient()
    expect((await tokenReq({ grant_type: 'authorization_code', code, client_id: other, redirect_uri: CALLBACK, code_verifier: VERIFIER })).status).toBe(400)

    const res = await tokenReq({ grant_type: 'authorization_code', code, client_id: cid, redirect_uri: CALLBACK, code_verifier: VERIFIER, resource: `${ORIGIN}/api/mcp` })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const t = (await res.json()) as { access_token: string; refresh_token: string; token_type: string; expires_in: number }
    expect(t.token_type).toBe('Bearer')
    expect(t.expires_in).toBe(3600)

    const r = await tokenReq({ grant_type: 'refresh_token', refresh_token: t.refresh_token, client_id: cid })
    expect(r.status).toBe(200)
    const t2 = (await r.json()) as { access_token: string; refresh_token: string }
    expect(t2.refresh_token).not.toBe(t.refresh_token)
    expect((await tokenReq({ grant_type: 'refresh_token', refresh_token: 'nope', client_id: cid })).status).toBe(400)
  })
})

describe('the MCP route', () => {
  const store = new MemoryStore()
  const mcp = createWireHandler({ keys, store, clock: () => Date.parse('2026-11-18T10:00:00Z') })
  const rpc = (body: unknown, token?: string) =>
    mcp(
      new Request(`${ORIGIN}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      }),
    )

  async function result(res: Response): Promise<{ result?: Record<string, unknown>; error?: unknown }> {
    const text = await res.text()
    const data = text.startsWith('{') ? text : (/^data: (.*)$/m.exec(text)?.[1] ?? '')
    return JSON.parse(data)
  }

  it('answers 401 with a resource_metadata challenge without a token', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
    expect(res.status).toBe(401)
    const www = res.headers.get('www-authenticate')!
    expect(www).toMatch(/^Bearer /)
    expect(www).toContain(`resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/api/mcp"`)
    expect((await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, 'garbage')).status).toBe(401)
  })

  it('serves initialize, tools/list and both tools with a token', async () => {
    const cid = await registerClient()
    const code = await codeFor(cid)
    const t = (await (await tokenReq({ grant_type: 'authorization_code', code, client_id: cid, redirect_uri: CALLBACK, code_verifier: VERIFIER })).json()) as { access_token: string }

    const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }, t.access_token)
    expect(init.status).toBe(200)
    const initResult = (await result(init)).result!
    expect(String(initResult.instructions)).toContain('vault it')

    const list = (await result(await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, t.access_token))).result as { tools: { name: string }[] }
    expect(list.tools.map((x) => x.name).sort()).toEqual(['vault_push', 'vault_status'])

    const tree = { folder: 'r1i', tasks: [{ title: 'Network map', subtasks: ['nodes', 'edges', 'legend', 'export'], due: '2026-11-20' }] }
    const pushed = (await result(await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'vault_push', arguments: tree } }, t.access_token))).result as { content: { text: string }[] }
    expect(pushed.content[0].text).toBe('→ r1i/ · NETWORK MAP · 4 subtasks · due Fri')

    const st = (await result(await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'vault_status', arguments: {} } }, t.access_token))).result as { content: { text: string }[] }
    expect(st.content[0].text).toContain('r1i/  1 open')
    expect(st.content[0].text).toContain('due soon: Network map (r1i/, Fri)')
  })
})
