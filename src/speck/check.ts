import { byId, childrenOf, managerCards, nestedOf, parseDoc, SEED_SOURCE, serializeDoc } from './doc'
import {
  addNested,
  applyHit,
  applyKey,
  applyNoteOrder,
  commitLine,
  cycleField,
  freshSession,
  pullCard,
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
  if (doc.cols.join(' ') !== 'pending rnd active done dusted') fail(`cols ${doc.cols.join(' ')}`)
  if (doc.inv) fail('parsed INV')
  if (doc.places.some((p) => p.organ === 'CAL' || p.organ === 'SEAL' || p.organ === 'SKULL')) {
    fail('parsed salt places')
  }

  const n104 = byId(doc, 104)
  if (!n104 || n104.status !== 'pending' || n104.parent !== 1 || !n104.title.includes('INGRESS')) {
    fail('node 104 pending under ops')
  }
  const n102 = byId(doc, 102)
  if (!n102 || n102.status !== 'rnd' || n102.parent !== 20 || !n102.loose || n102.body !== 'overlay leftover') {
    fail('node 102 loose rnd under net')
  }
  const n11 = byId(doc, 11)
  if (!n11 || !n11.urgent || n11.parent !== 10 || n11.loose) fail('node 11 nested urgent lab')
  if (!doc.notes.some((n) => n.text === 'ridge')) fail('dump ridge')

  const cards = managerCards(doc, 1).map((n) => n.id)
  if (!cards.includes(10) || !cards.includes(102) || !cards.includes(104)) fail(`manager cards ${cards.join(',')}`)
  if (cards.includes(11) || cards.includes(21) || cards.includes(1) || cards.includes(201)) {
    fail(`manager leaked nested ${cards.join(',')}`)
  }
  if (nestedOf(doc, 20).map((n) => n.id).join(',') !== '21') fail('net nested hides loose')

  const archiveCards = managerCards(doc, 2).map((n) => n.id)
  if (archiveCards.join(',') !== '201') fail(`archive cards ${archiveCards.join(',')}`)

  const round = parseDoc(serializeDoc(doc))
  if (round.nodes.length !== doc.nodes.length) fail('serialize nodes')
  if (byId(round, 102)?.body !== 'overlay leftover') fail('serialize body')
  if (byId(round, 104)?.parent !== 1) fail('serialize parent')
  if (!byId(round, 102)?.loose) fail('serialize LOOSE')
  if (!serializeDoc(round).includes('LOOSE')) fail('serialize LOOSE token')
  if (serializeDoc(round).includes('PLACE SEAL')) fail('serialize salt')

  const legacy = parseDoc(`PIPE vault
  COL backlog
  COL staging
NEST
  NODE 9 "old" status backlog
    NODE 8 "gate" status staging
`)
  if (byId(legacy, 9)?.status !== 'pending') fail('legacy backlog')
  if (byId(legacy, 8)?.status !== 'rnd') fail('legacy staging')

  let session = { ...freshSession(), selected: { kind: 'NODE' as const, id: 104 } }
  let result = commitLine('SHOVEL', session, seed)
  let next = byId(parseDoc(result.source), 104)
  if (next?.status !== 'rnd') fail(`shovel1 ${next?.status}`)

  result = commitLine('SHOVEL', session, result.source)
  next = byId(parseDoc(result.source), 104)
  if (next?.status !== 'active') fail(`shovel2 ${next?.status}`)

  result = commitLine('SHOVEL', { ...freshSession(), selected: { kind: 'NODE', id: 99 } }, seed)
  if (byId(parseDoc(result.source), 99)?.status !== 'dusted') fail('shovel done onto dusted')

  const madeNone = applyHit({ kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 2 }, freshSession(), seed)
  const scrapId = madeNone.session.draftId
  if (scrapId == null) fail('add under archive')
  else {
    const scrap = byId(parseDoc(madeNone.source), scrapId)
    if (scrap?.status !== 'pending' || scrap.parent !== 2) fail(`job under project ${scrap?.status} p${scrap?.parent}`)
    const lifted = commitLine('SHOVEL', { ...freshSession(), selected: { kind: 'NODE', id: scrapId } }, madeNone.source)
    if (byId(parseDoc(lifted.source), scrapId)?.status !== 'rnd') fail('shovel pending onto rnd')
  }

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

  const staged = stageCard(freshSession(), seed, 20, 'done')
  if (byId(parseDoc(staged.source), 20)?.status !== 'done') fail('stage job status')
  if (byId(parseDoc(staged.source), 21)?.status !== 'done') fail('stage nested followed')
  if (byId(parseDoc(staged.source), 102)?.status !== 'rnd') fail('stage kept loose satellite')
  if (byId(parseDoc(staged.source), 102)?.parent !== 20) fail('stage kept satellite parent')

  const reordered = stageCard(freshSession(), seed, 104, 'pending', 10)
  const opsKids = childrenOf(parseDoc(reordered.source), 1).map((n) => n.id)
  if (opsKids[0] !== 104) fail(`reorder siblings ${opsKids.join(',')}`)

  const nestedAdd = addNested(freshSession(), seed, 104)
  const nestDoc = parseDoc(nestedAdd.source)
  const nestKids = nestedOf(nestDoc, 104)
  if (nestKids.length !== 1) fail('first nested insert')
  if (byId(nestDoc, 104)?.status !== 'active') fail('first nested promotes pending')
  if (nestKids[0]?.status !== 'active') fail('nested inherits active')

  const pulled = pullCard(freshSession(), seed, 11, 'rnd')
  const pulledNode = byId(parseDoc(pulled.source), 11)
  if (!pulledNode?.loose) fail('pull sets LOOSE')
  if (pulledNode?.status !== 'rnd') fail(`pull status ${pulledNode?.status}`)
  if (pulledNode?.parent !== 10) fail(`pull parent ${pulledNode?.parent}`)
  if (byId(parseDoc(pulled.source), 10)?.status !== 'active') fail('pull left parent')
  const afterPull = managerCards(parseDoc(pulled.source), 1).map((n) => n.id)
  if (!afterPull.includes(11)) fail('pulled satellite is a card')

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
  const newKids = nestedOf(added, 10)
  if (newKids.length < 2) fail('nest add child')
  if (addHit.session.field?.slot !== 'title' || addHit.session.draftId == null) fail('add opens field')
  if (newKids[newKids.length - 1]?.status !== 'active') fail('directory add inherits')

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
    { kind: 'EMPTY', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 'pending' },
    freshSession(),
    seed,
  )
  const created = parseDoc(emptyHit.source).nodes.find((n) => n.id === emptyHit.session.draftId)
  if (!created || created.status !== 'pending' || created.parent !== 1) fail('empty job create')

  const rootAdd = applyHit({ kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 0 }, freshSession(), seed)
  const newRoot = byId(parseDoc(rootAdd.source), rootAdd.session.draftId ?? -1)
  if (!newRoot || newRoot.parent != null || newRoot.status !== 'none') fail('header add project')
  if (rootAdd.session.projectId !== newRoot?.id) fail('header focuses new project')

  const shoveHit = applyHit(
    { kind: 'SHOVEL', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 104 },
    freshSession(),
    seed,
  )
  if (byId(parseDoc(shoveHit.source), 104)?.status !== 'rnd') fail('hit shovel')

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

  if (COL_ORDER.length !== 5) fail('lane count')

  return fails
}
