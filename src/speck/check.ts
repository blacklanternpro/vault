import { compile, PIPE_ROWS } from './compile'
import { byId, childrenOf, parseDoc, SEED_SOURCE, serializeDoc } from './doc'
import { applyHit, applyKey, commitLine, cycleField, freshSession, placeOrgan } from './machine'
import { PAINT_OPS, POWER } from './tokens'

function measure(text: string): number {
  return text.length * 7
}

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  const doc = parseDoc(SEED_SOURCE)
  if (doc.pipeName !== 'vault') fail(`pipe name ${doc.pipeName}`)
  if (doc.cols.join(' ') !== 'backlog active staging done') fail(`cols ${doc.cols.join(' ')}`)

  const n104 = byId(doc, 104)
  if (!n104 || n104.status !== 'backlog' || n104.parent !== 1 || !n104.title.includes('ingress')) {
    fail('node 104 backlog under ops')
  }
  const n102 = byId(doc, 102)
  if (!n102 || n102.status !== 'active' || n102.parent !== 20 || n102.body !== 'overlay leftover') {
    fail('node 102 active under net')
  }
  const n11 = byId(doc, 11)
  if (!n11 || !n11.urgent || n11.parent !== 10) fail('node 11 urgent lab')
  if (!doc.notes.some((n) => n.text === 'ridge')) fail('dump ridge')
  if (!doc.places.some((p) => p.organ === 'PIPE')) fail('place PIPE')
  if (!doc.glyphs.some((g) => g.text === 'VAULT' || g.text === '07')) fail('glyph VAULT')
  if (!doc.inv) fail('seed INV')
  if (!(doc.grain > 0)) fail('seed GRAIN')
  if (!doc.places.some((p) => p.organ === 'CAL')) fail('place CAL')

  const ops = PAINT_OPS.join(' ')
  for (const live of ['GRAIN', 'SCAN', 'INV', 'OVAL', 'GLYPH', 'CHIP', 'STEM']) {
    if (!ops.includes(live)) fail(`missing op ${live}`)
  }
  if (ops.includes('CLIP')) fail('CLIP live')

  const round = parseDoc(serializeDoc(doc))
  if (round.nodes.length !== doc.nodes.length) fail('serialize nodes')
  if (byId(round, 102)?.body !== 'overlay leftover') fail('serialize body')
  if (byId(round, 104)?.parent !== 1) fail('serialize parent')

  let session = { ...freshSession(), selected: { kind: 'NODE' as const, id: 104 } }
  let result = commitLine('SHOVEL', session, SEED_SOURCE)
  let next = byId(parseDoc(result.source), 104)
  if (next?.status !== 'active') fail(`shovel1 ${next?.status}`)

  result = commitLine('SHOVEL', session, result.source)
  next = byId(parseDoc(result.source), 104)
  if (next?.status !== 'staging') fail(`shovel2 ${next?.status}`)

  result = commitLine('SHOVEL', { ...freshSession(), selected: { kind: 'NODE', id: 11 } }, SEED_SOURCE)
  if (byId(parseDoc(result.source), 11)?.status !== 'backlog') fail('shovel none onto backlog')

  result = commitLine(
    'new website project, site redesign of homepage, need to assess aesthetic, create repo',
    freshSession(),
    SEED_SOURCE,
  )
  const dumped = parseDoc(result.source)
  if (dumped.nodes.length !== parseDoc(SEED_SOURCE).nodes.length) fail('dock dump created nodes')
  if (result.session.find !== 'new website project, site redesign of homepage, need to assess aesthetic, create repo') {
    fail(`dock find ${result.session.find}`)
  }
  if (result.session.echo !== 'FIND _') fail(`dock dump echo ${result.session.echo}`)

  result = commitLine('FIND telemetry', freshSession(), SEED_SOURCE)
  if (result.session.find !== 'telemetry') fail(`FIND query ${result.session.find}`)
  if (result.session.echo !== 'FIND 1') fail(`FIND echo ${result.session.echo}`)
  if (result.session.selected?.kind !== 'NODE' || result.session.selected.id !== 102) fail('FIND selects telemetry')

  result = commitLine('NOTE scratch line', { ...freshSession(), lens: 'pipe' }, SEED_SOURCE)
  if (!parseDoc(result.source).notes.some((n) => n.text === 'scratch line')) fail('NOTE append')

  const dumpLive = commitLine('from dump', { ...freshSession(), lens: 'dump', selected: { kind: 'DUMP' } }, SEED_SOURCE)
  if (!parseDoc(dumpLive.source).notes.some((n) => n.text === 'from dump')) fail('dump lens note')
  if (parseDoc(dumpLive.source).nodes.length !== parseDoc(SEED_SOURCE).nodes.length) fail('dump lens created nodes')

  result = commitLine('GLYPH 100 80 32 "MARK"', freshSession(), SEED_SOURCE)
  if (!parseDoc(result.source).glyphs.some((g) => g.text === 'MARK' && g.x === 100 && g.y === 80)) fail('dock GLYPH')

  result = commitLine('WORDS', freshSession(), SEED_SOURCE)
  if (result.session.echo?.includes('CLIP')) fail('WORDS CLIP')
  if (!result.session.echo?.includes('GRAIN')) fail('WORDS GRAIN')
  if (!result.session.echo?.includes('SCAN')) fail('WORDS SCAN')
  if (!result.session.echo?.includes('INV')) fail('WORDS INV')
  if (!result.session.echo?.includes('OVAL')) fail('WORDS OVAL')
  if (!result.session.echo?.includes('GLYPH')) fail('WORDS GLYPH')
  if (!result.session.echo?.includes('FIND')) fail('WORDS FIND')
  if (result.session.echo?.includes('SEE CLEAR') || result.session.echo?.includes('SHOVEL FOCUS')) {
    fail(`WORDS still REPL ${result.session.echo}`)
  }

  result = commitLine('CLEAR', freshSession(), result.source)
  if (parseDoc(result.source).pipeName !== 'vault') fail('CLEAR seed')
  if (!byId(parseDoc(result.source), 104)) fail('CLEAR nodes')

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
  if (!texts.some((t) => t === 'VAULT' || t === '07')) fail('free glyph paints')
  if (!texts.some((t) => /PIPE \/\//.test(t))) fail('pipe plaque')
  if (!texts.some((t) => /NEST \/\//.test(t))) fail('nest plaque')
  if (!texts.some((t) => /DUMP \/\//.test(t))) fail('dump plaque')
  if (!texts.some((t) => t === '_ LINK' || t === '_ PIC' || t === '_ FILE')) fail('dump ghost slots')
  if (!field.hits.some((h) => h.kind === 'SHOVEL' && h.payload === 11)) fail('nest shovel')
  if (!texts.some((t) => /CAL \/\//.test(t))) fail('cal plaque')
  if (!texts.some((t) => t.includes('[x]'))) fail('organ close')
  if (!texts.some((t) => t === 'SKULL')) fail('skull organ')
  if (!texts.some((t) => t === 'SEAL' || t === 'VAULT WORLDWIDE')) fail('seal organ')
  const monthPack = field.ops.filter(
    (op) => op.op === 'GLYPH' && /^(?:[1-9]|[12]\d|3[01])$/.test(op.text),
  )
  if (monthPack.length < 28) fail(`cal days ${monthPack.length}`)
  if (!field.ops.some((op) => op.op === 'GRAIN')) fail('grain op')
  if (!field.ops.some((op) => op.op === 'INV')) fail('inv op')
  const groundFill = field.ops.find((op) => op.op === 'FILL')
  if (!groundFill || groundFill.op !== 'FILL' || groundFill.color !== '#F4F4F0') fail('paper ground')

  const colors = field.ops.flatMap((op) => {
    if (op.op === 'GLYPH' || op.op === 'STEM' || op.op === 'STRIKE') return [op.color]
    if (op.op === 'LINE') return [op.color]
    if (op.op === 'CHIP') return [op.bg, op.fg]
    if (op.op === 'FILL') return [op.color]
    return []
  })
  if (colors.some((c) => c === '#0000FF' || c.toLowerCase() === '#0000ff')) fail('cobalt still live')
  const dock = compile(world, measure).dock
  const caret = dock.ops.find((op) => op.op === 'GLYPH' && op.text === '>')
  if (!caret || caret.op !== 'GLYPH' || caret.color !== POWER) fail('dock caret not power red')

  const emptyDoc = { ...parseDoc(SEED_SOURCE), nodes: parseDoc(SEED_SOURCE).nodes.filter((n) => !['backlog', 'active', 'staging', 'done'].includes(n.status)) }
  const emptyField = compile({ ...world, source: serializeDoc(emptyDoc) }, measure).field
  const emptyLines = emptyField.ops.filter((op) => op.op === 'LINE').length
  if (emptyLines < PIPE_ROWS * 4) fail(`empty rows ${emptyLines}`)

  const closedPipe = field.hits.find((h) => h.kind === 'PIPE')
  const open = compile(
    {
      ...world,
      session: { ...freshSession(), selected: { kind: 'NODE', id: 102 }, pipeOpen: 102, lens: 'pipe' },
    },
    measure,
  )
  const openPipe = open.field.hits.find((h) => h.kind === 'PIPE')
  if (!closedPipe || !openPipe || openPipe.h <= closedPipe.h) {
    fail(`reflow expand ${closedPipe?.h} -> ${openPipe?.h}`)
  }
  const chips = open.field.ops.filter((op) => op.op === 'CHIP')
  if (chips.some((c) => c.h > PIPE_ROWS + 30)) fail(`overlay cover chip h ${chips.map((c) => c.h).join(',')}`)
  if (!open.field.ops.some((op) => op.op === 'OVAL')) fail('oval select')
  if (!open.field.ops.some((op) => op.op === 'GLYPH' && op.text === 'overlay leftover')) {
    fail('expand body type')
  }
  if (open.field.ops.some((op) => op.op === 'GLYPH' && op.text.includes('........'))) {
    fail('cics body leaders still live')
  }
  if (open.field.ops.some((op) => (op.op === 'GLYPH' || op.op === 'CHIP') && /#\d+/.test(op.text))) {
    fail('id ledger still live')
  }
  if (open.field.ops.some((op) => (op.op === 'GLYPH' || op.op === 'CHIP') && /^\[ \]|\[X\]/.test(op.text))) {
    fail('checkbox ledger still live')
  }
  if (!open.field.ops.some((op) => op.op === 'CHIP' && op.text === 'ACTIVE')) {
    fail('status chip')
  }

  const tapped = applyHit(
    { kind: 'NODE', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 102 },
    freshSession(),
    SEED_SOURCE,
  )
  if (tapped.session.pipeOpen !== 102 || tapped.session.field?.slot !== 'title') fail('tap node expand field')

  const dismissed = applyHit(
    { kind: 'FIELD', x: 0, y: 0, w: 10, h: 10, z: 0 },
    tapped.session,
    SEED_SOURCE,
  )
  if (dismissed.session.pipeOpen != null || dismissed.session.field) fail('field tap collapse')

  const shoveHit = applyHit(
    { kind: 'SHOVEL', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 104 },
    freshSession(),
    SEED_SOURCE,
  )
  if (byId(parseDoc(shoveHit.source), 104)?.status !== 'active') fail('hit shovel')

  const addHit = applyHit(
    { kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 10 },
    freshSession(),
    SEED_SOURCE,
  )
  const added = parseDoc(addHit.source)
  const newKids = childrenOf(added, 10)
  if (newKids.length < 2) fail('nest add child')
  if (addHit.session.field?.slot !== 'title' || addHit.session.draftId == null) fail('add opens field')

  const fold = applyHit(
    { kind: 'TOGGLE', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 10 },
    freshSession(),
    SEED_SOURCE,
  )
  if (!fold.session.nestClosed.includes(10)) fail('nest collapse')

  const tab0 = applyHit(
    { kind: 'NODE', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 102 },
    freshSession(),
    SEED_SOURCE,
  )
  if (tab0.session.field?.slot !== 'title') fail('tab0 title')
  const tab1 = cycleField(tab0.session, tab0.source, 1)
  if (tab1.session.field?.slot !== 'body') fail(`tab1 ${tab1.session.field?.slot}`)
  const tab2 = cycleField(tab1.session, tab1.source, 1)
  if (tab2.session.field?.slot !== 'subtask') fail(`tab2 ${tab2.session.field?.slot}`)
  const tab3 = cycleField(tab2.session, tab2.source, 1)
  if (tab3.session.field?.slot !== 'status') fail(`tab3 ${tab3.session.field?.slot}`)

  const esc = applyKey('Escape', false, tab3.session, tab3.source)
  if (esc.session.pipeOpen != null || esc.session.field) fail('esc collapse')

  const focused = commitLine('FOCUS 20', { ...freshSession(), selected: { kind: 'NODE', id: 20 } }, SEED_SOURCE)
  if (focused.session.nestFocus !== 20) fail('FOCUS 20')
  const filtered = compile(
    { ...world, session: { ...freshSession(), nestFocus: 20, lens: 'pipe' } },
    measure,
  ).field
  if (filtered.hits.some((h) => h.kind === 'NODE' && h.payload === 104)) fail('focus filter still shows ops task')
  if (!filtered.hits.some((h) => h.kind === 'NODE' && h.payload === 102)) fail('focus filter hides net task')

  const indent = applyKey(
    'Tab',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: 104 }, lens: 'nest' },
    SEED_SOURCE,
  )
  if (byId(parseDoc(indent.source), 104)?.parent !== 20) fail(`indent ${byId(parseDoc(indent.source), 104)?.parent}`)

  const emptyHit = applyHit(
    { kind: 'EMPTY', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 'backlog' },
    freshSession(),
    SEED_SOURCE,
  )
  const created = parseDoc(emptyHit.source).nodes.find((n) => n.id === emptyHit.session.draftId)
  if (!created || created.status !== 'backlog') fail('empty row create')

  const close = applyHit(
    { kind: 'CLOSE', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 'DUMP' },
    freshSession(),
    SEED_SOURCE,
  )
  if (!close.session.collapsed.includes('DUMP')) fail('organ close')

  const invOff = applyHit(
    { kind: 'LEGEND', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 'INV' },
    freshSession(),
    SEED_SOURCE,
  )
  if (parseDoc(invOff.source).inv) fail('toggle INV off')
  const grainOff = applyHit(
    { kind: 'LEGEND', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 'GRAIN' },
    freshSession(),
    SEED_SOURCE,
  )
  if (parseDoc(grainOff.source).grain !== 0) fail('toggle GRAIN')
  const dayHit = applyHit(
    { kind: 'DAY', x: 0, y: 0, w: 10, h: 10, z: 16, payload: '09.07.26' },
    freshSession(),
    SEED_SOURCE,
  )
  if (dayHit.session.calDay !== '09.07.26') fail('cal day')
  const closeSkull = applyHit(
    { kind: 'CLOSE', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 'SKULL' },
    freshSession(),
    SEED_SOURCE,
  )
  if (!closeSkull.session.collapsed.includes('SKULL')) fail('skull close')
  const dockHits = compile(world, measure).dock.hits
  if (!dockHits.some((h) => h.kind === 'LEGEND' && h.payload === 'GRAIN')) fail('legend grain')
  if (dockHits.some((h) => h.kind === 'DOCK') === false) fail('dock hit')

  const pipeAt = doc.places.find((p) => p.organ === 'PIPE')
  const nestAt = doc.places.find((p) => p.organ === 'NEST')
  if (!pipeAt || !nestAt || (pipeAt.x === nestAt.x && pipeAt.y === nestAt.y)) {
    fail(`seed unfold PLACE PIPE ${pipeAt?.x},${pipeAt?.y} NEST ${nestAt?.x},${nestAt?.y}`)
  }

  const hitchSrc = `${SEED_SOURCE.replace(
    'NOTE 09.07.26 "ridge"',
    'NOTE 09.07.26 "ridge"\n  NOTE 09.07.26 NODE 102 "hitch leftover"',
  )}`
  const hitchDoc = parseDoc(hitchSrc)
  const hitch = hitchDoc.notes.find((n) => n.text === 'hitch leftover')
  if (!hitch || hitch.node !== 102 || hitch.date !== '09.07.26') fail(`hitch parse ${JSON.stringify(hitch)}`)
  const hitchRound = parseDoc(serializeDoc(hitchDoc)).notes.find((n) => n.text === 'hitch leftover')
  if (!hitchRound || hitchRound.node !== 102) fail('hitch serialize')
  if (!serializeDoc(hitchDoc).includes('NOTE 09.07.26 NODE 102')) fail('hitch source NODE')

  const hitchOpen = compile(
    {
      ...world,
      source: hitchSrc,
      session: { ...freshSession(), selected: { kind: 'NODE', id: 102 }, pipeOpen: 102, lens: 'pipe' },
    },
    measure,
  ).field
  if (hitchOpen.ops.some((op) => op.op === 'GLYPH' && op.text.includes('09.07.26') && op.text.includes('hitch leftover'))) {
    fail('expand hitch identity')
  }
  const hitchCal = hitchOpen.ops.some((op) => op.op === 'LINE' && op.color === POWER && op.width === 2)
  if (!hitchCal) fail('hitch still underlines CAL')

  function withNestPlace(x: number, y: number): string {
    const d = parseDoc(SEED_SOURCE)
    const nest = d.places.find((p) => p.organ === 'NEST')
    if (nest) {
      nest.x = x
      nest.y = y
    }
    return serializeDoc(d)
  }

  const seedPlaques = texts.filter((t) => /^(PIPE|NEST) \/\//.test(t))
  if (seedPlaques.length !== 2) fail(`two windows ${seedPlaques.join('|')}`)
  if (field.hits.some((h) => h.kind === 'LENS')) fail('lens ticks still live')

  const coincidentSrc = withNestPlace(pipeAt?.x ?? 24, pipeAt?.y ?? 48)
  const coincidentField = compile({ ...world, source: coincidentSrc }, measure).field
  const coincidentTexts = coincidentField.ops.filter((op) => op.op === 'GLYPH' || op.op === 'STEM').map((op) => op.text)
  const coincidentPlaques = coincidentTexts.filter((t) => /^(PIPE|NEST) \/\//.test(t))
  if (coincidentPlaques.length !== 2) fail(`overlap still two windows ${coincidentPlaques.join('|')}`)
  if (coincidentField.hits.some((h) => h.kind === 'LENS')) fail('coincident fold ticks')

  const closePipe = applyHit(
    { kind: 'CLOSE', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 'PIPE' },
    freshSession(),
    coincidentSrc,
  )
  if (!closePipe.session.collapsed.includes('PIPE') || closePipe.session.collapsed.includes('NEST')) {
    fail(`pipe close ${closePipe.session.collapsed.join('|')}`)
  }

  const dragged = placeOrgan(coincidentSrc, 'PIPE', 40, 60)
  const draggedDoc = parseDoc(dragged)
  const draggedPipe = draggedDoc.places.find((p) => p.organ === 'PIPE')
  const draggedNest = draggedDoc.places.find((p) => p.organ === 'NEST')
  if (!draggedPipe || draggedPipe.x !== 40 || draggedPipe.y !== 60) fail('drag PIPE')
  else if (!draggedNest || (draggedNest.x === draggedPipe.x && draggedNest.y === draggedPipe.y)) {
    fail('drag PIPE moved NEST')
  }

  const down = applyKey(
    'ArrowDown',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: 104 }, lens: 'pipe' },
    SEED_SOURCE,
  )
  if (down.session.selected?.kind !== 'NODE' || down.session.selected.id !== 102) {
    fail(`arrow down ${JSON.stringify(down.session.selected)}`)
  }
  const up = applyKey('ArrowUp', false, down.session, SEED_SOURCE)
  if (up.session.selected?.kind !== 'NODE' || up.session.selected.id !== 104) {
    fail(`arrow up ${JSON.stringify(up.session.selected)}`)
  }

  return fails
}
