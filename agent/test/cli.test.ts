import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportText } from '../../src/model/store'
import { resolveFile } from '../src/config'
import { main } from '../src/main'
import { FileStore } from '../src/store'
import { fixtureDoc, makeStore, type Fixture } from './fixture'

let fx: Fixture
let out: string[]
let err: string[]
const run = (args: string[], stdin?: string) => main(['--file', fx.store.file, ...args], { out: (s) => out.push(s), err: (s) => err.push(s), stdin: stdin === undefined ? undefined : () => stdin })

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

  it('serve starts the bridge on the given port and stops when told', async () => {
    let stop!: () => void
    const until = new Promise<void>((resolve) => {
      stop = resolve
    })
    const running = main(['serve', '--port', '0', '--file', fx.store.file, '--origin', 'https://vault.example.app'], { out: (s) => out.push(s), err: (s) => err.push(s), until })
    while (!err.join('').includes('vault-agent bridge on')) await new Promise((r) => setTimeout(r, 10))
    const banner = err.join('')
    expect(banner).toContain('origins: http://localhost:5173, http://localhost:4173, http://127.0.0.1:5173, http://127.0.0.1:4173, https://vault.example.app')
    const url = /bridge on (http:\/\/[^\s]+)/.exec(banner)![1]
    const health = await fetch(`${url}/health`).then((r) => r.json())
    expect(health).toMatchObject({ app: 'vault-agent', file: fx.store.file })
    stop()
    expect(await running).toBe(0)
    await expect(fetch(`${url}/health`)).rejects.toThrow()
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
