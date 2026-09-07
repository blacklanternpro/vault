import { lex, type Tok } from './lex'
import type { OrganName } from './ir'
import { COL_ORDER } from './tokens'

export type Task = {
  id: number
  col: string
  title: string
  nest?: string
}

export type Stem = {
  path: string
  urgent: boolean
}

export type Note = {
  date: string
  text: string
}

export type Place = {
  organ: OrganName
  x: number
  y: number
}

export type FreeGlyph = {
  x: number
  y: number
  px: number
  text: string
}

export type Doc = {
  pipeName: string
  cols: string[]
  tasks: Task[]
  nestRoot: string
  stems: Stem[]
  notes: Note[]
  places: Place[]
  glyphs: FreeGlyph[]
}

export const SEED_SOURCE = `PIPE vault
  COL backlog
  COL active
  COL staging
  COL done
  TASK backlog "ingress routing" id 104
  TASK active "telemetry ui" id 102 nest ops/net/
  TASK staging "supabase link" id 101
  TASK done "baseline" id 99
NEST ops/
  STEM lab/ scout_ridge_a
  STEM net/ flush_stale_resolvers.sh
DUMP
  NOTE 09.07.26 "ridge"
PLACE PIPE 24 16
PLACE NEST 24 400
PLACE DUMP 560 400
GLYPH 820 36 72 "07"`

function word(tok: Tok | undefined): string | null {
  if (!tok || tok.t !== 'WORD') return null
  return tok.v
}

function strOf(toks: Tok[]): string {
  const s = toks.find((t) => t.t === 'STR')
  return s ? s.v : ''
}

function nums(toks: Tok[]): number[] {
  return toks.filter((t) => t.t === 'NUM').map((t) => t.v)
}

function quote(text: string): string {
  return `"${text.replace(/"/g, '')}"`
}

function stemPath(toks: Tok[]): { path: string; urgent: boolean } {
  const rest = toks.slice(1)
  const urgent = rest.some((t) => t.t === 'WORD' && t.v === 'URGENT')
  const bits = rest.filter((t) => !(t.t === 'WORD' && t.v === 'URGENT')).map((t) => t.raw)
  let path = bits.join('')
  path = path.replace(/\/+/g, '/').replace(/\/$/, '')
  if (bits.length >= 2 && bits[0]?.endsWith('/')) {
    path = `${bits[0]}${bits.slice(1).join('')}`.replace(/\/+/g, '/')
  }
  return { path, urgent }
}

function parseTask(toks: Tok[]): Task | null {
  const col = (word(toks[1]) || 'backlog').toLowerCase()
  const title = strOf(toks)
  if (!title) return null
  let id = 0
  let nest: string | undefined
  for (let i = 0; i < toks.length; i++) {
    const w = word(toks[i])
    const nxt = toks[i + 1]
    if (w === 'ID' && nxt?.t === 'NUM') id = nxt.v
    if (w === 'NEST') {
      nest = toks
        .slice(i + 1)
        .map((t) => t.raw)
        .join('')
        .replace(/\/+/g, '/')
    }
  }
  return { id, col, title, nest }
}

export function blankDoc(): Doc {
  return {
    pipeName: 'vault',
    cols: [...COL_ORDER],
    tasks: [],
    nestRoot: 'ops/',
    stems: [],
    notes: [],
    places: [
      { organ: 'PIPE', x: 24, y: 16 },
      { organ: 'NEST', x: 24, y: 400 },
      { organ: 'DUMP', x: 560, y: 400 },
    ],
    glyphs: [],
  }
}

export function parseDoc(src: string): Doc {
  const doc = blankDoc()
  doc.cols = []
  doc.places = []
  const lines = lex(src)
  for (const line of lines) {
    const head = word(line.toks[0])
    if (!head) continue
    if (line.indent === 0) {
      if (head === 'PIPE') doc.pipeName = line.toks[1]?.raw || 'vault'
      else if (head === 'NEST') doc.nestRoot = line.toks[1]?.raw || 'ops/'
      else if (head === 'DUMP') {
        /* organ marker */
      } else if (head === 'PLACE') {
        const organ = word(line.toks[1])
        const n = nums(line.toks)
        if (organ === 'PIPE' || organ === 'NEST' || organ === 'DUMP') {
          doc.places.push({ organ, x: n[0] ?? 24, y: n[1] ?? 16 })
        }
      } else if (head === 'GLYPH') {
        const n = nums(line.toks)
        doc.glyphs.push({
          x: n[0] ?? 0,
          y: n[1] ?? 0,
          px: n[2] ?? 72,
          text: strOf(line.toks) || String(n[3] ?? ''),
        })
      }
      continue
    }
    if (head === 'COL') {
      const col = (word(line.toks[1]) || '').toLowerCase()
      if (col && !doc.cols.includes(col)) doc.cols.push(col)
    } else if (head === 'TASK') {
      const task = parseTask(line.toks)
      if (task) {
        if (!task.id) task.id = nextTaskId(doc)
        doc.tasks.push(task)
      }
    } else if (head === 'STEM') {
      doc.stems.push(stemPath(line.toks))
    } else if (head === 'NOTE') {
      const dateTok = line.toks[1]
      const date = dateTok?.t === 'DATE' ? dateTok.v : ''
      const text = strOf(line.toks)
      if (text) doc.notes.push({ date, text })
    }
  }
  if (doc.cols.length === 0) doc.cols = [...COL_ORDER]
  if (doc.places.length === 0) {
    doc.places = blankDoc().places
  }
  return doc
}

export function serializeDoc(doc: Doc): string {
  const lines: string[] = []
  lines.push(`PIPE ${doc.pipeName}`)
  const cols = doc.cols.length ? doc.cols : [...COL_ORDER]
  for (const col of cols) lines.push(`  COL ${col}`)
  for (const t of doc.tasks) {
    const nest = t.nest ? ` nest ${t.nest}` : ''
    lines.push(`  TASK ${t.col} ${quote(t.title)} id ${t.id}${nest}`)
  }
  lines.push(`NEST ${doc.nestRoot}`)
  for (const s of doc.stems) {
    const bits = s.path.includes('/')
      ? (() => {
          const i = s.path.lastIndexOf('/')
          return `${s.path.slice(0, i + 1)} ${s.path.slice(i + 1)}`
        })()
      : s.path
    lines.push(`  STEM ${bits}${s.urgent ? ' URGENT' : ''}`)
  }
  lines.push('DUMP')
  for (const n of doc.notes) lines.push(`  NOTE ${n.date} ${quote(n.text)}`)
  for (const p of doc.places) lines.push(`PLACE ${p.organ} ${Math.round(p.x)} ${Math.round(p.y)}`)
  for (const g of doc.glyphs) {
    lines.push(`GLYPH ${Math.round(g.x)} ${Math.round(g.y)} ${Math.round(g.px)} ${quote(g.text)}`)
  }
  return lines.join('\n')
}

export function nextTaskId(doc: Doc): number {
  return doc.tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1
}

export function placeOf(doc: Doc, organ: OrganName): Place {
  return doc.places.find((p) => p.organ === organ) ?? blankDoc().places.find((p) => p.organ === organ)!
}
