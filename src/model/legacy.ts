import { sanitizeDoc } from './doc'
import type { Doc, Node, Note } from './types'

/*
 * Reads the old SPECK save text (localStorage `speck-os-v2`, and `speck-os-v1`
 * before it) so existing boards come across on first load. It understands the
 * graph and the notes and ignores the canvas-era lines (PIPE, COL, PLACE,
 * GLYPH, INV, GRAIN, SCAN). The full language lives in /speck.
 */

type Tok = { t: 'WORD' | 'NUM' | 'STR' | 'DATE'; v: string }

/** Same rules as the old lexer: a string runs from `"` to the next `"` or the end of the line. */
function lexLine(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t') {
      i += 1
      continue
    }
    if (c === '/' && src[i + 1] === '/') break
    if (c === '\\' && (i === 0 || src[i - 1] === ' ' || src[i - 1] === '\t')) break
    if (c === '"') {
      const end = src.indexOf('"', i + 1)
      const stop = end < 0 ? src.length : end
      toks.push({ t: 'STR', v: src.slice(i + 1, stop) })
      i = end < 0 ? src.length : end + 1
      continue
    }
    const rest = src.slice(i)
    const date = /^(\d{2}\.\d{2}\.\d{2})/.exec(rest)
    if (date) {
      toks.push({ t: 'DATE', v: date[1] })
      i += date[1].length
      continue
    }
    const num = /^(-?\d+(?:\.\d+)?)/.exec(rest)
    if (num) {
      toks.push({ t: 'NUM', v: num[1] })
      i += num[1].length
      continue
    }
    const word = /^([A-Za-z_./][A-Za-z0-9_./-]*)/.exec(rest)
    if (word) {
      toks.push({ t: 'WORD', v: word[1].toUpperCase() })
      i += word[1].length
      continue
    }
    i += 1
  }
  return toks
}

function legacyStatus(raw: string | undefined): Node['status'] {
  const s = (raw ?? '').toLowerCase()
  if (s === 'backlog') return 'pending'
  if (s === 'staging') return 'rnd'
  if (s === 'pending' || s === 'rnd' || s === 'active' || s === 'done' || s === 'dusted' || s === 'none') return s
  return 'none'
}

/** True when a string looks like a SPECK save rather than anything else. */
export function looksLikeSpeck(src: string): boolean {
  return /^\s*(NEST|PIPE|DUMP)\b/m.test(src) || /^\s+NODE\s+\d+\s+"/m.test(src)
}

export function parseLegacy(src: string): Doc {
  const nodes: Node[] = []
  const notes: Note[] = []
  const stack: { indent: number; id: number }[] = []
  let nextFree = 1
  let noteSeq = 0

  for (const row of src.replace(/\r\n/g, '\n').split('\n')) {
    if (!row.trim()) continue
    let spaces = 0
    while (spaces < row.length && row[spaces] === ' ') spaces += 1
    const indent = Math.floor(spaces / 2)
    const toks = lexLine(row.slice(spaces))
    const head = toks[0]?.t === 'WORD' ? toks[0].v : null
    if (!head || indent === 0) continue

    if (head === 'NODE') {
      const str = toks.find((t) => t.t === 'STR')
      if (!str) continue
      let id = 0
      let status: Node['status'] = 'none'
      let urgent = false
      let loose = false
      for (let i = 0; i < toks.length; i++) {
        const w = toks[i].t === 'WORD' ? toks[i].v : null
        const nxt = toks[i + 1]
        if (w === 'ID' && nxt?.t === 'NUM') id = Number(nxt.v)
        if (w === 'STATUS' && nxt) status = legacyStatus(nxt.v)
        if (w === 'URGENT') urgent = true
        if (w === 'LOOSE') loose = true
      }
      if (!id) {
        const n = toks.find((t) => t.t === 'NUM')
        if (n) id = Number(n.v)
      }
      if (!id || nodes.some((n) => n.id === id)) id = Math.max(nextFree, ...nodes.map((n) => n.id + 1))
      nextFree = Math.max(nextFree, id + 1)
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
      const parent = stack.length ? stack[stack.length - 1].id : null
      const node: Node = { id, title: str.v, status, parent }
      if (urgent) node.urgent = true
      if (loose) node.loose = true
      nodes.push(node)
      stack.push({ indent, id })
    } else if (head === 'BODY') {
      const str = toks.find((t) => t.t === 'STR')
      const top = stack[stack.length - 1]
      const node = top ? nodes.find((n) => n.id === top.id) : undefined
      if (str && str.v && node) node.body = node.body ? `${node.body}\n${str.v}` : str.v
    } else if (head === 'NOTE') {
      const date = toks[1]?.t === 'DATE' ? toks[1].v : ''
      const str = toks.find((t) => t.t === 'STR')
      if (!str || !str.v) continue
      let hitch: number | undefined
      for (let i = 0; i < toks.length; i++) {
        if (toks[i].t === 'WORD' && toks[i].v === 'NODE' && toks[i + 1]?.t === 'NUM') hitch = Number(toks[i + 1].v)
      }
      const note: Note = { id: `legacy${++noteSeq}`, date, text: str.v }
      if (hitch != null) note.node = hitch
      notes.push(note)
    }
  }
  return sanitizeDoc({ nodes, notes })
}
