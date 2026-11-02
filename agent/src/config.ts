import os from 'node:os'
import path from 'node:path'

export const AGENT_VERSION = '0.1.0'
export const DEFAULT_PORT = 7331
export const DEFAULT_HOST = '127.0.0.1'
/** The Vite dev server and `vite preview`, by both names the browser may use for them. */
export const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173', 'https://vault-lilac-six.vercel.app']

function expandHome(p: string): string {
  if (p === '~') return os.homedir()
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2))
  return p
}

/** The board file: `--file`, else `VAULT_FILE`, else `~/.vault/vault.json`. Always absolute. */
export function resolveFile(explicit?: string, env: NodeJS.ProcessEnv = process.env): string {
  const raw = explicit?.trim() || env.VAULT_FILE?.trim() || path.join(os.homedir(), '.vault', 'vault.json')
  return path.resolve(expandHome(raw))
}
