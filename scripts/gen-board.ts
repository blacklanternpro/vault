/*
 * A deterministic 1,000-item board for the speed harness (e2e/perf), built
 * only through the model's own functions (src/model/doc.ts), so it is a board
 * the app could have made itself.
 *
 *   npx tsx scripts/gen-board.ts [out.json] [--items 1000] [--seed 1]
 *
 * writes a VAULT export envelope (importable through the ⋯ menu, or as the
 * `vault:doc` localStorage value). Same seed, same board, byte for byte.
 *
 * Shape: 12 folders; ~20 tasks each spread over the five lanes (a few urgent,
 * due, on tonight's shelf, a handful of loose subtasks); subtasks two and
 * three deep, some ticked; ~60 notes, some hitched to tasks; a trail of
 * created/moved/ticked/note events across six weeks, under the event cap.
 */
import { addNode, addNote, hitchNote, logEvent, pullCard, setStatus, toggleDone, updateNode } from '../src/model/doc'
import { MAX_EVENTS, type Doc, type EventKind, type Lane } from '../src/model/types'

/** 2026-11-01T00:00:00Z: every time in the board is measured back from here. */
export const GEN_EPOCH = Date.UTC(2026, 10, 1)
const DAY = 86_400_000

/** mulberry32: a small seeded PRNG, so the board does not depend on Math.random. */
function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)],
    chance: (p: number) => next() < p,
  }
}

const FOLDERS = ['client-acme', 'client-northwind', 'bad-form-site', 'r1i-pitch', 'estate-os', 'vault-worldwide', 'research', 'brand', 'ops', 'nightshift', 'archive', 'side-quests']
const VERBS = ['BUILD', 'FIX', 'DESIGN', 'WRITE', 'REVIEW', 'SHIP', 'AUDIT', 'MIGRATE', 'SKETCH', 'PITCH', 'REFACTOR', 'TEST']
const THINGS = ['HOMEPAGE', 'NAV', 'PRICING PAGE', 'ONBOARDING', 'INVOICE FLOW', 'SEARCH', 'DASHBOARD', 'BRAND KIT', 'API LAYER', 'SYNC', 'EXPORT', 'DIRECTORY', 'DRAWER', 'PALETTE', 'TRAIL', 'REPORT']
const STEPS = ['check analytics', 'write the brief', 'wireframe it', 'first pass', 'second pass', 'get feedback', 'fix review notes', 'write tests', 'update docs', 'ship to preview', 'tell the client', 'tidy up']
const NOTE_BITS = ['ask about the export', 'call back Tuesday', 'idea: pivot view', 'remember the token', 'invoice sent', 'check the DNS', 'font licence?', 'move standup', 'try reduced motion', 'backup before migrate']
/** Lane weights for tasks: mostly pending and done, a few in flight. */
const LANES: Lane[] = ['pending', 'pending', 'pending', 'rnd', 'rnd', 'active', 'done', 'done', 'done', 'dusted']

function iso(at: number): string {
  return new Date(at).toISOString().slice(0, 10)
}

export type GenOptions = { items?: number; seed?: number }

