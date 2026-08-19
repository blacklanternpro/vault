export type Tok =
  | { t: 'WORD'; v: string; raw: string }
  | { t: 'NUM'; v: number; raw: string }
  | { t: 'STR'; v: string; raw: string }
  | { t: 'DATE'; v: string; raw: string }
  | { t: 'TIME'; v: string; raw: string }
  | { t: 'YEAR'; v: number; raw: string }

export type Line = {
  n: number
  indent: number
  toks: Tok[]
}

const DATE_RE = /^(\d{2}\.\d{2}\.\d{2})/
const TIME_RE = /^(\d{2}:\d{2})/
const YEAR_RE = /^'(\d{2})\b/
const NUM_RE = /^(-?\d+)/
const WORD_RE = /^([A-Za-z_./][A-Za-z0-9_./-]*)/

function skipComment(s: string, i: number): number {
  if (s[i] === '\\' && (i === 0 || s[i - 1] === ' ' || s[i - 1] === '\t')) {
    return s.length
  }
  if (s[i] === '/' && s[i + 1] === '/') return s.length
  return i
}

export function lexLine(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t') {
      i += 1
      continue
    }
    const jumped = skipComment(src, i)
    if (jumped !== i) break

    if (c === '"') {
      let j = i + 1
      let v = ''
      while (j < src.length && src[j] !== '"') {
        v += src[j]
        j += 1
      }
      toks.push({ t: 'STR', v, raw: src.slice(i, j + (src[j] === '"' ? 1 : 0)) })
      i = j + (src[j] === '"' ? 1 : 0)
      continue
    }

    const rest = src.slice(i)
    const date = DATE_RE.exec(rest)
    if (date) {
      toks.push({ t: 'DATE', v: date[1], raw: date[1] })
      i += date[1].length
      continue
    }
    const time = TIME_RE.exec(rest)
    if (time) {
      toks.push({ t: 'TIME', v: time[1], raw: time[1] })
      i += time[1].length
      continue
    }
    const year = YEAR_RE.exec(rest)
    if (year) {
      toks.push({ t: 'YEAR', v: Number(year[1]), raw: year[0] })
      i += year[0].length
      continue
    }
    const num = NUM_RE.exec(rest)
    if (num) {
      toks.push({ t: 'NUM', v: Number(num[1]), raw: num[1] })
      i += num[1].length
      continue
    }
    if (c === '◀' || c === '▶') {
      toks.push({ t: 'WORD', v: c, raw: c })
      i += 1
      continue
    }
    const word = WORD_RE.exec(rest)
    if (word) {
      toks.push({ t: 'WORD', v: word[1].toUpperCase(), raw: word[1] })
      i += word[1].length
      continue
    }
    i += 1
  }
  return toks
}

export function lex(src: string): Line[] {
  const lines: Line[] = []
  const raw = src.replace(/\r\n/g, '\n').split('\n')
  for (let n = 0; n < raw.length; n++) {
    const row = raw[n]
    if (row.trim() === '') continue
    let spaces = 0
    while (spaces < row.length && row[spaces] === ' ') spaces += 1
    const toks = lexLine(row.slice(spaces))
    if (toks.length === 0) continue
    lines.push({ n: n + 1, indent: Math.floor(spaces / 2), toks })
  }
  return lines
}
