import { HEAD_WORDS, SOLO_WORDS } from './tokens'
import { lex, lexLine, type Tok } from './lex'

export type Stmt =
  | { kind: 'STEM'; text: string; done: boolean; born: string; at: string; depth: number }
  | { kind: 'HIT'; target: string; arg?: string }
  | { kind: 'TYPE'; text: string }
  | { kind: 'FOCUS'; arg: string }
  | { kind: 'OUT' }
  | { kind: 'COMMIT' }
  | { kind: 'SEE' }
  | { kind: 'WORDS' }
  | { kind: 'CLEAR' }
  | { kind: 'WIPE' }
  | { kind: 'UNDO' }
  | { kind: 'DATA'; text: string }

export type ParseResult = {
  stmts: Stmt[]
}

function word(tok: Tok | undefined): string | null {
  if (!tok || tok.t !== 'WORD') return null
  return tok.v
}

function payload(toks: Tok[], from: number): string {
  const s = toks.find((t) => t.t === 'STR')
  if (s) return s.v
  return toks
    .slice(from)
    .filter((t) => !(t.t === 'WORD' && t.v === 'STRIKE'))
    .filter((t) => t.t !== 'DATE' && t.t !== 'TIME')
    .map((t) => t.raw)
    .join(' ')
    .trim()
}

export function parse(src: string): ParseResult {
  const stmts: Stmt[] = []
  for (const line of lex(src)) {
    stmts.push(parseToks(line.toks, line.indent))
  }
  return { stmts }
}

function parseToks(toks: Tok[], depth = 0): Stmt {
  const head = word(toks[0])
  if (!head) return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }

  if (head === 'STEM') {
    const done = toks.some((t) => t.t === 'WORD' && t.v === 'STRIKE')
    const born = toks.find((t) => t.t === 'DATE')
    const at = toks.find((t) => t.t === 'TIME')
    return {
      kind: 'STEM',
      text: payload(toks, 1) || '_',
      done,
      born: born?.t === 'DATE' ? born.v : '',
      at: at?.t === 'TIME' ? at.v : '',
      depth,
    }
  }
  if (head === 'HIT') {
    const target = word(toks[1]) || ''
    const argTok = toks[2]
    return { kind: 'HIT', target, arg: argTok ? argTok.raw : undefined }
  }
  if (head === 'FOCUS') return { kind: 'FOCUS', arg: toks[1]?.raw ?? '' }
  if (head === 'OUT') return { kind: 'OUT' }
  if (head === 'COMMIT') return { kind: 'COMMIT' }
  if (head === 'SEE') return { kind: 'SEE' }
  if (head === 'WORDS') return { kind: 'WORDS' }
  if (head === 'CLEAR') return { kind: 'CLEAR' }
  if (head === 'WIPE') return { kind: 'WIPE' }
  if (head === 'UNDO') return { kind: 'UNDO' }
  if (head === 'TYPE') {
    const s = toks.find((t) => t.t === 'STR')
    return { kind: 'TYPE', text: s ? s.v : toks.slice(1).map((t) => t.raw).join(' ') }
  }

  return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }
}

/**
 * A line is a command only if it is a lone verb, or a structural head with arguments.
 * "CLEAR" clears. "clear the desk" is a task, which is the whole point.
 */
export function isCommandLine(src: string): boolean {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return false
  const head = toks[0]
  if (head.t !== 'WORD') return false
  if (HEAD_WORDS.has(head.v)) return true
  return toks.length === 1 && SOLO_WORDS.has(head.v)
}

export function parseCommand(src: string): Stmt {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return { kind: 'DATA', text: '' }
  return parseToks(toks)
}
