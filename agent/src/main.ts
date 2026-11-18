import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { importText } from '../../src/model/store.js'
import { AGENT_VERSION, DEFAULT_HOST, DEFAULT_MAX_BODY, DEFAULT_ORIGINS, DEFAULT_PORT, formatSize, LIVE_SITE_ORIGIN, parseSize, resolveFile, resolveOrigins } from './config.js'
import { startBridge } from './http.js'
import { runMcp } from './mcp.js'
import { envelopeOf, FileStore, StoreError } from './store.js'
import { ensureToken, handoffLinks, isLooseMode, resolveTokenFile, rotateToken, TokenError, tokenSource } from './token.js'
import { AgentError, createHandlers } from './tools.js'

export const USAGE = `vault-agent ${AGENT_VERSION} — Agent Handoff for VAULT

Usage: vault-agent <command> [options]

  mcp                         MCP server over stdio (for Claude Code, Claude Desktop, Cursor)
  serve                       local HTTP bridge for the web app (default port ${DEFAULT_PORT}); prints the app links
  token [--rotate]            print the bridge token and the links that hand it to the app; --rotate makes a new one
  ls [project]                the cards on the board
  brief <id|title>            one task as a markdown brief
  report <id> < report.md     apply a markdown report (- [x] / - [ ] / Left off:)
  tick <id> "<subtask>"       tick one subtask
  import <vault-export.json>  copy an export (or old SPECK save) into the board file
  export                      print the board file as an export envelope

Options:
  --file <path>       the board file (or VAULT_FILE; default ~/.vault/vault.json)
  --token-file <path> serve / token: the bridge token (or VAULT_TOKEN_FILE; default bridge-token beside the board file)
  --port <n>          serve: port (default ${DEFAULT_PORT})
  --host <addr>       serve: address to bind (default ${DEFAULT_HOST})
  --origin <url>      serve / token: allow this page origin too; repeatable (or VAULT_ORIGINS, comma-separated).
                      Always allowed: ${DEFAULT_ORIGINS.join(', ')}.
                      The live site is not: add --origin ${LIVE_SITE_ORIGIN}
  --max-body <size>   serve: largest request body, e.g. 5mb or 524288 (default ${formatSize(DEFAULT_MAX_BODY)})
  --rotate            token: replace the token; links handed out before stop working
  --status <lane>     ls: only this lane (pending, rnd, active, done, dusted)
  --tonight           ls: only tonight's shelf
  --json              ls / brief / tick / report / token: print JSON instead of text
  --help              this
`

