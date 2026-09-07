import type { EditBox, HitBox, Measure, Op, Session } from '../ir'
import { byId, childrenOf, placeOf, plaqueOf, type Doc, type GraphNode } from '../doc'
import { CHROME_PAD, paintChrome, type Buf } from './chrome'
import { COL_ORDER, PAPER, POWER, RULE, WHITE, fontHelv, isBinderStatus } from '../tokens'

export const PIPE_ROWS = 6
export const PIPE_ROW_H = 18

const FONT = fontHelv(12, 400)
const FONT_SM = fontHelv(11, 400)

const LEFT_COLS = ['backlog', 'active']
const RIGHT_COLS = ['staging', 'done']
const COL_LABEL: Record<string, string> = {
  backlog: 'BACKLOG',
  active: 'ACTIVE',
  staging: 'STAGING',
  done: 'COMMITTED',
}

function tasksIn(doc: Doc, col: string, focus: number | null): GraphNode[] {
  return doc.nodes
    .filter((n) => n.status === col && inFocus(doc, n, focus))
    .sort((a, b) => a.id - b.id)
}

function inFocus(doc: Doc, node: GraphNode, focus: number | null): boolean {
  if (focus == null) return true
  let cur: GraphNode | undefined = node
  while (cur) {
    if (cur.id === focus) return true
    cur = cur.parent != null ? byId(doc, cur.parent) : undefined
  }
  return false
}

function grouped(doc: Doc, nodes: GraphNode[]): { plaque: GraphNode | null; nodes: GraphNode[] }[] {
  const out: { plaque: GraphNode | null; nodes: GraphNode[] }[] = []
  for (const node of nodes) {
    const plaque = plaqueOf(doc, node)
    const last = out[out.length - 1]
    if (last && last.plaque?.id === plaque?.id) last.nodes.push(node)
    else out.push({ plaque, nodes: [node] })
  }
  return out
}

function setEdit(
  edit: { box: EditBox | null },
  session: Session,
  id: number,
  slot: 'title' | 'body' | 'subtask' | 'status',
  x: number,
  y: number,
  w: number,
  value: string,
  placeholder: string,
) {
  if (session.field?.id === id && session.field.slot === slot && session.lens === 'pipe') {
    edit.box = { x, y, w, h: PIPE_ROW_H - 2, value, placeholder, slot }
  }
}

