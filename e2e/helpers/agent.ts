import { spawn, type ChildProcess } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

/*
 * A REAL vault-agent for browser tests: the agent's own HTTP bridge
 * (agent/src/http.ts, what `vault-agent serve` runs) in its own process via
 * e2e/helpers/serve-agent.ts, on a free port, against a board file in a fresh
 * temp dir; and the real `vault-agent` CLI (agent/src/cli.ts under tsx) for
 * the agent's writes.
 *
 * This is the one place e2e touches the agent, so when it changes only this
 * file follows. It is already shaped for G3's lock:
 *   - a token (32 URL-safe chars) is made here and passed to startBridge
 *     always; a bridge without the token rule ignores it;
 *   - the page always gets it as `#bridge-token=<token>` in its URL (the
 *     contract's hand-off, read by G1) and in the bridge settings too (for an
 *     app that does not read the hash yet); requests then carry
 *     `Authorization: Bearer <token>`, which the CORS rules already allow;
 *   - origins: http://localhost:4174 and http://127.0.0.1:4174 (the e2e
 *     preview), which are not in the agent's defaults;
 *   - the bridge is called at http://127.0.0.1:<port> (passes a Host check);
 *   - HOME/USERPROFILE point at the temp dir so nothing lands in a real home.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const TSX = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')
const CLI = path.join(ROOT, 'agent', 'src', 'cli.ts')
const SERVE = path.join(ROOT, 'e2e', 'helpers', 'serve-agent.ts')
export const APP_ORIGINS = ['http://localhost:4174', 'http://127.0.0.1:4174']

export type Agent = {
  /** Base URL of the bridge, e.g. http://127.0.0.1:41234 */
  url: string
  port: number
  /** The board file the agent works on. */
  file: string
  dir: string
  /** The bearer token the bridge is started with. */
  token: string
  /** Everything the serve process has printed so far. */
  output: () => string
  /** Runs one vault-agent CLI command against the same file. */
  cli: (args: string[], stdin?: string) => Promise<{ code: number; stdout: string; stderr: string }>
  /** The board file as it is on disk now. */
  read: () => { savedAt: number; rev?: number; doc: { nodes: Array<{ id: number; title: string; parent: number | null; status: string }>; notes: unknown[] } }
  /** Stops the bridge (the file and temp dir stay; `start` brings it back on the same port). */
  stop: () => Promise<void>
  /** Starts it again on the same port and file. */
  start: () => Promise<void>
  /** Stops it and deletes the temp dir. */
  dispose: () => Promise<void>
}

export async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo
      srv.close(() => resolve(port))
    })
  })
}

function envFor(dir: string, file: string): NodeJS.ProcessEnv {
  return { ...process.env, HOME: dir, USERPROFILE: dir, VAULT_FILE: file, NO_COLOR: '1' }
}

export async function startAgent(opts: { seed?: unknown; port?: number } = {}): Promise<Agent> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-e2e-agent-'))
  const file = path.join(dir, 'board', 'vault.json')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (opts.seed !== undefined) fs.writeFileSync(file, JSON.stringify(opts.seed, null, 2))
  const port = opts.port ?? (await freePort())
  let child: ChildProcess | null = null
  let out = ''
  const token = crypto.randomBytes(24).toString('base64url')

  const agent: Agent = {
    url: `http://127.0.0.1:${port}`,
    port,
    file,
    dir,
    token,
    output: () => out,
    cli: (args, stdin) =>
      new Promise((resolve, reject) => {
        const p = spawn(TSX, [CLI, ...args, '--file', file], { cwd: ROOT, env: envFor(dir, file), stdio: ['pipe', 'pipe', 'pipe'] })
        let stdout = ''
        let stderr = ''
        p.stdout!.on('data', (b: Buffer) => (stdout += b.toString()))
        p.stderr!.on('data', (b: Buffer) => (stderr += b.toString()))
        p.on('error', reject)
        p.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
        p.stdin!.end(stdin ?? '')
      }),
    read: () => JSON.parse(fs.readFileSync(file, 'utf8')),
    start: async () => {
      if (child) return
      const proc = spawn(TSX, [SERVE, file, String(port), token, ...APP_ORIGINS], { cwd: ROOT, env: envFor(dir, file), stdio: ['ignore', 'pipe', 'pipe'] })
      child = proc
      const ready = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`the agent bridge did not start in 20s:\n${out}`)), 20_000)
        const onData = (b: Buffer) => {
          out += b.toString()
          if (/^ready http/m.test(out)) {
            clearTimeout(timer)
            resolve()
          }
        }
        proc.stdout!.on('data', onData)
        proc.stderr!.on('data', onData)
        proc.once('exit', (code) => {
          clearTimeout(timer)
          reject(new Error(`the agent bridge exited (${code}) before it was ready:\n${out}`))
        })
      })
      await ready
      // Wait until it actually answers (a line can be printed a moment before the socket accepts).
      for (let i = 0; i < 50; i++) {
        try {
          await fetchHealth(agent)
          break
        } catch {
          await new Promise((r) => setTimeout(r, 100))
        }
      }
    },
    stop: async () => {
      const proc = child
      if (!proc) return
      child = null
      if (proc.exitCode != null) return
      await new Promise<void>((resolve) => {
        const kill = setTimeout(() => proc.kill('SIGKILL'), 5000)
        proc.once('exit', () => {
          clearTimeout(kill)
          resolve()
        })
        proc.kill('SIGTERM')
      })
    },
    dispose: async () => {
      await agent.stop()
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
  await agent.start()
  return agent
}

async function fetchHealth(agent: Agent): Promise<void> {
  const r = await fetch(`${agent.url}/health`, { headers: { authorization: `Bearer ${agent.token}` } })
  // Any HTTP answer means the socket is up (401 without a token is still "up").
  void r.status
}

/**
 * Opens the app with the bridge pointed at `agent` and switched on, from a
 * clean localStorage. Passes the token the contract's way (in the hash) and
 * in the settings.
 */
export async function openAppWithBridge(page: Page, agent: Agent, opts: { seedLocal?: string } = {}): Promise<void> {
  // One-shot: set up storage before the app's first script runs, and only on the first load of this tab.
  await page.addInitScript(
    ({ url, token, seedLocal }) => {
      if (sessionStorage.getItem('e2e:bridge-init')) return
      sessionStorage.setItem('e2e:bridge-init', '1')
      localStorage.clear()
      if (seedLocal) localStorage.setItem('vault:doc', seedLocal)
      localStorage.setItem('vault:bridge', JSON.stringify({ enabled: true, url, token }))
    },
    { url: agent.url, token: agent.token, seedLocal: opts.seedLocal },
  )
  await page.goto(`/#bridge-token=${encodeURIComponent(agent.token)}`)
}