const options = {
  file: { type: 'string' },
  port: { type: 'string' },
  host: { type: 'string' },
  origin: { type: 'string', multiple: true },
  'token-file': { type: 'string' },
  'max-body': { type: 'string' },
  rotate: { type: 'boolean' },
  status: { type: 'string' },
  tonight: { type: 'boolean' },
  json: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const

function parse(argv: string[]) {
  return parseArgs({ args: argv, options, allowPositionals: true })
}

export type Streams = {
  out: (s: string) => void
  err: (s: string) => void
  /** The piped report for `report`; defaults to stdin. */
  stdin?: () => string
  /** Resolves when the bridge should stop; defaults to SIGINT/SIGTERM. */
  until?: Promise<void>
  /** Environment for VAULT_* settings; defaults to process.env. */
  env?: NodeJS.ProcessEnv
}

const defaults: Streams = {
  out: (s) => process.stdout.write(s),
  err: (s) => process.stderr.write(s),
}

function readStdin(): string {
  if (process.stdin.isTTY) throw new AgentError('pipe the report in: vault-agent report <id> < report.md')
  return fs.readFileSync(0, 'utf8')
}

function untilSignal(): Promise<void> {
  return new Promise((resolve) => {
    process.once('SIGINT', () => resolve())
    process.once('SIGTERM', () => resolve())
  })
}

/** Runs one command. Returns the exit code; writes nothing but through `streams`. */
export async function main(argv: string[], streams: Partial<Streams> = {}): Promise<number> {
  const { out, err } = { ...defaults, ...streams }
  const env = streams.env ?? process.env
  let parsed: ReturnType<typeof parse>
  try {
    parsed = parse(argv)
  } catch (e) {
    err(`${(e as Error).message}\n\n${USAGE}`)
    return 2
  }
  const { values, positionals } = parsed
  const [command, ...rest] = positionals

  if (values.version) {
    out(`${AGENT_VERSION}\n`)
    return 0
  }
  if (values.help || !command) {
    out(USAGE)
    return command ? 0 : 2
  }

  const store = new FileStore(resolveFile(values.file, env))
  const handlers = createHandlers(store)
  const emit = (text: string, data: unknown) => out(values.json ? JSON.stringify(data, null, 2) + '\n' : text.endsWith('\n') ? text : text + '\n')

  try {
    switch (command) {
      case 'mcp': {
        await runMcp(store)
        return 0
      }
      case 'serve': {
        const port = values.port == null ? DEFAULT_PORT : Number(values.port)
        if (!Number.isInteger(port) || port < 0 || port > 65535) throw new AgentError(`--port must be a port number, not '${values.port}'`)
        const maxBody = values['max-body'] == null ? DEFAULT_MAX_BODY : parseSize(values['max-body'])
        if (maxBody === undefined) throw new AgentError(`--max-body must be a size such as 5mb or 524288, not '${values['max-body']}'`)
        const origins = resolveOrigins(values.origin ?? [], env)
        const tokenFile = resolveTokenFile(store.file, values['token-file'], env)
        const { token, created } = ensureToken(tokenFile)
        const bridge = await startBridge({ store, port, host: values.host ?? DEFAULT_HOST, origins, token: tokenSource(tokenFile, token), maxBody, log: (line) => err(`${line}\n`) })
        const loose = isLooseMode(tokenFile) ? `\n  warning: ${tokenFile} can be read by other users; chmod 600 it` : ''
        err(
          `vault-agent bridge on ${bridge.url}\n` +
            `  file:     ${store.file}${store.exists() ? '' : ' (not there yet; the first PUT or import creates it)'}\n` +
            `  token:    ${tokenFile}${created ? ' (new)' : ''}${loose}\n` +
            `  origins:  ${origins.join(', ')}\n` +
            `  max body: ${formatSize(maxBody)}\n` +
            `  open the app with its token (one of):\n` +
            handoffLinks(origins, token)
              .map((l) => `    ${l}\n`)
              .join(''),
        )
        await (streams.until ?? untilSignal())
        await bridge.close()
        return 0
      }
      case 'token': {
        const origins = resolveOrigins(values.origin ?? [], env)
        const tokenFile = resolveTokenFile(store.file, values['token-file'], env)
        const got = values.rotate ? { token: rotateToken(tokenFile), created: false } : ensureToken(tokenFile)
        const links = handoffLinks(origins, got.token)
        const state = values.rotate ? 'rotated; links handed out before no longer work' : got.created ? 'new' : 'existing'
        emit(
          `token file: ${tokenFile} (${state})\n` +
            `token:      ${got.token}\n` +
            `Open one of these to hand the token to the app:\n` +
            links.map((l) => `  ${l}\n`).join('') +
            (origins.some((o) => o.toLowerCase() === LIVE_SITE_ORIGIN) ? '' : `(the live site needs --origin ${LIVE_SITE_ORIGIN}, here and on serve)\n`),
          { file: tokenFile, token: got.token, rotated: values.rotate === true, created: got.created, links },
        )
        return 0
      }
      case 'ls': {
        const r = handlers.listTasks({ project: rest.join(' ').trim() || undefined, status: values.status, tonight: values.tonight })
        emit(r.text, r.data)
        return 0
      }
      case 'brief': {
        const ref = rest.join(' ').trim()
        if (!ref) throw new AgentError('brief needs a task id or title: vault-agent brief <id|title>')
        const r = handlers.getTask({ id: ref })
        emit(r.text, r.data)
        return 0
      }
      case 'report': {
        const ref = rest[0]
        if (!ref) throw new AgentError('report needs a task id: vault-agent report <id> < report.md')
        const text = (streams.stdin ?? readStdin)()
        const r = handlers.report({ id: ref, report: text })
        emit(r.text, r.data)
        return 0
      }
      case 'tick': {
        const [ref, ...sub] = rest
        const subtask = sub.join(' ').trim()
        if (!ref || !subtask) throw new AgentError('tick needs a task id and a subtask: vault-agent tick <id> "<subtask>"')
        const r = handlers.tick({ id: ref, subtask })
        emit(r.text, r.data)
        return 0
      }
      case 'import': {
        const file = rest[0]
        if (!file) throw new AgentError('import needs a file: vault-agent import <vault-export.json>')
        let raw: string
        try {
          raw = fs.readFileSync(path.resolve(file), 'utf8')
        } catch (e) {
          throw new AgentError(`cannot read ${file}: ${(e as Error).message}`)
        }
        let doc
        try {
          doc = importText(raw)
        } catch (e) {
          throw new AgentError(`${file}: ${(e as Error).message}`)
        }
        const { savedAt } = store.write(doc)
        out(`Imported ${doc.nodes.length} items and ${doc.notes.length} notes into ${store.file} (savedAt ${savedAt}).\n`)
        return 0
      }
      case 'export': {
        const { doc, savedAt, rev } = store.read()
        out(JSON.stringify(envelopeOf(doc, savedAt, rev), null, 2) + '\n')
        return 0
      }
      default:
        err(`Unknown command '${command}'.\n\n${USAGE}`)
        return 2
    }
  } catch (e) {
    if (e instanceof AgentError || e instanceof StoreError || e instanceof TokenError) {
      err(`${e.message}\n`)
      return 1
    }
    throw e
  }
}