function compileCol(
  buf: Buf,
  doc: Doc,
  session: Session,
  col: string,
  x: number,
  y: number,
  w: number,
  measure: Measure,
  edit: { box: EditBox | null },
): number {
  buf.ops.push({
    op: 'GLYPH',
    x: x + 8,
    y: y + 10,
    text: `── ${COL_LABEL[col] ?? col.toUpperCase()} ──`,
    color: POWER,
    font: FONT_SM,
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'COL', x, y, w, h: 16, z: 8, payload: col })
  let rowY = y + 20
  const rows = tasksIn(doc, col, session.nestFocus)
  const groups = grouped(doc, rows)
  let filled = 0

  for (const group of groups) {
    if (group.plaque) {
      buf.ops.push({
        op: 'GLYPH',
        x: x + 8,
        y: rowY + 8,
        text: group.plaque.title.toUpperCase(),
        color: POWER,
        font: FONT_SM,
        baseline: 'middle',
        track: 1,
      })
      buf.ops.push({
        op: 'LINE',
        x1: x + 6,
        y1: rowY + PIPE_ROW_H - 2,
        x2: x + w - 6,
        y2: rowY + PIPE_ROW_H - 2,
        color: RULE,
        width: 1,
        dash: [1, 3],
      })
      rowY += PIPE_ROW_H
    }

    for (const task of group.nodes) {
      buf.ops.push({
        op: 'LINE',
        x1: x + 6,
        y1: rowY + PIPE_ROW_H - 2,
        x2: x + w - 6,
        y2: rowY + PIPE_ROW_H - 2,
        color: RULE,
        width: 1,
      })
      const selected = session.selected?.kind === 'NODE' && session.selected.id === task.id
      const mark = col === 'done' ? '[X]' : '[ ]'
      const label = `${mark} #${task.id} ${task.title || '_'}`
      const tw = measure(label, FONT)
      const editingTitle = session.field?.id === task.id && session.field.slot === 'title'
      if (selected) {
        buf.ops.push({
          op: 'CHIP',
          x: x + 6,
          y: rowY,
          w: Math.min(w - 28, Math.max(80, tw + 12)),
          h: PIPE_ROW_H - 2,
          text: editingTitle ? '' : label,
          fg: WHITE,
          bg: POWER,
          font: FONT,
          padX: 6,
        })
      } else if (!editingTitle) {
        buf.ops.push({
          op: 'GLYPH',
          x: x + 10,
          y: rowY + 8,
          text: label,
          color: PAPER,
          font: FONT,
          baseline: 'middle',
        })
      }
      if (col === 'done' && !editingTitle) {
        buf.ops.push({
          op: 'STRIKE',
          x: x + 10,
          y: rowY + 8,
          w: Math.min(tw, w - 40),
          thick: 1,
          color: POWER,
        })
      }
      buf.hits.push({
        kind: 'NODE',
        x: x + 6,
        y: rowY,
        w: w - 28,
        h: PIPE_ROW_H,
        z: 12,
        payload: task.id,
      })
      if (col !== 'done') {
        buf.ops.push({
          op: 'GLYPH',
          x: x + w - 14,
          y: rowY + 8,
          text: '->',
          color: POWER,
          font: FONT_SM,
          align: 'center',
          baseline: 'middle',
        })
        buf.hits.push({
          kind: 'SHOVEL',
          x: x + w - 28,
          y: rowY,
          w: 24,
          h: PIPE_ROW_H,
          z: 20,
          payload: task.id,
        })
      }
      setEdit(edit, session, task.id, 'title', x + 6, rowY, w - 32, task.title, 'title')
      rowY += PIPE_ROW_H
      filled += 1

      if (session.pipeOpen === task.id) {
        rowY = compileExpand(buf, doc, session, task, x, rowY, w, edit)
      }
    }
  }

  while (filled < PIPE_ROWS) {
    buf.ops.push({
      op: 'LINE',
      x1: x + 6,
      y1: rowY + PIPE_ROW_H - 2,
      x2: x + w - 6,
      y2: rowY + PIPE_ROW_H - 2,
      color: RULE,
      width: 1,
    })
    buf.hits.push({
      kind: 'EMPTY',
      x: x + 6,
      y: rowY,
      w: w - 12,
      h: PIPE_ROW_H,
      z: 10,
      payload: col,
    })
    rowY += PIPE_ROW_H
    filled += 1
  }
  return rowY
}

function compileExpand(
  buf: Buf,
  doc: Doc,
  session: Session,
  task: GraphNode,
  x: number,
  rowY: number,
  w: number,
  edit: { box: EditBox | null },
): number {
  const body = task.body || (session.field?.id === task.id && session.field.slot === 'body' ? session.fieldBuffer : '')
  buf.ops.push({
    op: 'GLYPH',
    x: x + 18,
    y: rowY + 8,
    text: body || 'body _',
    color: body ? PAPER : RULE,
    font: FONT_SM,
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'SLOT',
    x: x + 10,
    y: rowY,
    w: w - 20,
    h: PIPE_ROW_H,
    z: 14,
    payload: `${task.id}:body`,
  })
  setEdit(edit, session, task.id, 'body', x + 10, rowY, w - 20, task.body ?? '', 'body')
  rowY += PIPE_ROW_H

  for (const child of childrenOf(doc, task.id)) {
    const mark = child.status === 'done' ? '[X]' : '[ ]'
    buf.ops.push({
      op: 'GLYPH',
      x: x + 18,
      y: rowY + 8,
      text: `${mark} ${child.title}`,
      color: PAPER,
      font: FONT,
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'NODE',
      x: x + 10,
      y: rowY,
      w: w - 24,
      h: PIPE_ROW_H,
      z: 12,
      payload: child.id,
    })
    buf.hits.push({
      kind: 'SHOVEL',
      x: x + 10,
      y: rowY,
      w: 22,
      h: PIPE_ROW_H,
      z: 18,
      payload: child.id,
    })
    rowY += PIPE_ROW_H
  }

  buf.ops.push({
    op: 'GLYPH',
    x: x + 18,
    y: rowY + 8,
    text: '+ subtask',
    color: RULE,
    font: FONT_SM,
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'SLOT',
    x: x + 10,
    y: rowY,
    w: w - 20,
    h: PIPE_ROW_H,
    z: 14,
    payload: `${task.id}:subtask`,
  })
  setEdit(edit, session, task.id, 'subtask', x + 10, rowY, w - 20, '', 'subtask')
  rowY += PIPE_ROW_H

  let sx = x + 12
  for (const st of ['none', ...COL_ORDER]) {
    const live = task.status === st
    const label = st.toUpperCase()
    buf.ops.push({
      op: 'GLYPH',
      x: sx,
      y: rowY + 8,
      text: label,
      color: live ? POWER : RULE,
      font: FONT_SM,
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'STATUS',
      x: sx - 2,
      y: rowY,
      w: label.length * 7 + 8,
      h: PIPE_ROW_H,
      z: 16,
      payload: `${task.id}:${st}`,
    })
    sx += label.length * 7 + 12
  }
  buf.hits.push({
    kind: 'SLOT',
    x: x + 10,
    y: rowY,
    w: w - 20,
    h: PIPE_ROW_H,
    z: 13,
    payload: `${task.id}:status`,
  })
  setEdit(edit, session, task.id, 'status', x + 10, rowY, w - 20, task.status, 'status')
  rowY += PIPE_ROW_H
  return rowY
}

