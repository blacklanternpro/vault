import { COMMAND_WORDS } from './tokens'
import { lexLine, type Tok } from './lex'

export type DockStmt =
  | { kind: 'SEE' }
  | { kind: 'WORDS' }
  | { kind: 'CLEAR' }
  | { kind: 'COMMIT' }
  | { kind: 'SHOVEL'; delta: number }
  | { kind: 'CLIP' }
  | { kind: 'TYPE'; text: string }
  | { kind: 'HIT'; target: string; arg?: string | number }
  | { kind: 'MOVE'; organ?: string; x: number; y: number }
  | { kind: 'STRIKE' }
  | { kind: 'DATA'; text: string }

function word(tok: Tok | undefined): string | null {
  if (!tok || tok.t !== 'WORD') return null
  return tok.v
}

export function isCommandLine(src: string): boolean {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return false
  const head = toks[0]
  if (head.t !== 'WORD') return false
  return COMMAND_WORDS.has(head.v)
}

export function parseCommand(src: string): DockStmt {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return { kind: 'DATA', text: '' }
  const head = word(toks[0])
  if (!head) return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }

  if (head === 'SEE') return { kind: 'SEE' }
  if (head === 'WORDS') return { kind: 'WORDS' }
  if (head === 'CLEAR') return { kind: 'CLEAR' }
  if (head === 'COMMIT') return { kind: 'COMMIT' }
  if (head === 'CLIP') return { kind: 'CLIP' }
  if (head === 'STRIKE') return { kind: 'STRIKE' }
  if (head === 'SHOVEL') {
    const n = toks.find((t) => t.t === 'NUM')
    return { kind: 'SHOVEL', delta: n ? n.v : 1 }
  }
  if (head === 'TYPE') {
    const s = toks.find((t) => t.t === 'STR')
    return { kind: 'TYPE', text: s ? s.v : toks.slice(1).map((t) => t.raw).join(' ') }
  }
  if (head === 'HIT') {
    const target = word(toks[1]) || ''
    const argTok = toks[2]
    let arg: string | number | undefined
    if (argTok?.t === 'NUM') arg = argTok.v
    else if (argTok) arg = argTok.raw
    return { kind: 'HIT', target, arg }
  }
  if (head === 'MOVE') {
    const nums = toks.filter((t) => t.t === 'NUM').map((t) => t.v)
    const organ = word(toks[1])
    const organName = organ === 'PIPE' || organ === 'NEST' || organ === 'DUMP' ? organ : undefined
    return { kind: 'MOVE', organ: organName, x: nums[organName ? 0 : 0] ?? 0, y: nums[organName ? 1 : 1] ?? 0 }
  }
  return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }
}
