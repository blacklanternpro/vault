import { byId, childrenOf, parseDoc, SEED_SOURCE, serializeDoc } from './doc'
import {
  applyHit,
  applyKey,
  applyNoteOrder,
  commitLine,
  cycleField,
  freshSession,
  stageCard,
} from './machine'
import { COL_ORDER } from './tokens'

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  const seed = SEED_SOURCE
  if (/PLACE\s+(SEAL|SKULL|CAL)/.test(seed)) fail('seed salt PLACE')
  if (/\bINV\b/.test(seed)) fail('seed INV')
  if (/\bGRAIN\b/.test(seed)) fail('seed GRAIN')
  if (/\bSCAN\b/.test(seed)) fail('seed SCAN')
  if (/GLYPH/.test(seed)) fail('seed GLYPH')

  const doc = parseDoc(seed)
  if (doc.pipeName !== 'vault') fail(`pipe name ${doc.pipeName}`)
  if (doc.cols.join(' ') !== 'backlog active staging done') fail(`cols ${doc.cols.join(' ')}`)
  if (doc.inv) fail('parsed INV')
  if (doc.places.some((p) => p.organ === 'CAL' || p.organ === 'SEAL' || p.organ === 'SKULL')) {
    fail('parsed salt places')
  }

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

  const round = parseDoc(serializeDoc(doc))
  if (round.nodes.length !== doc.nodes.length) fail('serialize nodes')
  if (byId(round, 102)?.body !== 'overlay leftover') fail('serialize body')
  if (byId(round, 104)?.parent !== 1) fail('serialize parent')
  if (serializeDoc(round).includes('PLACE SEAL')) fail('serialize salt')

  let session = { ...freshSession(), selected: { kind: 'NODE' as const, id: 104 } }
  let result = commitLine('SHOVEL', session, seed)
  let next = byId(parseDoc(result.source), 104)
  if (next?.status !== 'active') fail(`shovel1 ${next?.status}`)

  result = commitLine('SHOVEL', session, result.source)
  next = byId(parseDoc(result.source), 104)
  if (next?.status !== 'staging') fail(`shovel2 ${next?.status}`)

  result = commitLine('SHOVEL', { ...freshSession(), selected: { kind: 'NODE', id: 11 } }, seed)
  if (byId(parseDoc(result.source), 11)?.status !== 'backlog') fail('shovel none onto backlog')

  result = commitLine(
    'new website project, site redesign of homepage, need to assess aesthetic, create repo',
    freshSession(),
    seed,
  )
  const dumped = parseDoc(result.source)
  if (dumped.nodes.length !== parseDoc(seed).nodes.length) fail('dock dump created nodes')
  if (result.session.find !== 'new website project, site redesign of homepage, need to assess aesthetic, create repo') {
    fail(`dock find ${result.session.find}`)
  }
  if (result.session.echo !== 'FIND _') fail(`dock dump echo ${result.session.echo}`)

  result = commitLine('FIND telemetry', freshSession(), seed)
  if (result.session.find !== 'telemetry') fail(`FIND query ${result.session.find}`)
  if (result.session.echo !== 'FIND 1') fail(`FIND echo ${result.session.echo}`)
  if (result.session.selected?.kind !== 'NODE' || result.session.selected.id !== 102) fail('FIND selects telemetry')

  result = commitLine('NOTE scratch line', { ...freshSession(), lens: 'pipe' }, seed)
  if (!parseDoc(result.source).notes.some((n) => n.text === 'scratch line')) fail('NOTE append')

  const dumpLive = commitLine('from dump', { ...freshSession(), lens: 'dump', selected: { kind: 'DUMP' } }, seed)
  if (!parseDoc(dumpLive.source).notes.some((n) => n.text === 'from dump')) fail('dump lens note')
  if (parseDoc(dumpLive.source).nodes.length !== parseDoc(seed).nodes.length) fail('dump lens created nodes')

  result = commitLine('CLEAR', freshSession(), result.source)
  if (parseDoc(result.source).pipeName !== 'vault') fail('CLEAR seed')
  if (!byId(parseDoc(result.source), 104)) fail('CLEAR nodes')
  if (/PLACE\s+CAL/.test(result.source)) fail('CLEAR restored CAL')

  const staged = stageCard(freshSession(), seed, 1, 'active')
  if (byId(parseDoc(staged.source), 1)?.status !== 'active') fail('stage project status')
  if (byId(parseDoc(staged.source), 104)?.status !== 'backlog') fail('stage kept child status')

  const reordered = stageCard(freshSession(), seed, 104, 'backlog', 10)
  const opsKids = childrenOf(parseDoc(reordered.source), 1).map((n) => n.id)
  if (opsKids[0] !== 104) fail(`reorder siblings ${opsKids.join(',')}`)

  const withNote = commitLine('NOTE second', { ...freshSession(), lens: 'pipe' }, seed)
  const moved = applyNoteOrder(freshSession(), withNote.source, 1, 0)
  const notes = parseDoc(moved.source).notes.map((n) => n.text)
  if (notes[0] !== 'second' || notes[1] !== 'ridge') fail(`note reorder ${notes.join('|')}`)
  if (!serializeDoc(parseDoc(moved.source)).includes('NOTE') || notes.length !== 2) fail('note reorder serialize')

  const addHit = applyHit(
    { kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 10 },
    freshSession(),
    seed,
  )
  const added = parseDoc(addHit.source)
  const newKids = childrenOf(added, 10)
  if (newKids.length < 2) fail('nest add child')
  if (addHit.session.field?.slot !== 'title' || addHit.session.draftId == null) fail('add opens field')

  const fold = applyHit(
    { kind: 'TOGGLE', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 10 },
    freshSession(),
    seed,
  )
  if (!fold.session.nestClosed.includes(10)) fail('nest collapse')

  const tab0 = applyHit(
    { kind: 'NODE', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 102 },
    freshSession(),
    seed,
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

  const focused = commitLine('FOCUS 20', { ...freshSession(), selected: { kind: 'NODE', id: 20 } }, seed)
  if (focused.session.nestFocus !== 20) fail('FOCUS 20')

  const indent = applyKey(
    'Tab',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: 104 }, lens: 'nest' },
    seed,
  )
  if (byId(parseDoc(indent.source), 104)?.parent !== 20) fail(`indent ${byId(parseDoc(indent.source), 104)?.parent}`)

  const emptyHit = applyHit(
    { kind: 'EMPTY', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 'backlog' },
    freshSession(),
    seed,
  )
  const created = parseDoc(emptyHit.source).nodes.find((n) => n.id === emptyHit.session.draftId)
  if (!created || created.status !== 'backlog') fail('empty row create')

  const shoveHit = applyHit(
    { kind: 'SHOVEL', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 104 },
    freshSession(),
    seed,
  )
  if (byId(parseDoc(shoveHit.source), 104)?.status !== 'active') fail('hit shovel')

  const hitchSrc = `${seed.replace(
    'NOTE 09.07.26 "ridge"',
    'NOTE 09.07.26 "ridge"\n  NOTE 09.07.26 NODE 102 "hitch leftover"',
  )}`
  const hitchDoc = parseDoc(hitchSrc)
  const hitch = hitchDoc.notes.find((n) => n.text === 'hitch leftover')
  if (!hitch || hitch.node !== 102 || hitch.date !== '09.07.26') fail(`hitch parse ${JSON.stringify(hitch)}`)
  const hitchRound = parseDoc(serializeDoc(hitchDoc)).notes.find((n) => n.text === 'hitch leftover')
  if (!hitchRound || hitchRound.node !== 102) fail('hitch serialize')
  if (!serializeDoc(hitchDoc).includes('NOTE 09.07.26 NODE 102')) fail('hitch source NODE')

  if (COL_ORDER.length !== 4) fail('lane count')

  return fails
}