export function compilePipe(
  doc: Doc,
  session: Session,
  measure: Measure,
  fieldW: number,
  edit: { box: EditBox | null },
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'PIPE')
  const x = origin.x
  const y = origin.y
  const w = Math.max(560, Math.min(fieldW - x - 16, 980))
  const spineW = 36
  const pageW = (w - spineW) / 2
  const collapsed = session.collapsed.includes('PIPE')
  const buf: Buf = { ops: [], hits: [] }
  const open = binderNodesCount(doc, session.nestFocus)
  const live = session.lens === 'pipe' || session.selected?.kind === 'PIPE' || session.selected?.kind === 'NODE'

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { x, y, w, h, title: `PIPE // ${doc.pipeName}`, organ: 'PIPE', count: open, live })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const probe: Buf = { ops: [], hits: [] }
  const head = CHROME_PAD + 18
  let ly = y + head
  for (const col of LEFT_COLS) ly = compileCol(probe, doc, session, col, x + 4, ly, pageW - 8, measure, edit)
  let ry = y + head
  const rightEdit = { box: edit.box }
  for (const col of RIGHT_COLS) ry = compileCol(probe, doc, session, col, x + pageW + spineW + 4, ry, pageW - 8, measure, rightEdit)
  if (rightEdit.box && !edit.box) edit.box = rightEdit.box
  const h = Math.max(ly - y, ry - y) + 10

  paintChrome(buf, { x, y, w, h, title: `PIPE // ${doc.pipeName}`, organ: 'PIPE', count: open, live })
  buf.hits.push({ kind: 'PIPE', x, y, w, h, z: 4, payload: 'PIPE' })

  buf.ops.push({
    op: 'GLYPH',
    x: x + 10,
    y: y + CHROME_PAD + 10,
    text: '[ FOCUS ]',
    color: POWER,
    font: FONT_SM,
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + pageW + spineW + 10,
    y: y + CHROME_PAD + 10,
    text: '[ GATEWAY ]',
    color: POWER,
    font: FONT_SM,
    baseline: 'middle',
  })

  const spineX = x + pageW
  buf.ops.push({
    op: 'LINE',
    x1: spineX + spineW / 2 - 2,
    y1: y + CHROME_PAD,
    x2: spineX + spineW / 2 - 2,
    y2: y + h - 8,
    color: POWER,
    width: 1,
  })
  buf.ops.push({
    op: 'LINE',
    x1: spineX + spineW / 2 + 2,
    y1: y + CHROME_PAD,
    x2: spineX + spineW / 2 + 2,
    y2: y + h - 8,
    color: POWER,
    width: 1,
  })
  for (let i = 0; i < 3; i++) {
    const ringY = y + 80 + i * 70
    buf.ops.push({
      op: 'GLYPH',
      x: spineX + spineW / 2,
      y: ringY,
      text: 'O',
      color: POWER,
      font: fontHelv(13, 700),
      align: 'center',
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'RING',
      x: spineX + 4,
      y: ringY - 10,
      w: spineW - 8,
      h: 20,
      z: 18,
    })
  }

  buf.ops.push(...probe.ops)
  buf.hits.push(...probe.hits)
  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}

function binderNodesCount(doc: Doc, focus: number | null): number {
  return doc.nodes.filter((n) => isBinderStatus(n.status) && inFocus(doc, n, focus) && n.status !== 'done').length
}
