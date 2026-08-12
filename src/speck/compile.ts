import type { TaskNode, VaultSnapshot } from '../lib/vault-types'
import type { HitBox, Layer, Measure, Now, Op, Program, Session } from './ir'
import { contextLabel } from './machine'
import { CANVAS, COBALT, INK, MONTHS, URGENT, fontMono, fontNum } from './tokens'

export type World = {
  snapshot: VaultSnapshot
  session: Session
  clock: string
  now: Now
  width: number
  caretOn: boolean
}

export const DOCK_LAYOUT = {
  h: 92,
  echoH: 16,
  modeY: 16,
  inputY: 42,
  inputH: 28,
  caretW: 14,
  commitW: 28,
  pad: 12,
}

const PAD = 12
const MAX_INNER = 672
const DAY_COLS = 7
const DAY_ROW_H = 54
const NAV_H = 24

type Buf = {
  ops: Op[]
  hits: HitBox[]
}

function innerX(width: number): { x: number; w: number } {
  const w = Math.min(MAX_INNER, Math.max(200, width - PAD * 2))
  return { x: (width - w) / 2, w }
}

function splice(buf: Buf, x: number, y: number, w: number): number {
  const n = Math.max(8, Math.floor(w / 7))
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: y + 8,
    text: '*'.repeat(n),
    color: 'rgba(17,17,17,0.22)',
    font: fontMono(9, 400),
    baseline: 'middle',
    track: 1,
  })
  return y + 16
}

function wrap(measure: Measure, text: string, font: string, maxW: number): string[] {
  const paras = text.split('\n')
  const out: string[] = []
  for (const para of paras) {
    if (para === '') {
      out.push('')
      continue
    }
    const words = para.split(/\s+/)
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (measure(next, font) <= maxW) line = next
      else {
        if (line) out.push(line)
        line = word
      }
    }
    if (line) out.push(line)
  }
  return out.length ? out : ['_']
}

type StemRow = {
  id: string
  text: string
  prefix: string
  branch: string
  depth: number
  urgent: boolean
  done: boolean
}

