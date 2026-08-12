import { COMMAND_WORDS, MONTHS } from './tokens'
import { lex, lexLine, type Line, type Tok } from './lex'

export type DayStmt = {
  n: number
  strike: boolean
  chips: string[]
}

export type StemStmt = {
  path: string
  name: string
  flags: string[]
}

export type Stmt =
  | { kind: 'SEAL'; legend: string }
  | { kind: 'CAL'; style: 'cram'; month: string; year: number; days: DayStmt[] }
  | { kind: 'NEST'; path: string; flags: string[]; stems: StemStmt[] }
  | { kind: 'DUMP'; date: string; text: string }
  | { kind: 'DOCK'; mode: string; context: string }
  | { kind: 'GRAIN' }
  | { kind: 'SCAN' }
  | { kind: 'INV' }
  | { kind: 'HIT'; target: string; arg?: string | number }
  | { kind: 'TYPE'; text: string }
  | { kind: 'COMMIT' }
  | { kind: 'STRIKE'; id?: string }
  | { kind: 'MO' }
  | { kind: 'YR' }
  | { kind: 'NAV'; delta: number }
  | { kind: 'SEE' }
  | { kind: 'WORDS' }
  | { kind: 'ATTACH' }
  | { kind: 'PRIORITY'; value: string }
  | { kind: 'DAY_SELECT'; n: number }
  | { kind: 'MODE'; mode: string; arg?: string }
  | { kind: 'STEM_ADD'; text: string }
  | { kind: 'DATA'; text: string }

export type ParseResult = {
  stmts: Stmt[]
  error?: string
}

function word(tok: Tok | undefined): string | null {
  if (!tok || tok.t !== 'WORD') return null
  return tok.v
}

function raw(tok: Tok | undefined): string {
  return tok?.raw ?? ''
}

function takeFlags(toks: Tok[], from: number): { flags: string[]; next: number } {
  const flags: string[] = []
  let i = from
  while (i < toks.length && toks[i].t === 'WORD') {
    const v = toks[i].v
    if (v === 'URGENT' || v === 'P1' || v === 'P2' || v === 'P3' || v === 'STRIKE' || v === 'CRAM') {
      flags.push(v)
      i += 1
      continue
    }
    break
  }
  return { flags, next: i }
}

function parseDayLine(toks: Tok[]): DayStmt | null {
  if (word(toks[0]) !== 'DAY' || toks[1]?.t !== 'NUM') return null
  const { flags } = takeFlags(toks, 2)
  return { n: toks[1].v, strike: flags.includes('STRIKE'), chips: [] }
}

function parseStemLine(toks: Tok[]): StemStmt | null {
  if (word(toks[0]) !== 'STEM') return null
  const path = raw(toks[1]) || ''
  const name = raw(toks[2]) || ''
  const { flags } = takeFlags(toks, name ? 3 : 2)
  return { path, name, flags }
}

function parseCalBody(lines: Line[], start: number, parentIndent: number): { days: DayStmt[]; next: number } {
  const days: DayStmt[] = []
  let i = start
  while (i < lines.length && lines[i].indent > parentIndent) {
    const line = lines[i]
    const day = parseDayLine(line.toks)
    if (day) {
      days.push(day)
      i += 1
      continue
    }
    if (word(line.toks[0]) === 'CHIP') {
      const s = line.toks.find((t) => t.t === 'STR')
      const text = s ? s.v : line.toks.slice(1).map((t) => t.raw).join(' ')
      const last = days[days.length - 1]
      if (last) last.chips.push(text)
    }
    i += 1
  }
  return { days, next: i }
}

function parseNestBody(lines: Line[], start: number, parentIndent: number): { stems: StemStmt[]; next: number } {
  const stems: StemStmt[] = []
  let i = start
  while (i < lines.length && lines[i].indent > parentIndent) {
    const stem = parseStemLine(lines[i].toks)
    if (stem) stems.push(stem)
    i += 1
  }
  return { stems, next: i }
}

function parseCalHead(toks: Tok[]): Stmt {
  let month = 'JAN'
  let year = 26
  for (const tok of toks.slice(1)) {
    if (tok.t === 'WORD' && (MONTHS as readonly string[]).includes(tok.v)) month = tok.v
    if (tok.t === 'YEAR') year = tok.v
    if (tok.t === 'NUM' && tok.v >= 0 && tok.v <= 99) year = tok.v
  }
  return { kind: 'CAL', style: 'cram', month, year, days: [] }
}

