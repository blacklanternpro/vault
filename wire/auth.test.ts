import { describe, expect, it } from 'vitest'
import {
  ACCESS_TTL,
  cimdHostAllowed,
  CODE_TTL,
  deriveKeys,
  issueClientId,
  issueCode,
  issueTokens,
  issueTxn,
  passphraseMatches,
  pkceMatches,
  readAccess,
  readClientId,
  readCode,
  readRefresh,
  readTxn,
  redirectAllowed,
  redirectMatches,
  REFRESH_TTL,
  s256,
} from './auth'

const SECRET = 'test-secret-test-secret-test-secret-0123'
const keys = deriveKeys(SECRET)
const other = deriveKeys('another-secret-another-secret-another-99')
const ISS = 'https://wire.example'
const RES = 'https://wire.example/api/mcp'
const T0 = 1_800_000_000

const req = { client_id: 'cid', redirect_uri: 'https://claude.ai/api/mcp/auth_callback', code_challenge: s256('v'.repeat(43)), state: 'st', resource: RES, scope: 'vault' }

describe('keys', () => {
  it('refuses a short secret', () => {
    expect(() => deriveKeys('short')).toThrow()
  })
  it('derives a different key per purpose', () => {
    const all = Object.values(keys).map((k) => Buffer.from(k).toString('hex'))
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('passphrase', () => {
  it('matches only the exact passphrase', () => {
    expect(passphraseMatches('correct horse', 'correct horse')).toBe(true)
    expect(passphraseMatches('correct hors', 'correct horse')).toBe(false)
    expect(passphraseMatches('Correct horse', 'correct horse')).toBe(false)
    expect(passphraseMatches('', 'correct horse')).toBe(false)
  })
  it('never matches when no passphrase is configured', () => {
    expect(passphraseMatches('', '')).toBe(false)
  })
})

describe('PKCE S256', () => {
  // RFC 7636 appendix B
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  it('agrees with the RFC example', () => {
    expect(s256(verifier)).toBe(challenge)
    expect(pkceMatches(verifier, challenge)).toBe(true)
  })
  it('refuses a wrong or malformed verifier', () => {
    expect(pkceMatches(verifier.slice(0, -1) + 'j', challenge)).toBe(false)
    expect(pkceMatches('short', challenge)).toBe(false)
    expect(pkceMatches(verifier, 'plain')).toBe(false)
  })
})

describe('redirect allow-list', () => {
  it("allows Claude's two callbacks exactly", () => {
    expect(redirectAllowed('https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(redirectAllowed('https://claude.com/api/mcp/auth_callback')).toBe(true)
  })
  it('refuses anything else on or near claude', () => {
    for (const u of [
      'https://claude.ai/somewhere',
      'http://claude.ai/api/mcp/auth_callback',
      'https://claude.ai.evil.com/api/mcp/auth_callback',
      'https://evil.com/api/mcp/auth_callback',
      'https://claude.ai/api/mcp/auth_callback#x',
      'https://user@claude.ai/api/mcp/auth_callback',
      'javascript:alert(1)',
      'not a url',
    ])
      expect(redirectAllowed(u), u).toBe(false)
  })
  it('allows loopback on any port, http only', () => {
    expect(redirectAllowed('http://localhost:3118/callback')).toBe(true)
    expect(redirectAllowed('http://127.0.0.1:50000/callback')).toBe(true)
    expect(redirectAllowed('https://localhost/callback')).toBe(false)
    expect(redirectAllowed('http://localhost.evil.com/callback')).toBe(false)
  })
  it('matches loopback with the port ignored, everything else exactly', () => {
    expect(redirectMatches('http://localhost:3118/callback', 'http://localhost/callback')).toBe(true)
    expect(redirectMatches('http://127.0.0.1:9/callback', 'http://127.0.0.1/callback')).toBe(true)
    expect(redirectMatches('http://localhost:9/other', 'http://localhost/callback')).toBe(false)
    expect(redirectMatches('http://127.0.0.1:9/callback', 'http://localhost/callback')).toBe(false)
    expect(redirectMatches('https://claude.ai/api/mcp/auth_callback', 'https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(redirectMatches('https://claude.ai/api/mcp/auth_callback/', 'https://claude.ai/api/mcp/auth_callback')).toBe(false)
  })
})

describe('CIMD hosts', () => {
  it('claude and anthropic hosts only', () => {
    expect(cimdHostAllowed('claude.ai')).toBe(true)
    expect(cimdHostAllowed('api.anthropic.com')).toBe(true)
    expect(cimdHostAllowed('evilclaude.ai')).toBe(false)
    expect(cimdHostAllowed('claude.ai.evil.com')).toBe(false)
  })
})

describe('signed client ids', () => {
  it('round-trip the registration', async () => {
    const id = await issueClientId(keys, { redirect_uris: ['https://claude.ai/api/mcp/auth_callback'], client_name: 'Claude' })
    expect(await readClientId(keys, id)).toEqual({ redirect_uris: ['https://claude.ai/api/mcp/auth_callback'], client_name: 'Claude' })
  })
  it('refuse a forged or tampered id', async () => {
    const id = await issueClientId(other, { redirect_uris: ['https://evil.com/cb'] })
    await expect(readClientId(keys, id)).rejects.toThrow()
    const good = await issueClientId(keys, { redirect_uris: ['https://claude.ai/api/mcp/auth_callback'] })
    const [h, , s] = good.split('.')
    const forgedBody = Buffer.from(JSON.stringify({ r: ['https://evil.com/cb'], use: 'client' })).toString('base64url')
    await expect(readClientId(keys, `${h}.${forgedBody}.${s}`)).rejects.toThrow()
  })
})

describe('tokens of one kind cannot pass as another', () => {
  it('a code is not an access token, a client id is not a code', async () => {
    const code = await issueCode(keys, req, T0)
    await expect(readAccess(keys, code, ISS, RES, T0)).rejects.toThrow()
    const cid = await issueClientId(keys, { redirect_uris: [req.redirect_uri] }, T0)
    await expect(readCode(keys, cid, T0)).rejects.toThrow()
    const txn = await issueTxn(keys, req, T0)
    await expect(readCode(keys, txn, T0)).rejects.toThrow()
  })
  it('a refresh token is not an access token', async () => {
    const t = await issueTokens(keys, { issuer: ISS, resource: RES, clientId: 'cid', scope: 'vault' }, T0)
    await expect(readAccess(keys, t.refresh_token, ISS, RES, T0)).rejects.toThrow()
    await expect(readRefresh(keys, t.access_token, ISS, T0)).rejects.toThrow()
  })
})

describe('expiry', () => {
  it('codes last two minutes', async () => {
    const code = await issueCode(keys, req, T0)
    expect((await readCode(keys, code, T0 + CODE_TTL - 1)).cc).toBe(req.code_challenge)
    await expect(readCode(keys, code, T0 + CODE_TTL + 1)).rejects.toThrow()
  })
  it('access tokens last an hour, refresh tokens thirty days', async () => {
    const t = await issueTokens(keys, { issuer: ISS, resource: RES, clientId: 'cid', scope: 'vault' }, T0)
    expect(t.expires_in).toBe(ACCESS_TTL)
    expect((await readAccess(keys, t.access_token, ISS, RES, T0 + ACCESS_TTL - 5)).cid).toBe('cid')
    await expect(readAccess(keys, t.access_token, ISS, RES, T0 + ACCESS_TTL + 1)).rejects.toThrow()
    expect((await readRefresh(keys, t.refresh_token, ISS, T0 + REFRESH_TTL - 5)).cid).toBe('cid')
    await expect(readRefresh(keys, t.refresh_token, ISS, T0 + REFRESH_TTL + 1)).rejects.toThrow()
  })
  it('the passphrase page expires', async () => {
    const txn = await issueTxn(keys, req, T0)
    expect((await readTxn(keys, txn, T0 + 60)).state).toBe('st')
    await expect(readTxn(keys, txn, T0 + 3600)).rejects.toThrow()
  })
})

describe('access tokens are bound to this resource and issuer', () => {
  it('refuses another audience, issuer or key', async () => {
    const t = await issueTokens(keys, { issuer: ISS, resource: RES, clientId: 'cid', scope: 'vault' }, T0)
    await expect(readAccess(keys, t.access_token, ISS, 'https://other.example/api/mcp', T0)).rejects.toThrow()
    await expect(readAccess(keys, t.access_token, 'https://other.example', RES, T0)).rejects.toThrow()
    await expect(readAccess(other, t.access_token, ISS, RES, T0)).rejects.toThrow()
  })
})