function flatten(nodes: TaskNode[], prefix = '', depth = 0): StemRow[] {
  const rows: StemRow[] = []
  nodes.forEach((node, i) => {
    const isLast = i === nodes.length - 1
    const branch = depth === 0 ? '' : isLast ? '└── ' : '├── '
    rows.push({
      id: node.id,
      text: node.text,
      prefix,
      branch,
      depth,
      urgent: node.priority === 'URGENT',
      done: Boolean(node.completed),
    })
    const childPrefix = depth === 0 ? '' : `${prefix}${isLast ? '    ' : '│   '}`
    rows.push(...flatten(node.children, childPrefix, depth + 1))
  })
  return rows
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function dayAbbr(year: number, month: number, day: number): string {
  return new Date(year, month, day)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase()
}

function compileCal(buf: Buf, world: World, measure: Measure, x: number, y: number, w: number): number {
  const { session, snapshot, now } = world
  const navY = y
  buf.ops.push({
    op: 'GLYPH',
    x: x + 14,
    y: navY + 12,
    text: '◀',
    color: COBALT,
    font: fontMono(11, 700),
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'NAV', x: x, y: navY, w: 28, h: NAV_H, z: 20, payload: -1 })

  const yy = String(session.viewYear).slice(-2)
  const label = session.calView === 'YR' ? String(session.viewYear) : `${MONTHS[session.viewMonth]} '${yy}`
  buf.ops.push({
    op: 'GLYPH',
    x: x + 36,
    y: navY + 12,
    text: label,
    color: COBALT,
    font: fontMono(10, 700),
    baseline: 'middle',
    track: 1.6,
  })

  buf.ops.push({
    op: 'GLYPH',
    x: x + w - 14,
    y: navY + 12,
    text: '▶',
    color: COBALT,
    font: fontMono(11, 700),
    align: 'right',
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'NAV', x: x + w - 28, y: navY, w: 28, h: NAV_H, z: 20, payload: 1 })

  const togW = 64
  const togX = x + w - 28 - togW - 8
  buf.ops.push({
    op: 'LINE',
    x1: togX,
    y1: navY + 3,
    x2: togX + togW,
    y2: navY + 3,
    color: COBALT,
    width: 1,
  })
  buf.ops.push({
    op: 'LINE',
    x1: togX,
    y1: navY + NAV_H - 3,
    x2: togX + togW,
    y2: navY + NAV_H - 3,
    color: COBALT,
    width: 1,
  })
  buf.ops.push({
    op: 'LINE',
    x1: togX,
    y1: navY + 3,
    x2: togX,
    y2: navY + NAV_H - 3,
    color: COBALT,
    width: 1,
  })
  buf.ops.push({
    op: 'LINE',
    x1: togX + togW,
    y1: navY + 3,
    x2: togX + togW,
    y2: navY + NAV_H - 3,
    color: COBALT,
    width: 1,
  })
  buf.ops.push({
    op: 'LINE',
    x1: togX + togW / 2,
    y1: navY + 3,
    x2: togX + togW / 2,
    y2: navY + NAV_H - 3,
    color: COBALT,
    width: 1,
  })

  const moOn = session.calView === 'MO'
  if (moOn) {
    buf.ops.push({ op: 'FILL', x: togX, y: navY + 3, w: togW / 2, h: NAV_H - 6, color: COBALT })
  } else {
    buf.ops.push({
      op: 'FILL',
      x: togX + togW / 2,
      y: navY + 3,
      w: togW / 2,
      h: NAV_H - 6,
      color: COBALT,
    })
  }
  buf.ops.push({
    op: 'GLYPH',
    x: togX + togW / 4,
    y: navY + 12,
    text: 'MO',
    color: moOn ? CANVAS : COBALT,
    font: fontMono(9, 700),
    align: 'center',
    baseline: 'middle',
    track: 1,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: togX + (togW * 3) / 4,
    y: navY + 12,
    text: 'YR',
    color: moOn ? COBALT : CANVAS,
    font: fontMono(9, 700),
    align: 'center',
    baseline: 'middle',
    track: 1,
  })
  buf.hits.push({ kind: 'MO', x: togX, y: navY, w: togW / 2, h: NAV_H, z: 20 })
  buf.hits.push({ kind: 'YR', x: togX + togW / 2, y: navY, w: togW / 2, h: NAV_H, z: 20 })

  y += NAV_H + 6
  const calTop = y

  if (session.calView === 'YR') {
    const cols = w >= 520 ? 4 : 3
    const colW = w / cols
    const monthH = 70
    MONTHS.forEach((name, monthIndex) => {
      const col = monthIndex % cols
      const row = Math.floor(monthIndex / cols)
      const mx = x + col * colW
      const my = y + row * monthH
      const active = monthIndex === session.viewMonth
      if (active) {
        buf.ops.push({ op: 'FILL', x: mx, y: my, w: colW - 4, h: monthH - 6, color: 'rgba(0,0,255,0.05)' })
      }
      buf.ops.push({
        op: 'GLYPH',
        x: mx,
        y: my + 10,
        text: name,
        color: COBALT,
        font: fontMono(9, 700),
        baseline: 'middle',
        track: 1.8,
      })
      const count = daysInMonth(session.viewYear, monthIndex)
      let dx = mx
      let dy = my + 22
      for (let day = 1; day <= count; day++) {
        const isToday =
          session.viewYear === now.year && monthIndex === now.month && day === now.day
        const tw = measure(String(day), fontNum(10, 300)) + 3
        if (dx + tw > mx + colW - 4) {
          dx = mx
          dy += 11
        }
        buf.ops.push({
          op: 'GLYPH',
          x: dx,
          y: dy,
          text: String(day),
          color: isToday ? COBALT : 'rgba(17,17,17,0.55)',
          font: fontNum(10, 300),
          baseline: 'top',
        })
        if (isToday) {
          buf.ops.push({
            op: 'LINE',
            x1: dx,
            y1: dy + 10,
            x2: dx + tw - 3,
            y2: dy + 10,
            color: COBALT,
            width: 1,
          })
        }
        dx += tw
      }
      buf.hits.push({
        kind: 'MONTH',
        x: mx,
        y: my,
        w: colW - 4,
        h: monthH - 6,
        z: 10,
        payload: monthIndex,
      })
    })
    const rows = Math.ceil(12 / cols)
    y += rows * monthH
    buf.hits.push({ kind: 'CAL', x, y: calTop, w, h: y - calTop, z: 0 })
    return y
  }

  const total = daysInMonth(session.viewYear, session.viewMonth)
  const colW = w / DAY_COLS
  const mm = String(session.viewMonth + 1).padStart(2, '0')
  const isCurrent = session.viewYear === now.year && session.viewMonth === now.month
  const parasites: { day: number; cx: number; cy: number; logs: { id: string; text: string }[] }[] = []

  for (let day = 1; day <= total; day++) {
    const col = (day - 1) % DAY_COLS
    const row = Math.floor((day - 1) / DAY_COLS)
    const cx = x + col * colW + colW / 2
    const cy = y + row * DAY_ROW_H + DAY_ROW_H / 2
    const key = `${mm}.${String(day).padStart(2, '0')}.${yy}`
    const dayLogs = snapshot.sysLogs.filter((n) => n.date === key)
    const isMarked = dayLogs.length > 0 || snapshot.markedDays.includes(day)
    const isPast = isCurrent && day < now.day
    const isToday = isCurrent && day === now.day
    const isSelected = session.selectedDay === day

    const numColor = isSelected ? COBALT : isPast ? 'rgba(17,17,17,0.18)' : INK
    buf.ops.push({
      op: 'GLYPH',
      x: cx,
      y: cy,
      text: String(day),
      color: numColor,
      font: fontNum(30, 300),
      align: 'center',
      baseline: 'middle',
    })
    if (isToday) {
      const nw = measure(String(day), fontNum(30, 300))
      buf.ops.push({
        op: 'LINE',
        x1: cx - nw / 2,
        y1: cy + 16,
        x2: cx + nw / 2,
        y2: cy + 16,
        color: INK,
        width: 2,
      })
    }

    const abbr = dayAbbr(session.viewYear, session.viewMonth, day)
    const aw = measure(abbr, fontMono(8, 800)) + 6
    buf.ops.push({
      op: 'FILL',
      x: cx - aw / 2,
      y: cy - 6,
      w: aw,
      h: 12,
      color: '#FFFFFF',
    })
    buf.ops.push({
      op: 'GLYPH',
      x: cx,
      y: cy,
      text: abbr,
      color: COBALT,
      font: fontMono(8, 800),
      align: 'center',
      baseline: 'middle',
      track: 1.2,
    })

    if (isMarked) {
      buf.ops.push({
        op: 'STRIKE',
        x: x + col * colW + 6,
        y: cy,
        w: colW - 12,
        thick: 2.5,
        color: URGENT,
      })
    }

    buf.hits.push({
      kind: 'DAY',
      x: x + col * colW,
      y: y + row * DAY_ROW_H,
      w: colW,
      h: DAY_ROW_H,
      z: isSelected ? 40 : 10,
      payload: day,
    })

    if (isSelected && dayLogs.length > 0) {
      parasites.push({ day, cx, cy, logs: dayLogs })
    }
  }

  for (const p of parasites) {
    let py = p.cy + 8
    for (const log of p.logs) {
      const label = log.text.toUpperCase()
      const tw = measure(label, fontMono(9, 800))
      const cw = Math.min(w * 0.7, Math.max(p.cx ? 80 : 80, tw + 28))
      const ch = 16
      const cx = Math.min(Math.max(x, p.cx - cw / 2), x + w - cw)
      buf.ops.push({
        op: 'CHIP',
        x: cx,
        y: py,
        w: cw,
        h: ch,
        text: label,
        fg: COBALT,
        bg: '#FFFFFF',
        font: fontMono(9, 800),
        padX: 4,
      })
      buf.ops.push({
        op: 'GLYPH',
        x: cx + cw - 4,
        y: py + ch / 2,
        text: '[X]',
        color: COBALT,
        font: fontMono(9, 700),
        align: 'right',
        baseline: 'middle',
      })
      buf.hits.push({
        kind: 'STRIKE_LOG',
        x: cx + cw - 22,
        y: py,
        w: 22,
        h: ch,
        z: 60,
        payload: log.id,
      })
      buf.hits.push({
        kind: 'DAY',
        x: cx,
        y: py,
        w: cw - 22,
        h: ch,
        z: 50,
        payload: p.day,
      })
      py += ch + 2
    }
  }

  const rows = Math.ceil(total / DAY_COLS)
  y += rows * DAY_ROW_H
  buf.hits.push({ kind: 'CAL', x, y: calTop, w, h: y - calTop, z: 0 })
  return y
}

function compileNest(buf: Buf, world: World, measure: Measure, x: number, y: number, w: number): number {
  const top = y
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: y + 8,
    text: 'tree://vault',
    color: 'rgba(17,17,17,0.4)',
    font: fontMono(9, 400),
    baseline: 'middle',
    track: 2.2,
  })
  y += 18
  const rows = flatten(world.snapshot.tasks)
  if (rows.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: y + 8,
      text: 'empty/',
      color: 'rgba(17,17,17,0.35)',
      font: fontMono(10, 400),
      baseline: 'middle',
      track: 1.4,
    })
    y += 20
  } else {
    const lineH = 18
    for (const row of rows) {
      const active = world.session.nestId === row.id
      if (active) {
        buf.ops.push({ op: 'FILL', x, y, w, h: lineH, color: COBALT })
      }
      const stem = `${row.prefix}${row.branch}`
      const color = active ? CANVAS : row.urgent ? URGENT : INK
      const stemColor = active ? 'rgba(244,244,240,0.55)' : 'rgba(17,17,17,0.35)'
      const sw = measure(stem, fontMono(12, 400))
      buf.ops.push({
        op: 'GLYPH',
        x,
        y: y + lineH / 2,
        text: stem,
        color: stemColor,
        font: fontMono(12, 400),
        baseline: 'middle',
      })
      buf.ops.push({
        op: 'GLYPH',
        x: x + sw,
        y: y + lineH / 2,
        text: row.text,
        color,
        font: fontMono(12, row.depth === 0 ? 800 : 400),
        baseline: 'middle',
        track: row.depth === 0 ? 0.4 : 0,
      })
      if (row.done) {
        const tw = measure(row.text, fontMono(12, row.depth === 0 ? 800 : 400))
        buf.ops.push({
          op: 'STRIKE',
          x: x + sw,
          y: y + lineH / 2,
          w: tw,
          thick: 1.5,
          color: active ? CANVAS : URGENT,
        })
      }
      buf.ops.push({
        op: 'GLYPH',
        x: x + w,
        y: y + lineH / 2,
        text: '[X]',
        color: active ? 'rgba(244,244,240,0.75)' : 'rgba(17,17,17,0.35)',
        font: fontMono(10, 400),
        align: 'right',
        baseline: 'middle',
      })
      buf.hits.push({
        kind: 'NODE',
        x,
        y,
        w: w - 28,
        h: lineH,
        z: 10,
        payload: row.id,
      })
      buf.hits.push({
        kind: 'STRIKE_NODE',
        x: x + w - 28,
        y,
        w: 28,
        h: lineH,
        z: 20,
        payload: row.id,
      })
      y += lineH
    }
  }
  buf.hits.push({ kind: 'NEST', x, y: top, w, h: Math.max(24, y - top), z: 0 })
  return y + 4
}

