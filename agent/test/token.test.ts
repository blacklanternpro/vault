import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ensureToken, handoffLinks, isLooseMode, newToken, readToken, resolveTokenFile, rotateToken, TokenError, tokenMatches, tokenSource } from '../src/token'

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-token-'))
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

const posix = process.platform !== 'win32'

describe('resolveTokenFile', () => {
  it('prefers --token-file, then VAULT_TOKEN_FILE, then bridge-token beside the board', () => {
    const board = path.join(dir, 'boards', 'vault.json')
    expect(resolveTokenFile(board, '/x/tok', {})).toBe(path.resolve('/x/tok'))
    expect(resolveTokenFile(board, undefined, { VAULT_TOKEN_FILE: 'rel/tok' })).toBe(path.resolve('rel/tok'))
    expect(resolveTokenFile(board, '  ', { VAULT_TOKEN_FILE: '' })).toBe(path.join(dir, 'boards', 'bridge-token'))
    expect(resolveTokenFile(board, '~/t', {})).not.toContain('~')
  })
})

describe('the token file', () => {
  it('is created once, with 32 random bytes as base64url, readable only by its owner', () => {
    const file = path.join(dir, 'nested', 'bridge-token')
    const first = ensureToken(file)
    expect(first.created).toBe(true)
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(first.token, 'base64url')).toHaveLength(32)
    if (posix) expect(fs.statSync(file).mode & 0o777).toBe(0o600)
    const again = ensureToken(file)
    expect(again).toEqual({ token: first.token, created: false })
    expect(readToken(file)).toBe(first.token)
  })

  it('newToken never repeats', () => {
    const seen = new Set(Array.from({ length: 50 }, () => newToken()))
    expect(seen.size).toBe(50)
  })

  it('rotate replaces it with a new one, still owner-only', () => {
    const file = path.join(dir, 'bridge-token')
    const { token } = ensureToken(file)
    const next = rotateToken(file)
    expect(next).not.toBe(token)
    expect(readToken(file)).toBe(next)
    if (posix) expect(fs.statSync(file).mode & 0o777).toBe(0o600)
    expect(fs.readdirSync(dir)).toEqual(['bridge-token'])
  })

  it('an empty file counts as missing; a mangled one is an error that says how to fix it', () => {
    const file = path.join(dir, 'bridge-token')
    fs.writeFileSync(file, '\n')
    expect(readToken(file)).toBeUndefined()
    expect(ensureToken(file).created).toBe(true)
    fs.writeFileSync(file, 'has spaces in it and is not a token')
    expect(() => readToken(file)).toThrow(TokenError)
    expect(() => readToken(file)).toThrow(/vault-agent token --rotate/)
    expect(readToken(path.join(dir, 'missing'))).toBeUndefined()
  })

  it('reports a token file others can read (POSIX only)', () => {
    const file = path.join(dir, 'bridge-token')
    ensureToken(file)
    expect(isLooseMode(file)).toBe(false)
    if (posix) {
      fs.chmodSync(file, 0o644)
      expect(isLooseMode(file)).toBe(true)
    }
  })

  it('tokenSource follows a rotation without a restart', () => {
    const file = path.join(dir, 'bridge-token')
    const { token } = ensureToken(file)
    const current = tokenSource(file)
    expect(current()).toBe(token)
    const next = rotateToken(file)
    // mtime granularity can be coarse; the source also compares size and inode, and rereads when unsure.
    expect(current()).toBe(next)
    fs.rmSync(file)
    expect(current()).toBe(next)
  })
})

describe('tokenMatches', () => {
  it('compares in constant time, whatever the lengths', () => {
    const t = newToken()
    expect(tokenMatches(t, t)).toBe(true)
    expect(tokenMatches(t, t.slice(0, -1))).toBe(false)
    expect(tokenMatches(t, t + 'x')).toBe(false)
    expect(tokenMatches(t, '')).toBe(false)
    expect(tokenMatches(t, undefined)).toBe(false)
  })
})

describe('handoffLinks', () => {
  it('gives each origin a link that hands the app its token in the hash', () => {
    expect(handoffLinks(['http://localhost:5173', 'https://vault.example.app/'], 'tok_en')).toEqual([
      'http://localhost:5173/#bridge-token=tok_en',
      'https://vault.example.app/#bridge-token=tok_en',
    ])
  })
})
