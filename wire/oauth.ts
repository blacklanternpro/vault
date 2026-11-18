import {
  AuthError,
  cimdHostAllowed,
  isChallenge,
  isLoopbackUri,
  issueClientId,
  issueCode,
  issueTokens,
  issueTxn,
  passphraseMatches,
  pkceMatches,
  readClientId,
  readCode,
  readRefresh,
  readTxn,
  redirectAllowed,
  redirectMatches,
  SCOPE,
  type AuthRequest,
  type Keys,
} from './auth.js'
import { authorizePage, errorPage, PAGE_HEADERS } from './page.js'

/*
 * The authorization server's HTTP face, as one Web-standard handler. Vercel
 * rewrites send /.well-known/*, /register, /authorize and /token here with
 * ?op=… (see vercel.json); a test calls it directly.
 */

export const MCP_PATH = '/api/mcp'

export type OAuthConfig = {
  keys: Keys
  passphrase: string
  /** Wait this long before answering a wrong passphrase. */
  wrongDelayMs?: number
  /** Fetch for Client ID Metadata Documents (tests inject one). */
  fetchImpl?: typeof fetch
  now?: () => number
}

export type Op = 'prm' | 'as' | 'register' | 'authorize' | 'token'

/** The public origin, from Vercel's forwarding headers, else the request URL. */
export function originOf(req: Request): string {
  const fwdHost = req.headers.get('x-forwarded-host')?.split(',')[0].trim()
  const host = fwdHost || req.headers.get('host') || new URL(req.url).host
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim() || new URL(req.url).protocol.replace(':', '')
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
  return `${local ? proto : 'https'}://${host}`
}

export const resourceOf = (origin: string) => origin + MCP_PATH
export const prmUrlOf = (origin: string) => `${origin}/.well-known/oauth-protected-resource${MCP_PATH}`

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version', 'Access-Control-Max-Age': '86400' }

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS, ...extra } })
}

function oauthError(code: string, description: string, status = 400): Response {
  return json({ error: code, error_description: description }, status, { 'Cache-Control': 'no-store' })
}

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: PAGE_HEADERS })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* -------------------------------------------------------------- metadata */

export function protectedResourceMetadata(origin: string) {
  return {
    resource: resourceOf(origin),
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'VAULT (wire spike test board)',
  }
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/token`,
    registration_endpoint: `${origin}/register`,
    scopes_supported: [SCOPE, 'offline_access'],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
  }
}

/* --------------------------------------------------------------- clients */

type Client = { id: string; label: string; redirectUris: string[] }

const MAX_CIMD_BYTES = 16 * 1024

async function fetchCimd(clientId: string, fetchImpl: typeof fetch): Promise<Client> {
  let url: URL
  try {
    url = new URL(clientId)
  } catch {
    throw new AuthError('invalid_client', 'client_id is not a URL')
  }
  if (url.protocol !== 'https:' || !cimdHostAllowed(url.hostname) || url.port || url.username || url.hash) {
    throw new AuthError('invalid_client', `client metadata from ${url.hostname} is not accepted here`)
  }
  let res: Response
  try {
    res = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } })
  } catch {
    throw new AuthError('invalid_client', 'could not fetch the client metadata document')
  }
  if (!res.ok) throw new AuthError('invalid_client', `client metadata document answered ${res.status}`)
  const text = await res.text()
  if (text.length > MAX_CIMD_BYTES) throw new AuthError('invalid_client', 'client metadata document too large')
  let doc: { client_id?: unknown; client_name?: unknown; redirect_uris?: unknown }
  try {
    doc = JSON.parse(text)
  } catch {
    throw new AuthError('invalid_client', 'client metadata document is not JSON')
  }
  if (doc.client_id !== clientId) throw new AuthError('invalid_client', 'client metadata document names a different client_id')
  if (!Array.isArray(doc.redirect_uris) || !doc.redirect_uris.every((u) => typeof u === 'string')) throw new AuthError('invalid_client', 'client metadata document has no redirect_uris')
  // Name the host of the client_id URL, not the self-asserted client_name.
  return { id: clientId, label: `Claude (${url.hostname})`, redirectUris: doc.redirect_uris as string[] }
}

async function resolveClient(clientId: string, cfg: OAuthConfig): Promise<Client> {
  if (!clientId) throw new AuthError('invalid_client', 'missing client_id')
  if (clientId.startsWith('https://')) {
    // Spike: log which CIMD URL the Claude apps actually send (public, not a secret).
    console.log(`authorize: CIMD client_id ${clientId.slice(0, 200)}`)
    return fetchCimd(clientId, cfg.fetchImpl ?? fetch)
  }
  console.log('authorize: DCR client')
  const reg = await readClientId(cfg.keys, clientId)
  return { id: clientId, label: reg.client_name ? reg.client_name.slice(0, 60) : 'Claude', redirectUris: reg.redirect_uris }
}

/* -------------------------------------------------------------- register */

async function register(req: Request, cfg: OAuthConfig): Promise<Response> {
  if (req.method !== 'POST') return oauthError('invalid_request', 'POST a JSON client registration', 405)
  let body: { redirect_uris?: unknown; client_name?: unknown; grant_types?: unknown; response_types?: unknown }
  try {
    const text = await req.text()
    if (text.length > 8192) return oauthError('invalid_client_metadata', 'registration too large')
    body = JSON.parse(text)
  } catch {
    return oauthError('invalid_client_metadata', 'body is not JSON')
  }
  const uris = body.redirect_uris
  if (!Array.isArray(uris) || !uris.length || uris.length > 10 || !uris.every((u) => typeof u === 'string')) {
    return oauthError('invalid_redirect_uri', 'redirect_uris must be a non-empty list of URLs')
  }
  const refused = (uris as string[]).filter((u) => !redirectAllowed(u))
  if (refused.length) return oauthError('invalid_redirect_uri', `not allowed here: ${refused.join(', ')} (only Claude's callbacks and loopback)`)
  const name = typeof body.client_name === 'string' ? body.client_name.slice(0, 80) : undefined
  const clientId = await issueClientId(cfg.keys, { redirect_uris: uris as string[], client_name: name })
  return json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor((cfg.now?.() ?? Date.now()) / 1000),
      redirect_uris: uris,
      client_name: name,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    },
    201,
    { 'Cache-Control': 'no-store' },
  )
}