function compileDump(buf: Buf, world: World, measure: Measure, x: number, y: number, w: number): number {
  const top = y
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: y + 8,
    text: 'dump://scratch',
    color: 'rgba(17,17,17,0.4)',
    font: fontMono(9, 400),
    baseline: 'middle',
    track: 2.2,
  })
  y += 20
  const notes = world.snapshot.notes
  if (notes.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: y + 8,
      text: '_',
      color: 'rgba(17,17,17,0.35)',
      font: fontMono(10, 400),
      baseline: 'middle',
    })
    y += 20
  } else {
    const bodyFont = fontMono(12, 400)
    for (const note of notes) {
      buf.ops.push({
        op: 'GLYPH',
        x,
        y: y + 7,
        text: note.date,
        color: COBALT,
        font: fontMono(9, 400),
        baseline: 'middle',
        track: 1.6,
      })
      if (note.attachment) {
        buf.ops.push({
          op: 'GLYPH',
          x: x + 72,
          y: y + 7,
          text: `[${note.attachment}]`,
          color: 'rgba(17,17,17,0.4)',
          font: fontMono(9, 400),
          baseline: 'middle',
        })
      }
      y += 16
      const lines = wrap(measure, note.text, bodyFont, w)
      for (const line of lines) {
        buf.ops.push({
          op: 'GLYPH',
          x,
          y: y + 7,
          text: line,
          color: INK,
          font: bodyFont,
          baseline: 'middle',
        })
        y += 16
      }
      buf.ops.push({
        op: 'LINE',
        x1: x,
        y1: y + 4,
        x2: x + w,
        y2: y + 4,
        color: 'rgba(17,17,17,0.15)',
        width: 1,
      })
      y += 10
    }
  }
  const h = Math.max(48, y - top)
  buf.hits.push({ kind: 'DUMP', x, y: top, w, h, z: 0 })
  return y
}

