import { COMMAND_WORDS } from './tokens'
import { isOrganName } from './ir'
import { lexLine, type Tok } from './lex'

export type DockStmt =
  | { kind: 'SEE' }
  | { kind: 'WORDS' }
  | { kind: 'CLEAR' }
  | { kind: 'COMMIT' }
  | { kind: 'SHOVEL'; delta: number }
  | { kind: 'FOCUS'; id?: number; clear?: boolean }
  | { kind: 'TYPE'; text: string }
  | { kind: 'HIT'; target: string; arg?: string | number }
  | { kind: 'MOVE'; organ?: string; x: number; y: number }
  | { kind: 'STRIKE' }
  | { kind: 'ADD' }
  | { kind: 'FIND'; query: string }
  | { kind: 'NOTE'; text: string }
  | { kind: 'GLYPH'; x: number; y: number; px: number; text: string }
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
  if (head === 'STRIKE') return { kind: 'STRIKE' }
  if (head === 'ADD') return { kind: 'ADD' }
  if (head === 'SHOVEL') {
    const n = toks.find((t) => t.t === 'NUM')
    return { kind: 'SHOVEL', delta: n ? n.v : 1 }
  }
  if (head === 'FOCUS') {
    const n = toks.find((t) => t.t === 'NUM')
    const flag = word(toks[1])
    if (flag === '_' || flag === 'CLEAR' || flag === 'NONE') return { kind: 'FOCUS', clear: true }
    return { kind: 'FOCUS', id: n ? n.v : undefined }
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
    const organName = organ && isOrganName(organ) ? organ : undefined
    return { kind: 'MOVE', organ: organName, x: nums[0] ?? 0, y: nums[1] ?? 0 }
  }
  if (head === 'FIND') {
    const s = toks.find((t) => t.t === 'STR')
    return { kind: 'FIND', query: s ? s.v : toks.slice(1).map((t) => t.raw).join(' ') }
  }
  if (head === 'NOTE') {
    const s = toks.find((t) => t.t === 'STR')
    return { kind: 'NOTE', text: s ? s.v : toks.slice(1).map((t) => t.raw).join(' ') }
  }
  if (head === 'GLYPH') {
    const nums = toks.filter((t) => t.t === 'NUM').map((t) => t.v)
    const s = toks.find((t) => t.t === 'STR')
    return {
      kind: 'GLYPH',
      x: nums[0] ?? 80,
      y: nums[1] ?? 80,
      px: nums[2] ?? 32,
      text: s ? s.v : 'MARK',
    }
  }
  return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }
}
