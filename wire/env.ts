import { deriveKeys, type Keys } from './auth.js'

/* Read once per cold start. Missing secrets fail loudly, never open. */

let keys: Keys | null = null

export function envKeys(): Keys {
  keys ??= deriveKeys(process.env.VAULT_AUTH_SECRET ?? '')
  return keys
}

export function envPassphrase(): string {
  const p = process.env.VAULT_PASSPHRASE ?? ''
  if (p.length < 8) throw new Error('VAULT_PASSPHRASE is not set (or shorter than 8 characters)')
  return p
}