/* ------------------------------------------------------------- authorize */

function redirectWith(uri: string, params: Record<string, string>): Response {
  const u = new URL(uri)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return new Response(null, { status: 302, headers: { Location: u.toString(), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
}

async function authorizeGet(req: Request, cfg: OAuthConfig, origin: string): Promise<Response> {
  const q = new URL(req.url).searchParams
  const p = (k: string) => q.get(k) ?? ''
  let client: Client
  try {
    client = await resolveClient(p('client_id'), cfg)
  } catch (err) {
    return html(errorPage(err instanceof Error ? err.message : 'unknown client'), 400)
  }
  // Until the redirect URI is proven, errors are shown here, never sent anywhere.
  let redirectUri = p('redirect_uri')
  if (!redirectUri) {
    if (client.redirectUris.length !== 1) return html(errorPage('redirect_uri is required'), 400)
    redirectUri = client.redirectUris[0]
  }
  if (!client.redirectUris.some((r) => redirectMatches(redirectUri, r)) || !redirectAllowed(redirectUri)) {
    return html(errorPage(`${redirectUri} is not a redirect this client may use`), 400)
  }
  const state = p('state')
  const back = (error: string, description: string) => redirectWith(redirectUri, { error, error_description: description, ...(state ? { state } : {}), iss: origin })
  if (p('response_type') !== 'code') return back('unsupported_response_type', 'only response_type=code')
  if (!state) return back('invalid_request', 'state is required')
  if (p('code_challenge_method') !== 'S256' || !isChallenge(p('code_challenge'))) return back('invalid_request', 'PKCE with code_challenge_method=S256 is required')
  const resource = p('resource') || resourceOf(origin)
  if (resource.replace(/\/$/, '') !== resourceOf(origin)) return back('invalid_target', `this server issues tokens for ${resourceOf(origin)} only`)

  const request: AuthRequest = { client_id: client.id, redirect_uri: redirectUri, code_challenge: p('code_challenge'), state, resource: resourceOf(origin), scope: SCOPE }
  const txn = await issueTxn(cfg.keys, request)
  return html(authorizePage({ txn, clientLabel: client.label, returnHost: new URL(redirectUri).host, loopback: isLoopbackUri(redirectUri) }))
}

async function authorizePost(req: Request, cfg: OAuthConfig, origin: string): Promise<Response> {
  const form = new URLSearchParams(await req.text())
  let request: AuthRequest
  try {
    request = await readTxn(cfg.keys, form.get('txn') ?? '')
  } catch {
    return html(errorPage('This sign-in page expired. Go back to Claude and press Connect again.'), 400)
  }
  // Belt and braces: the redirect was checked when the txn was made, check it again.
  if (!redirectAllowed(request.redirect_uri)) return html(errorPage('redirect not allowed'), 400)
  if (form.get('deny')) return redirectWith(request.redirect_uri, { error: 'access_denied', error_description: 'the owner said no', state: request.state, iss: origin })

  if (!passphraseMatches(form.get('passphrase') ?? '', cfg.passphrase)) {
    await sleep(cfg.wrongDelayMs ?? 1500)
    const label = request.client_id.startsWith('https://') ? `Claude (${new URL(request.client_id).hostname})` : 'Claude'
    return html(authorizePage({ txn: form.get('txn') ?? '', clientLabel: label, returnHost: new URL(request.redirect_uri).host, loopback: isLoopbackUri(request.redirect_uri), error: 'no. not that.' }), 401)
  }
  const code = await issueCode(cfg.keys, request)
  return redirectWith(request.redirect_uri, { code, state: request.state, iss: origin })
}

/* ----------------------------------------------------------------- token */

async function readForm(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get('content-type') ?? ''
  const text = await req.text()
  if (text.length > 16 * 1024) throw new AuthError('invalid_request', 'body too large')
  if (type.includes('application/json')) {
    const obj = JSON.parse(text) as Record<string, unknown>
    return new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, String(v)]))
  }
  return new URLSearchParams(text)
}