/** The board. `items` counts nodes (folders + tasks + subtasks); notes and trail come on top. */
export function genBoard({ items = 1000, seed = 1 }: GenOptions = {}): Doc {
  const r = rng(seed)
  let doc: Doc = { nodes: [], notes: [], events: [] }
  let clock = GEN_EPOCH - 42 * DAY
  const tick = () => (clock += r.int(60_000, 40 * 60_000))
  const event = (kind: EventKind, text: string, node?: number) => {
    doc = logEvent(doc, kind, text, node, tick())
  }

  const folders: number[] = []
  for (const name of FOLDERS) {
    const made = addNode(doc, { parent: null, title: name })
    doc = made.doc
    folders.push(made.id)
  }

  const tasks: number[] = []
  let tonight = 0
  let budget = items - folders.length
  // Round-robin over folders so every folder fills, until the item budget is spent.
  let f = 0
  while (budget > 0) {
    const folder = folders[f++ % folders.length]
    const title = `${r.pick(VERBS)} ${r.pick(THINGS)} ${tasks.length + 1}`
    const made = addNode(doc, { parent: folder, title, body: r.chance(0.6) ? `${title.toLowerCase()} — notes on scope.\nSecond line with detail.` : undefined, urgent: r.chance(0.06) })
    doc = made.doc
    const task = made.id
    tasks.push(task)
    budget--
    event('created', title, task)
    const lane = r.pick(LANES)
    if (lane !== 'pending') {
      doc = setStatus(doc, task, lane)
      event('moved', `→ ${lane}`, task)
    }
    const patch: Parameters<typeof updateNode>[2] = { touched: GEN_EPOCH - r.int(0, 40) * DAY }
    if (r.chance(0.15)) patch.due = iso(GEN_EPOCH + r.int(-5, 30) * DAY)
    if (r.chance(0.3)) patch.next = r.pick(STEPS)
    if (lane === 'active' && tonight < 3 && r.chance(0.5)) {
      patch.tonight = true
      tonight++
    }
    doc = updateNode(doc, task, patch)

    // Subtasks: 1–5, some with a nested line or two.
    const subs = Math.min(budget, r.int(1, 5))
    for (let s = 0; s < subs && budget > 0; s++) {
      const sub = addNode(doc, { parent: task, title: r.pick(STEPS) })
      doc = sub.doc
      budget--
      if (r.chance(0.45)) {
        doc = toggleDone(doc, sub.id)
        event('ticked', r.pick(STEPS), sub.id)
      }
      if (budget > 0 && r.chance(0.2)) {
        const deep = addNode(doc, { parent: sub.id, title: `${r.pick(STEPS)} (detail)` })
        doc = deep.doc
        budget--
      }
      if (r.chance(0.02)) doc = pullCard(doc, sub.id, r.pick(['pending', 'rnd'] as const))
    }
  }

  // Notes: dated over the six weeks, a third hitched to a task. Ids made deterministic after.
  for (let i = 0; i < 60; i++) {
    const at = GEN_EPOCH - r.int(0, 42) * DAY
    const d = new Date(at)
    const date = `${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCFullYear() % 100).padStart(2, '0')}`
    const made = addNote(doc, `${r.pick(NOTE_BITS)} #${i + 1}`, date)
    doc = made.doc
    if (r.chance(0.33)) doc = hitchNote(doc, made.id, r.pick(tasks))
    event('note', `note ${i + 1}`)
  }
  doc = { ...doc, notes: doc.notes.map((n, i) => ({ ...n, id: `gen-note-${i + 1}` })) }

  // The trail: more moves and ticks to read like six weeks of work, capped as the app caps it.
  while (doc.events.length < Math.min(MAX_EVENTS, 1500)) event(r.pick(['moved', 'ticked', 'renamed', 'leftoff'] as const), r.pick(STEPS), r.pick(tasks))
  doc = { ...doc, lastSeen: GEN_EPOCH }
  return doc
}

/** The localStorage / export envelope for a board (savedAt fixed so the output is stable). */
export function genEnvelope(opts: GenOptions = {}): string {
  return JSON.stringify({ app: 'vault', version: 1, savedAt: GEN_EPOCH, doc: genBoard(opts) })
}

// CLI: `npx tsx scripts/gen-board.ts [out.json] [--items N] [--seed N]`
const invokedDirectly = typeof process !== 'undefined' && process.argv[1] && /gen-board\.ts$/.test(process.argv[1])
if (invokedDirectly) {
  const args = process.argv.slice(2)
  const flag = (name: string) => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 ? Number(args.splice(i, 2)[1]) : undefined
  }
  const items = flag('items')
  const seed = flag('seed')
  const text = genEnvelope({ items, seed })
  const out = args[0]
  const fs = await import('node:fs')
  if (out) fs.writeFileSync(out, text + '\n')
  else process.stdout.write(text + '\n')
  const doc = JSON.parse(text).doc as Doc
  process.stderr.write(`gen-board: ${doc.nodes.length} items, ${doc.notes.length} notes, ${doc.events.length} trail events${out ? ` → ${out}` : ''}\n`)
}
