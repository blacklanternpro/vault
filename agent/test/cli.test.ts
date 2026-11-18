import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportText } from '../../src/model/store'
import { LIVE_SITE_ORIGIN, parseSize, resolveFile, resolveOrigins } from '../src/config'
import { main } from '../src/main'
import { FileStore } from '../src/store'
import { fixtureDoc, makeStore, type Fixture } from './fixture'

let fx: Fixture
let out: string[]
let err: string[]
const run = (args: string[], stdin?: string) => main(['--file', fx.store.file, ...args], { out: (s) => out.push(s), err: (s) => err.push(s), stdin: stdin === undefined ? undefined : () => stdin, env: {} })

beforeEach(() => {
  fx = makeStore()
  out = []
  err = []
})
afterEach(() => fx.cleanup())

describe('vault-agent', () => {
  it('prints usage without a command and for --help', async () => {
    expect(await run([])).toBe(2)
    expect(out.join('')).toContain('Usage: vault-agent <command>')
    out = []
    expect(await run(['--help'])).toBe(2)
    expect(await run(['ls', '--help'])).toBe(0)
    expect(await run(['--bogus'])).toBe(2)
    expect(err.join('')).toContain("Unknown option '--bogus'")
    expect(await run(['dance'])).toBe(2)
  })

  it('ls, with a project and --json', async () => {
    expect(await run(['ls'])).toBe(0)
    expect(out.join('')).toContain('11 tasks (all projects)')
    out = []
    expect(await run(['ls', 'homepage', '--status', 'active', '--json'])).toBe(0)
    expect(JSON.parse(out.join(''))).toMatchObject({ count: 1, tasks: [{ id: 2 }] })
  })

  it('brief by id or title', async () => {
    expect(await run(['brief', 'site', 'redesign'])).toBe(0)
    expect(out.join('')).toMatch(/^# SITE REDESIGN\n/)
    out = []
    expect(await run(['brief', 'navv'])).toBe(1)
    expect(err.join('')).toBe("No task matches 'navv'; closest: NAV RESTRUCTURE (#8)\n")
    expect(await run(['brief'])).toBe(1)
  })

  it('tick and report', async () => {
    expect(await run(['tick', '2', 'create', 'wireframes'])).toBe(0)
    expect(out.join('')).toContain('Ticked "Create wireframes"')
    expect(await run(['report', '2'], '## Report\n- [x] add motion prototypes\nLeft off: nearly there\n')).toBe(0)
    expect(out.join('')).toContain('ticked 1, added 0, skipped 0, left off noted')
    expect(fx.store.read().doc.nodes.find((n) => n.id === 2)?.leftOff).toBe('nearly there')
    expect(fx.store.readInbox()).toHaveLength(1)
    expect(await run(['report'])).toBe(1)
    expect(await run(['tick', '2'])).toBe(1)
  })

  it('import copies an export into the board file, and export prints it back', async () => {
    const target = new FileStore(path.join(fx.dir, 'elsewhere', 'vault.json'))
    const exported = path.join(fx.dir, 'vault-2026-11-02-0100.json')
    fs.writeFileSync(exported, exportText(fixtureDoc()))
    expect(await main(['import', exported, '--file', target.file], { out: (s) => out.push(s), err: (s) => err.push(s) })).toBe(0)
    expect(out.join('')).toContain('Imported 22 items and 1 notes')
    expect(target.read().doc).toEqual(fixtureDoc())
    out = []
    expect(await main(['export', '--file', target.file], { out: (s) => out.push(s), err: (s) => err.push(s) })).toBe(0)
    const env = JSON.parse(out.join(''))
    expect(env).toMatchObject({ app: 'vault', version: 1 })
    expect(env.doc).toEqual(fixtureDoc())
    expect(await main(['import', path.join(fx.dir, 'missing.json'), '--file', target.file], { out: () => {}, err: (s) => err.push(s) })).toBe(1)
    fs.writeFileSync(exported, 'garbage')
    expect(await main(['import', exported, '--file', target.file], { out: () => {}, err: (s) => err.push(s) })).toBe(1)
    expect(err.join('')).toContain("isn't a VAULT export")
  })

  it('serve makes the token, prints a hand-off link per origin, locks every route, and stops when told', async () => {
    let stop!: () => void
    const until = new Promise<void>((resolve) => {
      stop = resolve
    })
    const running = main(['serve', '--port', '0', '--file', fx.store.file, '--origin', 'https://vault.example.app'], { out: (s) => out.push(s), err: (s) => err.push(s), until, env: {} })
    while (!err.join('').includes('open the app with its token')) await new Promise((r) => setTimeout(r, 10))
    await new Promise((r) => setTimeout(r, 20))
    const banner = err.join('')
    const tokenFile = path.join(fx.dir, 'bridge-token')
    const token = fs.readFileSync(tokenFile, 'utf8').trim()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    if (process.platform !== 'win32') expect(fs.statSync(tokenFile).mode & 0o777).toBe(0o600)
    expect(banner).toContain(`token:    ${tokenFile} (new)`)
    expect(banner).toContain('origins:  http://localhost:5173, http://localhost:4173, http://127.0.0.1:5173, http://127.0.0.1:4173, https://vault.example.app\n')
    expect(banner).not.toContain(LIVE_SITE_ORIGIN)
    expect(banner).toContain('max body: 5 MiB')
    expect(banner).toContain(`    http://localhost:5173/#bridge-token=${token}\n`)
    expect(banner).toContain(`    https://vault.example.app/#bridge-token=${token}\n`)
    const url = /bridge on (http:\/\/[^\s]+)/.exec(banner)![1]
    expect(await fetch(`${url}/health`).then((r) => r.json())).toMatchObject({ app: 'vault-agent', authorized: false })
    expect((await fetch(`${url}/doc`)).status).toBe(401)
    const health = await fetch(`${url}/health`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    expect(health).toMatchObject({ app: 'vault-agent', authorized: true, file: fx.store.file, rev: 1 })

    // A rotation while it runs takes effect at once.
    out = []
    expect(await run(['token', '--rotate', '--json'])).toBe(0)
    const rotated = JSON.parse(out.join('')).token as string
    expect((await fetch(`${url}/doc`, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(401)
    expect((await fetch(`${url}/doc`, { headers: { Authorization: `Bearer ${rotated}` } })).status).toBe(200)

    stop()
    expect(await running).toBe(0)
    await expect(fetch(`${url}/health`)).rejects.toThrow()
  })

  it('serve takes --origin from VAULT_ORIGINS, --token-file / VAULT_TOKEN_FILE, and --max-body; refuses a bad size', async () => {
    let stop!: () => void
    const until = new Promise<void>((resolve) => {
      stop = resolve
    })
    const tokenFile = path.join(fx.dir, 'elsewhere', 'tok')
    const env = { VAULT_ORIGINS: `${LIVE_SITE_ORIGIN}, https://b.example`, VAULT_TOKEN_FILE: tokenFile }
    const running = main(['serve', '--port', '0', '--file', fx.store.file, '--max-body', '256kb'], { out: (s) => out.push(s), err: (s) => err.push(s), until, env })
    while (!err.join('').includes('open the app with its token')) await new Promise((r) => setTimeout(r, 10))
    await new Promise((r) => setTimeout(r, 20))
    const banner = err.join('')
    expect(banner).toContain(`https://vault-lilac-six.vercel.app, https://b.example\n`)
    expect(banner).toContain(`token:    ${tokenFile} (new)`)
    expect(banner).toContain('max body: 256 KiB')
    expect(banner).toContain(`${LIVE_SITE_ORIGIN}/#bridge-token=`)
    stop()
    expect(await running).toBe(0)
    err = []
    expect(await run(['serve', '--port', '0', '--max-body', 'lots'])).toBe(1)
    expect(err.join('')).toContain("--max-body must be a size")
  })

  it('token prints the token and the links, makes the file when missing, and --rotate replaces it', async () => {
    const tokenFile = path.join(fx.dir, 'bridge-token')
    expect(await run(['token'])).toBe(0)
    const first = fs.readFileSync(tokenFile, 'utf8').trim()
    const text = out.join('')
    expect(text).toContain(`token file: ${tokenFile} (new)`)
    expect(text).toContain(`token:      ${first}\n`)
    expect(text).toContain(`  http://localhost:5173/#bridge-token=${first}\n`)
    expect(text).toContain(`--origin ${LIVE_SITE_ORIGIN}`)
    out = []
    expect(await run(['token', '--json', '--origin', LIVE_SITE_ORIGIN])).toBe(0)
    const json = JSON.parse(out.join(''))
    expect(json).toMatchObject({ file: tokenFile, token: first, rotated: false, created: false })
    expect(json.links).toContain(`${LIVE_SITE_ORIGIN}/#bridge-token=${first}`)
    out = []
    expect(await run(['token', '--rotate'])).toBe(0)
    const second = fs.readFileSync(tokenFile, 'utf8').trim()
    expect(second).not.toBe(first)
    expect(second).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(out.join('')).toContain('(rotated; links handed out before no longer work)')
    if (process.platform !== 'win32') expect(fs.statSync(tokenFile).mode & 0o777).toBe(0o600)
    fs.writeFileSync(tokenFile, 'not a token at all !!')
    err = []
    expect(await run(['token'])).toBe(1)
    expect(err.join('')).toContain('vault-agent token --rotate')
  })
})

describe('resolveFile', () => {
  it('prefers --file, then VAULT_FILE, then ~/.vault/vault.json', () => {
    expect(resolveFile('/x/board.json', {})).toBe(path.resolve('/x/board.json'))
    expect(resolveFile(undefined, { VAULT_FILE: 'rel/board.json' })).toBe(path.resolve('rel/board.json'))
    expect(resolveFile('', { VAULT_FILE: '' })).toMatch(/[\\/]\.vault[\\/]vault\.json$/)
    expect(resolveFile('~/boards/v.json', {})).not.toContain('~')
  })
})

describe('resolveOrigins and parseSize', () => {
  it('the local servers first, then VAULT_ORIGINS, then --origin; deduplicated; never the live site by default', () => {
    expect(resolveOrigins([], {})).toEqual(['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'])
    expect(resolveOrigins([], {})).not.toContain(LIVE_SITE_ORIGIN)
    expect(resolveOrigins(['https://a.example/', 'http://localhost:5173'], { VAULT_ORIGINS: ' https://B.example ,,https://a.example' }).slice(4)).toEqual(['https://B.example', 'https://a.example'])
  })

  it('reads bytes and k/m suffixes', () => {
    expect(parseSize('524288')).toBe(524288)
    expect(parseSize('512k')).toBe(512 * 1024)
    expect(parseSize('5mb')).toBe(5 * 1024 * 1024)
    expect(parseSize('5 MiB')).toBe(5 * 1024 * 1024)
    expect(parseSize('0')).toBeUndefined()
    expect(parseSize('lots')).toBeUndefined()
    expect(parseSize('-1')).toBeUndefined()
  })
})
