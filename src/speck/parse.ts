import { COMMAND_WORDS } from './tokens'
import { lex, lexLine, type Tok } from './lex'

export type MarkFlags = {
  strike: boolean
  urgent: boolean
}

export type Stmt =
  | { kind: 'SEAL'; legend: string }
  | { kind: 'GLYPH'; text: string; strike: boolean; line: number }
  | { kind: 'CHIP'; text: string; strike: boolean; line: number }
  | {
      kind: 'STEM'
      text: string
      indent: number
      strike: boolean
      urgent: boolean
      line: number
    }
  | { kind: 'DOCK' }
  | { kind: 'GRAIN' }
  | { kind: 'SCAN' }
  | { kind: 'INV' }
  | { kind: 'HIT'; target: string; arg?: string | number }
  | { kind: 'TYPE'; text: string }
  | { kind: 'COMMIT' }
  | { kind: 'STRIKE' }
  | { kind: 'SEE' }
  | { kind: 'WORDS' }
  | { kind: 'CLEAR' }
  | { kind: 'INK' }
  | { kind: 'DATA'; text: string }

export type ParseResult = {
  stmts: Stmt[]
  error?: string
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
    .filter((t) => !(t.t === 'WORD' && (t.v === 'STRIKE' || t.v === 'URGENT')))
    .map((t) => t.raw)
    .join(' ')
    .trim()
}

function flagsOf(toks: Tok[]): MarkFlags {
  const words = toks.filter((t) => t.t === 'WORD').map((t) => t.v)
  return { strike: words.includes('STRIKE'), urgent: words.includes('URGENT') }
}

export function parse(src: string): ParseResult {
  const lines = lex(src)
  const stmts: Stmt[] = []
  for (const line of lines) {
    stmts.push(parseCommandToks(line.toks, line.indent, line.n))
  }
  return { stmts }
}

function parseCommandToks(toks: Tok[], indent = 0, line = 0): Stmt {
  const head = word(toks[0])
  if (!head) return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }

  if (head === 'SEAL') {
    return { kind: 'SEAL', legend: toks.slice(1).map((t) => t.raw).join(' ') || 'reindustrialize' }
  }
  if (head === 'GLYPH') {
    const { strike } = flagsOf(toks)
    return { kind: 'GLYPH', text: payload(toks, 1) || '_', strike, line }
  }
  if (head === 'CHIP') {
    const { strike } = flagsOf(toks)
    return { kind: 'CHIP', text: payload(toks, 1) || '_', strike, line }
  }
  if (head === 'STEM') {
    const { strike, urgent } = flagsOf(toks)
    return { kind: 'STEM', text: payload(toks, 1) || '_', indent, strike, urgent, line }
  }
  if (head === 'DOCK') return { kind: 'DOCK' }
  if (head === 'GRAIN') return { kind: 'GRAIN' }
  if (head === 'SCAN') return { kind: 'SCAN' }
  if (head === 'INV') return { kind: 'INV' }
  if (head === 'COMMIT') return { kind: 'COMMIT' }
  if (head === 'SEE') return { kind: 'SEE' }
  if (head === 'WORDS') return { kind: 'WORDS' }
  if (head === 'CLEAR') return { kind: 'CLEAR' }
  if (head === 'INK') return { kind: 'INK' }
  if (head === 'STRIKE') return { kind: 'STRIKE' }
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

  return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }
}

export function isCommandLine(src: string): boolean {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return false
  const head = toks[0]
  if (head.t !== 'WORD') return false
  return COMMAND_WORDS.has(head.v)
}

export function parseCommand(src: string): Stmt {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return { kind: 'DATA', text: '' }
  return parseCommandToks(toks)
}
