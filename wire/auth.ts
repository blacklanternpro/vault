import { createHash, hkdfSync, timingSafeEqual } from 'node:crypto'
import { jwtVerify, SignJWT, type JWTPayload } from 'jose'

/*
 * The smallest correct OAuth 2.1 authorization server for one person with one
 * passphrase. Everything is stateless: a client id, an authorization code, an
 * access token and a refresh token are each a JWT signed with HS256 under a key
 * derived from VAULT_AUTH_SECRET, one key per purpose, so a token of one kind
 * can never be passed off as another. Nothing is stored anywhere.
 *
 * What statelessness costs (written down in docs/WIRE_SPIKE.md): an
 * authorization code can be redeemed more than once inside its two minutes
 * (PKCE still binds it to whoever holds the verifier), and a refresh token
 * stays valid until it expires even after it has been rotated. Rotating
 * VAULT_AUTH_SECRET revokes everything at once.
 */

export const ACCESS_TTL = 60 * 60 // 1 hour
export const REFRESH_TTL = 30 * 24 * 60 * 60 // 30 days
export const CODE_TTL = 120 // 2 minutes
export const TXN_TTL = 10 * 60 // the passphrase page stays valid for 10 minutes
export const SCOPE = 'vault'

export type Purpose = 'client' | 'code' | 'access' | 'refresh' | 'txn'

export class AuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

/* ------------------------------------------------------------------ keys */

export type Keys = Record<Purpose, Uint8Array>

/** One HS256 key per purpose, derived from the one secret with HKDF. */
export function deriveKeys(secret: string): Keys {
  if (!secret || secret.length < 32) throw new Error('VAULT_AUTH_SECRET must be at least 32 characters')
  const key = (purpose: Purpose) => new Uint8Array(hkdfSync('sha256', secret, 'vault-wire-spike', `vault/${purpose}/v1`, 32))
  return { client: key('client'), code: key('code'), access: key('access'), refresh: key('refresh'), txn: key('txn') }
}

/* ------------------------------------------------------------ passphrase */

/** Constant-time: both sides are hashed first, so length leaks nothing either. */
export function passphraseMatches(given: string, expected: string): boolean {
  if (!expected) return false
  const a = createHash('sha256').update(given, 'utf8').digest()
  const b = createHash('sha256').update(expected, 'utf8').digest()
  return timingSafeEqual(a, b)
}

/* ------------------------------------------------------------------ PKCE */

export function s256(verifier: string): string {
  return createHash('sha256').update(verifier, 'ascii').digest('base64url')
}

const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/
const CHALLENGE = /^[A-Za-z0-9_-]{43}$/

export function isChallenge(value: string): boolean {
  return CHALLENGE.test(value)
}

/** RFC 7636 §4.6, constant-time on the derived challenge. */
export function pkceMatches(verifier: string, challenge: string): boolean {
  if (!VERIFIER.test(verifier) || !CHALLENGE.test(challenge)) return false
  const a = Buffer.from(s256(verifier))
  const b = Buffer.from(challenge)
  return a.length === b.length && timingSafeEqual(a, b)
}

/* ------------------------------------------------------- redirect allow-list */

/** The hosted Claude apps' callbacks (web, desktop, mobile, Cowork). */
export const CLAUDE_CALLBACKS = ['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback']
/**
 * Hosts (and their subdomains) whose Client ID Metadata Documents we will
 * fetch. Anthropic doesn't document the hosted apps' CIMD URL (Claude Code's
 * is https://claude.ai/oauth/claude-code-client-metadata), so this is a
 * little wider than claude.ai. The redirect allow-list holds either way.
 */
export const CIMD_HOSTS = ['claude.ai', 'claude.com', 'anthropic.com']

export function cimdHostAllowed(hostname: string): boolean {
  return CIMD_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h))
}

function isLoopback(u: URL): boolean {
  return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]')
}

/**
 * The only places a code may ever be sent: Claude's two callbacks exactly, or
 * a loopback address (Claude Code, local testing). Everything else is refused,
 * whatever a client registered.
 */
export function redirectAllowed(uri: string): boolean {
  let u: URL
  try {
    u = new URL(uri)
  } catch {
    return false
  }
  if (u.hash || u.username || u.password) return false
  if (CLAUDE_CALLBACKS.includes(uri)) return true
  return isLoopback(u)
}

/** RFC 8252 §7.3: loopback redirects match with the port ignored; everything else exactly. */
export function redirectMatches(requested: string, registered: string): boolean {
  if (requested === registered) return true
  try {
    const a = new URL(requested)
    const b = new URL(registered)
    if (!isLoopback(a) || !isLoopback(b)) return false
    return a.hostname === b.hostname && a.pathname === b.pathname && a.search === b.search
  } catch {
    return false
  }
}

export function isLoopbackUri(uri: string): boolean {
  try {
    return isLoopback(new URL(uri))
  } catch {
    return false
  }
}

/* ------------------------------------------------------------ signed blobs */