function compileField(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { x, w } = innerX(world.width)
  const width = world.width

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h: 8, color: CANVAS })

  buf.ops.push({
    op: 'GLYPH',
    x: width - PAD,
    y: 16,
    text: world.clock,
    color: COBALT,
    font: fontMono(10, 400),
    align: 'right',
    baseline: 'middle',
    track: 2,
  })
  const invW = 28
  const invX = width - PAD - 108 - invW
  if (world.session.inv) {
    buf.ops.push({
      op: 'CHIP',
      x: invX,
      y: 8,
      w: invW,
      h: 16,
      text: 'INV',
      fg: CANVAS,
      bg: COBALT,
      font: fontMono(10, 700),
    })
  } else {
    buf.ops.push({
      op: 'GLYPH',
      x: invX + invW,
      y: 16,
      text: 'INV',
      color: COBALT,
      font: fontMono(10, 700),
      align: 'right',
      baseline: 'middle',
      track: 1.6,
    })
  }
  buf.hits.push({ kind: 'INV', x: invX, y: 6, w: invW + 4, h: 20, z: 30 })

  const sealW = Math.min(240, width * 0.78)
  const sealX = (width - sealW) / 2
  const sealY = 28
  buf.ops.push({ op: 'SEAL', x: sealX, y: sealY, w: sealW })
  const sealH = (118 / 280) * sealW
  buf.ops.push({
    op: 'GLYPH',
    x: width / 2,
    y: sealY + sealH + 12,
    text: 'local_first // no_cloud',
    color: 'rgba(17,17,17,0.45)',
    font: fontMono(9, 400),
    align: 'center',
    baseline: 'middle',
    track: 2.8,
  })

  let y = sealY + sealH + 24
  y = splice(buf, x, y, w)
  y = compileCal(buf, world, measure, x, y, w)
  y = splice(buf, x, y, w)
  y = compileNest(buf, world, measure, x, y, w)
  y = splice(buf, x, y, w)
  y = compileDump(buf, world, measure, x, y, w)
  y += 24

  buf.ops.push({ op: 'GRAIN' })
  buf.ops.push({ op: 'SCAN' })
  if (world.session.inv) buf.ops.push({ op: 'INV' })

  return { ops: buf.ops, hits: buf.hits, h: y }
}

