import { compile, ROW_H } from './compile'
import type { Now, Session } from './ir'
import { applyHit, commitLine, focusHit, freshSession } from './machine'
import { isCommandLine } from './parse'
import {
  addChild,
  branchCount,
  counts,
  findNode,
  flatten,
  MAX_DEPTH,
  parseTree,
  serialize,
} from './tree'

const NOW: Now = { year: 2026, month: 7, day: 19, hh: 22, mm: 41 }

const SRC = `STEM "ops" 08.19.26
  STEM "flush resolvers" STRIKE 08.19.26 22:41
    STEM "check dns" 08.19.26
  STEM "scout ridge a" 08.19.26
STEM "lab" 08.19.26`

function measure(text: string, font: string): number {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 12)
  return text.length * size * 0.55
}

function world(source: string, session: Session) {
  return { source, session, now: NOW, width: 390, viewH: 700, caretOn: true }
}

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  // tree shape
  const tree = parseTree(SRC)
  if (tree.length !== 2) fail(`roots ${tree.length}`)
  if (tree[0]?.text !== 'ops') fail(`root text ${tree[0]?.text}`)
  if (tree[0]?.children.length !== 2) fail(`ops children ${tree[0]?.children.length}`)
  const deep = tree[0]?.children[0]
  if (deep?.text !== 'flush resolvers' || !deep.done) fail('strike flag')
  if (deep?.at !== '22:41') fail(`settle time ${deep?.at}`)
  if (deep?.children[0]?.text !== 'check dns') fail('depth 2 child')
  if (deep?.children[0]?.path !== '0.0.0') fail(`path ${deep?.children[0]?.path}`)

  // round trip
  const again = parseTree(serialize(tree))
  if (serialize(again) !== serialize(tree)) fail('round trip')
  if (!serialize(tree).includes('    STEM "check dns"')) fail('indent on serialize')

  // seeds are stable and text-derived
  if (tree[0].seed !== parseTree(SRC)[0].seed) fail('seed unstable')

  // counts
  const c = counts(tree)
  if (c.items !== 5) fail(`items ${c.items}`)
  if (c.settled !== 1) fail(`settled ${c.settled}`)
  if (c.open !== 4) fail(`open ${c.open}`)
  if (c.depth !== 3) fail(`depth ${c.depth}`)
  const bc = branchCount(tree[0])
  if (bc.total !== 3 || bc.done !== 1) fail(`branch count ${bc.done}/${bc.total}`)

  // folds hide descendants
  if (flatten(tree, new Set()).length !== 5) fail('flatten all')
  const folded = flatten(tree, new Set(['0']))
  if (folded.length !== 2) fail(`folded rows ${folded.length}`)
  if (!folded[0].folded) fail('fold flag')

  // add child under a parent, and the depth cap
  const added = addChild(tree, '0', 'new task', '08.19.26')
  if (findNode(added, '0')?.children.length !== 3) fail('addChild')
  const capped = addChild(added, '0.0.0', 'too deep', '08.19.26')
  const cappedNode = findNode(capped, '0.0.0')
  if (cappedNode && cappedNode.children.length > 0 && MAX_DEPTH === 4) {
    if (cappedNode.depth >= MAX_DEPTH) fail('depth cap breached')
  }
  if (counts(capped).depth > MAX_DEPTH) fail(`cap ${counts(capped).depth}`)

  // command vs data: the whole point of the solo-word rule
  if (!isCommandLine('CLEAR')) fail('CLEAR command')
  if (isCommandLine('clear the desk')) fail('"clear the desk" must be a task')
  if (isCommandLine('outside call')) fail('"outside call" must be a task')
  if (!isCommandLine('SEE')) fail('SEE command')
  if (!isCommandLine('UNDO')) fail('UNDO command')
  if (isCommandLine('flush resolvers')) fail('plain text is data')

  // dock commits a task, armed parent takes the child
  const empty = freshSession()
  const first = commitLine('flush resolvers', empty, '', NOW)
  if (!first.source.includes('STEM "flush resolvers"')) fail(`commit ${first.source}`)
  if (!first.source.includes('08.19.26')) fail('born date stamped')

  const armed: Session = { ...empty, armed: '0' }
  const child = commitLine('check dns', armed, first.source, NOW)
  if (!child.source.includes('  STEM "check dns"')) fail(`child indent ${child.source}`)

  // settle stamps the clock, and unsettles clean
  const settled = applyHit(
    { kind: 'DOT', x: 0, y: 0, w: 1, h: 1, z: 1, payload: '0' },
    empty,
    first.source,
    NOW,
  )
  if (!settled.source.includes('STRIKE')) fail('settle strike')
  if (!settled.source.includes('22:41')) fail('settle time')
  const unsettled = applyHit(
    { kind: 'DOT', x: 0, y: 0, w: 1, h: 1, z: 1, payload: '0' },
    empty,
    settled.source,
    NOW,
  )
  if (unsettled.source.includes('STRIKE')) fail('unsettle')

  // kill takes the branch and arms undo
  const killed = applyHit(
    { kind: 'KILL', x: 0, y: 0, w: 1, h: 1, z: 1, payload: '0' },
    empty,
    SRC,
    NOW,
  )
  if (parseTree(killed.source).length !== 1) fail('kill branch')
  if (!killed.session.undo) fail('undo armed')
  if (!killed.session.echo?.includes('UNDO')) fail('undo echo')
  const restored = applyHit(
    { kind: 'UNDO', x: 0, y: 0, w: 1, h: 1, z: 1 },
    killed.session,
    killed.source,
    NOW,
  )
  if (restored.source !== SRC) fail('undo restores')

  // CLEAR drops settled leaves. A settled parent holding open work stays put,
  // or clearing would quietly delete the open child underneath it.
  const cleared = commitLine('CLEAR', empty, SRC, NOW)
  if (!cleared.source.includes('flush resolvers')) fail('CLEAR orphaned an open child')
  if (!cleared.source.includes('check dns')) fail('CLEAR ate a nested open task')
  if (!cleared.source.includes('scout ridge a')) fail('CLEAR ate an open task')
  const leafSrc = 'STEM "keep me" 08.19.26\nSTEM "done" STRIKE 08.19.26 22:41'
  const leafCleared = commitLine('CLEAR', empty, leafSrc, NOW)
  if (leafCleared.source.includes('done')) fail('CLEAR left a settled leaf')
  if (!leafCleared.source.includes('keep me')) fail('CLEAR ate an open leaf')

  // focus prints from a branch
  const focused = focusHit(empty, SRC, '0')
  if (focused.session.focus !== '0') fail('focus set')
  // printing from "ops" shows its whole branch: 2 children + 1 grandchild
  const focusRows = compile(world(SRC, focused.session), measure).field
  const focusDots = focusRows.ops.filter((op) => op.op === 'DOT')
  if (focusDots.length !== 3) fail(`focus rows ${focusDots.length}`)
  if (focusRows.hits.some((h) => h.kind === 'ROW' && h.payload === '1')) fail('focus leaked a sibling')

  // the slip itself
  const field = compile(world(SRC, empty), measure).field
  const paper = field.ops.filter((op) => op.op === 'FILL' && op.color === '#F4F4F0')
  if (paper.length !== 1) fail('paper slip missing')
  if (paper[0]?.op === 'FILL' && paper[0].y !== 0) fail('slip must bleed off the top')
  const wires = field.ops.filter((op) => op.op === 'WIRE')
  if (wires.length !== 3) fail(`wires ${wires.length}`)
  for (const wire of wires) {
    if (wire.op !== 'WIRE') continue
    if (wire.x2 <= wire.x1) fail('wire must run right as it descends')
    if (wire.y2 <= wire.y1) fail('wire must descend')
  }
  const hands = field.ops.filter((op) => op.op === 'HAND')
  if (hands.length !== 1) fail(`hand strikes ${hands.length}`)
  if (field.ops.some((op) => op.op === 'STAMP' && op.alpha < 0.5)) fail('big stamp before clear')
  if (!field.ops.some((op) => op.op === 'STAMP')) fail('BAD FORM stamp missing')
  if (field.hits.filter((h) => h.kind === 'ROW').length !== 5) fail('row hits')
  if (field.hits.filter((h) => h.kind === 'PLUS').length !== 5) fail('plus hits')
  if (field.hits.filter((h) => h.kind === 'RATIO').length !== 2) fail('ratio hits on parents only')
  if (ROW_H < 38) fail('row hit target too small for thumbs')

  // all settled: the big stamp lands
  const allDone = 'STEM "one" STRIKE 08.19.26 22:41\nSTEM "two" STRIKE 08.19.26 22:41'
  const stamped = compile(world(allDone, empty), measure).field
  if (!stamped.ops.some((op) => op.op === 'STAMP' && op.alpha < 0.5)) fail('no stamp on full clear')

  // empty slip prints a rule, not an apology
  const bare = compile(world('', empty), measure).field
  if (bare.ops.some((op) => op.op === 'DOT')) fail('rows on an empty slip')
  if (!bare.ops.some((op) => op.op === 'GLYPH' && op.text === '_')) fail('empty mark')

  return fails
}
