import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { expandHome } from './config.js'

/*
 * The bridge's lock: one secret in a file beside the board
 * (`~/.vault/bridge-token` by default). Every HTTP request but the CORS
 * preflight and a minimal /health must carry it as
 * `Authorization: Bearer <token>`. `vault-agent serve` and `vault-agent token`
 * print links that hand it to the web app as `#bridge-token=<token>`.
 *
 * The file is created owner-only (0600). On Windows the mode is ignored; the
 * file then sits under the user's profile, which only that user can read.
 */

export const TOKEN_FILE_NAME = 'bridge-token'
/** URL-safe, so it travels in a URL hash untouched; long enough not to be guessed. */
const TOKEN_SHAPE = /^[A-Za-z0-9._~-]{16,512}$/

export class TokenError extends Error {}

/** `--token-file`, else `VAULT_TOKEN_FILE`, else `bridge-token` beside the board file. Always absolute. */
export function resolveTokenFile(boardFile: string, explicit?: string, env: NodeJS.ProcessEnv = process.env): string {
  const raw = explicit?.trim() || env.VAULT_TOKEN_FILE?.trim()
  if (raw) return path.resolve(expandHome(raw))
  return path.join(path.dirname(path.resolve(boardFile)), TOKEN_FILE_NAME)
}

/** 32 random bytes, base64url (43 characters). */
export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

/** The token in the file; undefined when there is no file or it is empty. */
export function readToken(file: string): string | undefined {
  let raw: string
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw new TokenError(`cannot read the bridge token ${file}: ${(err as Error).message}`)
  }
  const token = raw.trim()
  if (!token) return undefined
  if (!TOKEN_SHAPE.test(token)) throw new TokenError(`${file} does not hold a usable bridge token; make a new one with: vault-agent token --rotate`)
  return token
}

/** Reads the token, creating the file (owner-only) when there is none. */
export function ensureToken(file: string): { token: string; created: boolean } {
  const existing = readToken(file)
  if (existing) return { token: existing, created: false }
  const token = newToken()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  try {
    // 'wx' so two processes starting at once cannot both write one; the loser reads the winner's.
    fs.writeFileSync(file, token + '\n', { mode: 0o600, flag: fs.existsSync(file) ? 'w' : 'wx' })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      const theirs = readToken(file)
      if (theirs) return { token: theirs, created: false }
    }
    throw new TokenError(`cannot write the bridge token ${file}: ${(err as Error).message}`)
  }
  ownerOnly(file)
  return { token, created: true }
}

/** Writes a new token over the old one (atomically) and returns it. The old one stops working at once. */
export function rotateToken(file: string): string {
  const token = newToken()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now().toString(36)}.tmp`
  try {
    fs.writeFileSync(tmp, token + '\n', { mode: 0o600, flag: 'wx' })
    ownerOnly(tmp)
    fs.renameSync(tmp, file)
  } catch (err) {
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* never made, or already moved */
    }
    throw new TokenError(`cannot write the bridge token ${file}: ${(err as Error).message}`)
  }
  ownerOnly(file)
  return token
}

/** chmod 0600; a no-op where the OS has no such modes (Windows). The umask can only narrow the create mode, never widen it, but an existing file keeps its own. */
function ownerOnly(file: string): void {
  if (process.platform === 'win32') return
  try {
    fs.chmodSync(file, 0o600)
  } catch {
    /* best effort; isLooseMode reports it */
  }
}

/** True when others than the owner can read or write the file. Always false on Windows. */
export function isLooseMode(file: string): boolean {
  if (process.platform === 'win32') return false
  try {
    return (fs.statSync(file).mode & 0o077) !== 0
  } catch {
    return false
  }
}

/**
 * The current token, rereading the file when it changes, so a
 * `vault-agent token --rotate` takes effect on a running bridge. A file that
 * disappears or turns unreadable keeps the last good token in force.
 */
export function tokenSource(file: string, initial?: string): () => string {
  let token = initial ?? readToken(file) ?? ''
  let stamp = statStamp(file)
  return () => {
    const now = statStamp(file)
    if (now && now !== stamp) {
      try {
        const next = readToken(file)
        if (next) token = next
      } catch {
        /* keep the last good one */
      }
      stamp = now
    }
    return token
  }
}

function statStamp(file: string): string | undefined {
  try {
    const s = fs.statSync(file, { bigint: true })
    return `${s.ino}:${s.size}:${s.mtimeNs}:${s.ctimeNs}`
  } catch {
    return undefined
  }
}

/** Constant-time: both sides are hashed first, so neither length nor content leaks through timing. */
export function tokenMatches(expected: string, given: string | undefined): boolean {
  if (!expected || !given) return false
  const a = createHash('sha256').update(expected).digest()
  const b = createHash('sha256').update(given).digest()
  return timingSafeEqual(a, b)
}

/** `Authorization: Bearer <token>` → the token; anything else → undefined. */
export function bearerOf(header: string | string[] | undefined): string | undefined {
  if (typeof header !== 'string') return undefined
  const m = /^\s*Bearer\s+(\S+)\s*$/i.exec(header)
  return m ? m[1] : undefined
}

/** One link per origin that opens the app and hands it the token in the URL hash. */
export function handoffLinks(origins: readonly string[], token: string): string[] {
  return origins.map((o) => `${o.trim().replace(/\/+$/, '')}/#bridge-token=${token}`)
}