async function sign(keys: Keys, purpose: Purpose, claims: JWTPayload, ttl: number | null, now: number): Promise<string> {
  const jwt = new SignJWT({ ...claims, use: purpose }).setProtectedHeader({ alg: 'HS256', typ: `vault-${purpose}` }).setIssuedAt(now)
  if (ttl != null) jwt.setExpirationTime(now + ttl)
  return jwt.sign(keys[purpose])
}

async function open<T extends JWTPayload>(keys: Keys, purpose: Purpose, token: string, now: number, extra: { audience?: string; issuer?: string } = {}): Promise<T> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, keys[purpose], { algorithms: ['HS256'], currentDate: new Date(now * 1000), ...extra })
    if (protectedHeader.typ !== `vault-${purpose}` || payload.use !== purpose) throw new Error('wrong kind of token')
    return payload as T
  } catch {
    throw new AuthError(purpose === 'client' ? 'invalid_client' : 'invalid_grant', `bad or expired ${purpose}`)
  }
}

const nowSec = () => Math.floor(Date.now() / 1000)

/* ---- client ids (DCR): the registration itself, signed, handed back as the id */

export type Registration = { redirect_uris: string[]; client_name?: string }

export async function issueClientId(keys: Keys, reg: Registration, now = nowSec()): Promise<string> {
  return sign(keys, 'client', { r: reg.redirect_uris, n: reg.client_name ?? '', jti: crypto.randomUUID() }, null, now)
}

export async function readClientId(keys: Keys, clientId: string, now = nowSec()): Promise<Registration> {
  const p = await open<JWTPayload & { r?: unknown; n?: unknown }>(keys, 'client', clientId, now)
  if (!Array.isArray(p.r) || !p.r.every((u) => typeof u === 'string')) throw new AuthError('invalid_client', 'bad client id')
  return { redirect_uris: p.r as string[], client_name: typeof p.n === 'string' && p.n ? p.n : undefined }
}

/* ---- the passphrase page's transaction: the checked /authorize request, signed */

export type AuthRequest = { client_id: string; redirect_uri: string; code_challenge: string; state: string; resource: string; scope: string }

export async function issueTxn(keys: Keys, req: AuthRequest, now = nowSec()): Promise<string> {
  return sign(keys, 'txn', { ...req }, TXN_TTL, now)
}

export async function readTxn(keys: Keys, txn: string, now = nowSec()): Promise<AuthRequest> {
  const p = await open<JWTPayload & AuthRequest>(keys, 'txn', txn, now)
  return { client_id: p.client_id, redirect_uri: p.redirect_uri, code_challenge: p.code_challenge, state: p.state, resource: p.resource, scope: p.scope }
}

/* ---- authorization codes */

export async function issueCode(keys: Keys, req: AuthRequest, now = nowSec()): Promise<string> {
  return sign(keys, 'code', { cid: req.client_id, ru: req.redirect_uri, cc: req.code_challenge, res: req.resource, scope: req.scope }, CODE_TTL, now)
}

export type CodeClaims = { cid: string; ru: string; cc: string; res: string; scope: string }

export async function readCode(keys: Keys, code: string, now = nowSec()): Promise<CodeClaims> {
  return open<JWTPayload & CodeClaims>(keys, 'code', code, now)
}

/* ---- access + refresh tokens */

export type TokenResponse = { access_token: string; token_type: 'Bearer'; expires_in: number; refresh_token: string; scope: string }

export async function issueTokens(keys: Keys, opts: { issuer: string; resource: string; clientId: string; scope: string }, now = nowSec()): Promise<TokenResponse> {
  const access = await new SignJWT({ use: 'access', cid: opts.clientId, scope: opts.scope })
    .setProtectedHeader({ alg: 'HS256', typ: 'vault-access' })
    .setIssuer(opts.issuer)
    .setAudience(opts.resource)
    .setSubject('owner')
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TTL)
    .sign(keys.access)
  const refresh = await new SignJWT({ use: 'refresh', cid: opts.clientId, scope: opts.scope, res: opts.resource, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256', typ: 'vault-refresh' })
    .setIssuer(opts.issuer)
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TTL)
    .sign(keys.refresh)
  return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL, refresh_token: refresh, scope: opts.scope }
}

export type RefreshClaims = { cid: string; scope: string; res: string }

export async function readRefresh(keys: Keys, token: string, issuer: string, now = nowSec()): Promise<RefreshClaims> {
  return open<JWTPayload & RefreshClaims>(keys, 'refresh', token, now, { issuer })
}

export type AccessClaims = { cid: string; scope: string; exp: number; sub: string }

/** Verifies signature, kind, issuer, audience (= this resource) and expiry. */
export async function readAccess(keys: Keys, token: string, issuer: string, resource: string, now = nowSec()): Promise<AccessClaims> {
  const p = await open<JWTPayload & AccessClaims>(keys, 'access', token, now, { issuer, audience: resource })
  return { cid: p.cid, scope: p.scope, exp: p.exp as number, sub: p.sub as string }
}