export function parse(src: string): ParseResult {
  const lines = lex(src)
  const stmts: Stmt[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const head = word(line.toks[0])
    if (head === 'CAL') {
      const cal = parseCalHead(line.toks)
      if (cal.kind === 'CAL') {
        const inner = parseCalBody(lines, i + 1, line.indent)
        cal.days = inner.days
        stmts.push(cal)
        i = inner.next
        continue
      }
    }
    if (head === 'NEST') {
      const path = raw(line.toks[1]) || ''
      const { flags } = takeFlags(line.toks, path ? 2 : 1)
      const inner = parseNestBody(lines, i + 1, line.indent)
      stmts.push({ kind: 'NEST', path, flags, stems: inner.stems })
      i = inner.next
      continue
    }
    stmts.push(parseCommandToks(line.toks))
    i += 1
  }
  return { stmts }
}

function parseCommandToks(toks: Tok[]): Stmt {
  const head = word(toks[0])
  if (!head) return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }

  if (head === 'SEAL') {
    return { kind: 'SEAL', legend: toks.slice(1).map((t) => t.raw).join(' ') || 'reindustrialize' }
  }
  if (head === 'DUMP') {
    const date = toks[1]?.t === 'DATE' ? toks[1].v : ''
    const s = toks.find((t) => t.t === 'STR')
    const rest = toks.slice(date ? 2 : 1).filter((t) => t.t !== 'STR')
    const text = s ? s.v : rest.map((t) => t.raw).join(' ')
    if (!date && !text) return { kind: 'MODE', mode: 'DUMP' }
    return { kind: 'DUMP', date, text }
  }
  if (head === 'DOCK') {
    return {
      kind: 'DOCK',
      mode: word(toks[1]) || 'DAY',
      context: toks.slice(2).map((t) => t.raw).join(' '),
    }
  }
  if (head === 'GRAIN') return { kind: 'GRAIN' }
  if (head === 'SCAN') return { kind: 'SCAN' }
  if (head === 'INV') return { kind: 'INV' }
  if (head === 'COMMIT') return { kind: 'COMMIT' }
  if (head === 'SEE') return { kind: 'SEE' }
  if (head === 'WORDS') return { kind: 'WORDS' }
  if (head === 'ATTACH') return { kind: 'ATTACH' }
  if (head === 'MO') return { kind: 'MO' }
  if (head === 'YR') return { kind: 'YR' }
  if (head === 'P2' || head === 'P1' || head === 'P3' || head === 'URGENT') {
    return { kind: 'PRIORITY', value: head }
  }
  if (head === 'NAV' && toks[1]?.t === 'NUM') return { kind: 'NAV', delta: toks[1].v }
  if (head === '◀') return { kind: 'NAV', delta: -1 }
  if (head === '▶') return { kind: 'NAV', delta: 1 }
  if (head === 'STRIKE') return { kind: 'STRIKE', id: toks[1]?.raw }
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
  if (head === 'DAY') {
    if (toks[1]?.t === 'NUM') return { kind: 'DAY_SELECT', n: toks[1].v }
    return { kind: 'MODE', mode: 'DAY' }
  }
  if (head === 'NEST') {
    const arg = toks.slice(1).map((t) => t.raw).join(' ')
    return { kind: 'MODE', mode: 'NEST', arg: arg || undefined }
  }
  if (head === 'STEM') {
    const text = toks.slice(1).map((t) => t.raw).join(' ')
    return { kind: 'STEM_ADD', text }
  }
  if (head === 'CAL') return parseCalHead(toks)
  if (head === 'CHIP') {
    const s = toks.find((t) => t.t === 'STR')
    return { kind: 'DATA', text: s ? s.v : toks.slice(1).map((t) => t.raw).join(' ') }
  }

  return { kind: 'DATA', text: toks.map((t) => t.raw).join(' ') }
}

export function isCommandLine(src: string): boolean {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return false
  const head = toks[0]
  if (head.t !== 'WORD') return false
  if (head.raw === '◀' || head.raw === '▶') return true
  return COMMAND_WORDS.has(head.v)
}

export function parseCommand(src: string): Stmt {
  const toks = lexLine(src.trim())
  if (toks.length === 0) return { kind: 'DATA', text: '' }
  return parseCommandToks(toks)
}