async function token(req: Request, cfg: OAuthConfig, origin: string): Promise<Response> {
  if (req.method !== 'POST') return oauthError('invalid_request', 'POST application/x-www-form-urlencoded', 405)
  let form: URLSearchParams
  try {
    form = await readForm(req)
  } catch {
    return oauthError('invalid_request', 'could not read the request body')
  }
  const f = (k: string) => form.get(k) ?? ''
  const resource = resourceOf(origin)
  try {
    if (f('grant_type') === 'authorization_code') {
      const code = await readCode(cfg.keys, f('code'))
      if (!f('client_id') || f('client_id') !== code.cid) throw new AuthError('invalid_grant', 'code was issued to another client')
      if (f('redirect_uri') && f('redirect_uri') !== code.ru) throw new AuthError('invalid_grant', 'redirect_uri does not match')
      if (!pkceMatches(f('code_verifier'), code.cc)) throw new AuthError('invalid_grant', 'PKCE verification failed')
      if (code.res !== resource || (f('resource') && f('resource').replace(/\/$/, '') !== resource)) throw new AuthError('invalid_target', 'wrong resource')
      const tokens = await issueTokens(cfg.keys, { issuer: origin, resource, clientId: code.cid, scope: code.scope })
      return json(tokens, 200, { 'Cache-Control': 'no-store', Pragma: 'no-cache' })
    }
    if (f('grant_type') === 'refresh_token') {
      const rt = await readRefresh(cfg.keys, f('refresh_token'), origin)
      if (f('client_id') && f('client_id') !== rt.cid) throw new AuthError('invalid_grant', 'refresh token was issued to another client')
      if (rt.res !== resource || (f('resource') && f('resource').replace(/\/$/, '') !== resource)) throw new AuthError('invalid_target', 'wrong resource')
      const tokens = await issueTokens(cfg.keys, { issuer: origin, resource, clientId: rt.cid, scope: rt.scope })
      return json(tokens, 200, { 'Cache-Control': 'no-store', Pragma: 'no-cache' })
    }
    return oauthError('unsupported_grant_type', 'authorization_code or refresh_token')
  } catch (err) {
    if (err instanceof AuthError) return oauthError(err.code, err.message, err.code === 'invalid_client' ? 401 : 400)
    throw err
  }
}

/* ---------------------------------------------------------------- router */

export async function handleOAuth(req: Request, op: string | null, cfg: OAuthConfig): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  const origin = originOf(req)
  switch (op) {
    case 'prm':
      return json(protectedResourceMetadata(origin), 200, { 'Cache-Control': 'max-age=300' })
    case 'as':
      return json(authorizationServerMetadata(origin), 200, { 'Cache-Control': 'max-age=300' })
    case 'register':
      return register(req, cfg)
    case 'authorize':
      if (req.method === 'GET') return authorizeGet(req, cfg, origin)
      if (req.method === 'POST') return authorizePost(req, cfg, origin)
      return html(errorPage('GET or POST only'), 405)
    case 'token':
      return token(req, cfg, origin)
    default:
      return oauthError('invalid_request', 'not a thing.', 404)
  }
}
