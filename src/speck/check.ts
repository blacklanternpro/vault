import { compile, PIPE_ROWS } from './compile'
import { parseDoc, SEED_SOURCE, serializeDoc } from './doc'
import { applyHit, commitLine, freshSession } from './machine'
import { PAINT_OPS } from './tokens'

function measure(text: string): number {
  return text.length * 7
}

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  const doc = parseDoc(SEED_SOURCE)
  if (doc.pipeName !== 'vault') fail(`pipe name ${doc.pipeName}`)
  if (doc.cols.join(' ') !== 'backlog active staging done') fail(`cols ${doc.cols.join(' ')}`)
  if (!doc.tasks.some((t) => t.id === 104 && t.col === 'backlog' && t.title.includes('ingress'))) {
    fail('task 104 backlog')
  }
  if (!doc.stems.some((s) => s.path.includes('scout_ridge'))) fail('stem scout')
  if (!doc.notes.some((n) => n.text === 'ridge')) fail('dump ridge')
  if (!doc.places.some((p) => p.organ === 'PIPE')) fail('place PIPE')
  if (!doc.glyphs.some((g) => g.text === '07')) fail('glyph 07')

  const ops = PAINT_OPS.join(' ')
  if (ops.includes('SEAL') || ops.includes('GRAIN') || ops.includes('SCAN') || ops.includes('INV')) {
    fail(`dead ops ${ops}`)
  }
  if (!ops.includes('GLYPH') || !ops.includes('CHIP') || !ops.includes('STEM')) fail('live ops')

  const round = parseDoc(serializeDoc(doc))
  if (round.tasks.length !== doc.tasks.length) fail('serialize tasks')

  let session = { ...freshSession(), selected: { kind: 'TASK' as const, id: 104 } }
  let result = commitLine('SHOVEL', session, SEED_SOURCE)
  let next = parseDoc(result.source).tasks.find((t) => t.id === 104)
  if (next?.col !== 'active') fail(`shovel1 ${next?.col}`)

  result = commitLine('SHOVEL', session, result.source)
  next = parseDoc(result.source).tasks.find((t) => t.id === 104)
  if (next?.col !== 'staging') fail(`shovel2 ${next?.col}`)

  const clipStem = doc.stems[0]
  if (!clipStem) fail('no stem to clip')
  else {
    result = commitLine('CLIP', { ...freshSession(), selected: { kind: 'STEM', path: clipStem.path } }, SEED_SOURCE)
    const clipped = parseDoc(result.source).tasks.find((t) => t.nest === clipStem.path)
    if (!clipped || clipped.col !== 'backlog') fail(`clip ${clipped?.nest}`)
  }

  result = commitLine('rewrite dock', { ...freshSession(), selected: { kind: 'PIPE' } }, SEED_SOURCE)
  if (!parseDoc(result.source).tasks.some((t) => t.title === 'rewrite dock' && t.col === 'backlog')) {
    fail('commit pipe task')
  }

  result = commitLine('WORDS', freshSession(), SEED_SOURCE)
  if (result.session.echo?.includes('SEAL')) fail('WORDS SEAL')
  if (!result.session.echo?.includes('GLYPH')) fail('WORDS GLYPH')

  result = commitLine('CLEAR', freshSession(), result.source)
  if (parseDoc(result.source).pipeName !== 'vault') fail('CLEAR seed')

  const world = {
    source: SEED_SOURCE,
    session: freshSession(),
    width: 1200,
    viewH: 800,
    caretOn: true,
  }
  const field = compile(world, measure).field
  const lines = field.ops.filter((op) => op.op === 'LINE')
  if (lines.length < PIPE_ROWS * 4) fail(`ledger lines ${lines.length}`)
  const texts = field.ops.filter((op) => op.op === 'GLYPH' || op.op === 'STEM').map((op) => op.text)
  if (!texts.some((t) => /BACKLOG/i.test(t))) fail('BACKLOG legend')
  if (!texts.some((t) => /STAGING/i.test(t))) fail('STAGING legend')
  if (!texts.some((t) => t === '07')) fail('free glyph paints')
  const monthPack = field.ops.filter(
    (op) => op.op === 'GLYPH' && /^(?:[1-9]|[12]\d|3[01])$/.test(op.text),
  )
  if (monthPack.length >= 28) fail(`month pack still home ${monthPack.length}`)

  const emptyDoc = { ...parseDoc(SEED_SOURCE), tasks: [] }
  const emptyField = compile({ ...world, source: serializeDoc(emptyDoc) }, measure).field
  const emptyLines = emptyField.ops.filter((op) => op.op === 'LINE').length
  if (emptyLines < PIPE_ROWS * 4) fail(`empty rows ${emptyLines}`)

  const open = compile(
    {
      ...world,
      session: { ...freshSession(), selected: { kind: 'TASK', id: 102 }, overlay: true },
    },
    measure,
  ).field
  const chips = open.ops.filter((op) => op.op === 'CHIP')
  if (chips.length < 1) fail(`overlay chips ${chips.length}`)

  const tapped = applyHit(
    { kind: 'TASK', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 102 },
    freshSession(),
    SEED_SOURCE,
  )
  if (!tapped.session.overlay || tapped.session.selected?.kind !== 'TASK') fail('tap task overlay')

  const dismissed = applyHit(
    { kind: 'FIELD', x: 0, y: 0, w: 10, h: 10, z: 0 },
    tapped.session,
    SEED_SOURCE,
  )
  if (dismissed.session.overlay) fail('field tap dismiss')

  const shoveHit = applyHit(
    { kind: 'SHOVEL', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 104 },
    freshSession(),
    SEED_SOURCE,
  )
  if (parseDoc(shoveHit.source).tasks.find((t) => t.id === 104)?.col !== 'active') fail('hit shovel')

  return fails
}
