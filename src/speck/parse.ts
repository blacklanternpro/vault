import { COMMAND_WORDS } from './tokens'
import { lex, lexLine, type Tok } from './lex'

export type Stmt =
  | { kind: 'DAY'; date: string; text: string }
  | { kind: 'DOCK' }
  | { kind: 'HIT'; target: string; arg?: string | number }
  | { kind: 'TYPE'; text: string }
  | { kind: 'COMMIT' }
  | { kind: 'SEE' }
  | { kind: 'WORDS' }
  | { kind: 'CLEAR' }
  | { kind: 'DATA'; text: string }

export type ParseResult = {
  stmts: Stmt[]
  error?: string
}

function word(tok: Tok | undefined): string | null {
  if (!tok || tok.t !== 'WORD') return null
  return tok.v
}

function strPayload(toks: Tok[], from: number): string {
  const s = toks.find((t) => t.t === 'STR')
  if (s) return s.v
  return toks
    .slice(from)
    .map((t) => t.raw)
    .join(' ')
    .trim()
}

export function parse(src: string): ParseResult {
  const lines = lex(src)
  const stmts: Stmt[] = []
  for (const line of lines) {
    stmts.push(parseCommandToks(line.toks))
  }
  return { stmts }
}

function parseCommandToks(toks: Tok[]): Stmt {
  const head = word(toks[0])
  if (!head) return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }

  if (head === 'DAY') {
    const dateTok = toks[1]
    const date = dateTok?.t === 'DATE' ? dateTok.v : ''
    const text = strPayload(toks, date ? 2 : 1)
    return { kind: 'DAY', date, text }
  }
  if (head === 'DOCK') return { kind: 'DOCK' }
  if (head === 'COMMIT') return { kind: 'COMMIT' }
  if (head === 'SEE') return { kind: 'SEE' }
  if (head === 'WORDS') return { kind: 'WORDS' }
  if (head === 'CLEAR') return { kind: 'CLEAR' }
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

export function notesForDate(src: string, date: string): string[] {
  return parse(src)
    .stmts.filter((s): s is Extract<Stmt, { kind: 'DAY' }> => s.kind === 'DAY' && s.date === date)
    .map((s) => s.text)
    .filter(Boolean)
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