function compileDock(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { session, snapshot, now, width, caretOn } = world
  const { x, w } = innerX(width)
  const echo = session.echo
  const top = echo ? DOCK_LAYOUT.echoH : 0
  const h = DOCK_LAYOUT.h + top

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: CANVAS })
  buf.ops.push({
    op: 'LINE',
    x1: 0,
    y1: 1,
    x2: width,
    y2: 1,
    color: COBALT,
    width: 2,
  })

  if (echo) {
    buf.ops.push({
      op: 'GLYPH',
      x: x,
      y: 10,
      text: echo,
      color: 'rgba(17,17,17,0.45)',
      font: fontMono(9, 400),
      baseline: 'middle',
      track: 0.8,
    })
  }

  const modeY = top + DOCK_LAYOUT.modeY
  const ctx = contextLabel(session, snapshot, now)
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: modeY,
    text: session.mode,
    color: COBALT,
    font: fontMono(10, 800),
    baseline: 'middle',
    track: 1.6,
  })
  const modeW = measure(session.mode, fontMono(10, 800)) + session.mode.length * 1.6
  buf.ops.push({
    op: 'GLYPH',
    x: x + modeW + 6,
    y: modeY,
    text: '//',
    color: 'rgba(17,17,17,0.3)',
    font: fontMono(10, 400),
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + modeW + 22,
    y: modeY,
    text: ctx,
    color: COBALT,
    font: fontMono(10, 400),
    baseline: 'middle',
    track: 1.4,
  })

  if (session.mode === 'NEST') {
    const p2 = session.priority === 'P2'
    const px = x + w - 110
    if (p2) {
      buf.ops.push({
        op: 'CHIP',
        x: px,
        y: modeY - 8,
        w: 36,
        h: 16,
        text: '·P2',
        fg: CANVAS,
        bg: COBALT,
        font: fontMono(9, 700),
      })
    } else {
      buf.ops.push({
        op: 'GLYPH',
        x: px + 18,
        y: modeY,
        text: '·P2',
        color: COBALT,
        font: fontMono(9, 700),
        align: 'center',
        baseline: 'middle',
      })
    }
    if (!p2) {
      buf.ops.push({
        op: 'CHIP',
        x: px + 42,
        y: modeY - 8,
        w: 64,
        h: 16,
        text: '!URGENT',
        fg: CANVAS,
        bg: URGENT,
        font: fontMono(9, 700),
      })
    } else {
      buf.ops.push({
        op: 'GLYPH',
        x: px + 74,
        y: modeY,
        text: '!URGENT',
        color: URGENT,
        font: fontMono(9, 700),
        align: 'center',
        baseline: 'middle',
      })
    }
    buf.hits.push({ kind: 'PRIORITY', x: px, y: modeY - 8, w: 36, h: 16, z: 20, payload: 'P2' })
    buf.hits.push({
      kind: 'PRIORITY',
      x: px + 42,
      y: modeY - 8,
      w: 64,
      h: 16,
      z: 20,
      payload: 'URGENT',
    })
  }

  if (session.mode === 'DUMP') {
    buf.ops.push({
      op: 'GLYPH',
      x: x + w,
      y: modeY,
      text: '+ATTACH',
      color: COBALT,
      font: fontMono(10, 700),
      align: 'right',
      baseline: 'middle',
      track: 1.2,
    })
    buf.hits.push({ kind: 'ATTACH', x: x + w - 70, y: modeY - 8, w: 70, h: 16, z: 20 })
  }

  const inputY = top + DOCK_LAYOUT.inputY
  if (caretOn) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: inputY + 10,
      text: '>',
      color: COBALT,
      font: fontMono(16, 800),
      baseline: 'middle',
    })
  }

  const placeholder =
    session.mode === 'DAY' ? 'log to selected day…' : session.mode === 'NEST' ? 'append node…' : 'dump note…'
  const shown = session.buffer
  if (shown) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + DOCK_LAYOUT.caretW,
      y: inputY + 10,
      text: shown,
      color: COBALT,
      font: fontMono(14, 700),
      baseline: 'middle',
    })
  } else {
    buf.ops.push({
      op: 'GLYPH',
      x: x + DOCK_LAYOUT.caretW,
      y: inputY + 10,
      text: placeholder,
      color: 'rgba(0,0,255,0.35)',
      font: fontMono(13, 400),
      baseline: 'middle',
    })
  }
  buf.ops.push({
    op: 'LINE',
    x1: x + DOCK_LAYOUT.caretW,
    y1: inputY + DOCK_LAYOUT.inputH - 4,
    x2: x + w - DOCK_LAYOUT.commitW,
    y2: inputY + DOCK_LAYOUT.inputH - 4,
    color: COBALT,
    width: 2,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + w,
    y: inputY + 10,
    text: '↵',
    color: COBALT,
    font: fontMono(14, 800),
    align: 'right',
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'COMMIT',
    x: x + w - DOCK_LAYOUT.commitW,
    y: inputY,
    w: DOCK_LAYOUT.commitW,
    h: DOCK_LAYOUT.inputH,
    z: 20,
  })
  buf.hits.push({ kind: 'DOCK', x: 0, y: 0, w: width, h, z: 0 })

  return { ops: buf.ops, hits: buf.hits, h }
}

export function compile(world: World, measure: Measure): Program {
  return {
    field: compileField(world, measure),
    dock: compileDock(world, measure),
  }
}
