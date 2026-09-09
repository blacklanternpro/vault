import { byId, childrenOf, managerCards, nestedOf, parseDoc, SEED_SOURCE, serializeDoc } from './doc'
import {
  addNested,
  applyHit,
  applyKey,
  applyNoteOrder,
  commitFieldLine,
  commitLine,
  cycleField,
  freshSession,
  hitchNote,
  pullCard,
  dockCard,
  searchFind,
  selectNode,
  stageCard,
  typeField,
} from './machine'
import { COL_ORDER } from './tokens'

const SITE = 1
const PRINT = 2
const HOME = 10
const RAMP = 11
const LOOP = 13
const SPEC = 20
const REPO = 30
const CONTACT = 40
const RUN = 60
const SEED_NOTE = 'type ramp 700 / 400'

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  const seed = SEED_SOURCE
  if (/PLACE\s+(SEAL|SKULL|CAL)/.test(seed)) fail('seed salt PLACE')
  if (/\bINV\b/.test(seed)) fail('seed INV')
  if (/\bGRAIN\b/.test(seed)) fail('seed GRAIN')
  if (/\bSCAN\b/.test(seed)) fail('seed SCAN')
  if (/GLYPH/.test(seed)) fail('seed GLYPH')
  if (/scout ridge|INGRESS|SUPABASE|telemetry overlay|COLD STORAGE|OLD SPIKE|"ops"/.test(seed)) {
    fail('stale ops-room demo')
  }

  const doc = parseDoc(seed)
  if (doc.pipeName !== 'vault') fail(`pipe name ${doc.pipeName}`)
  if (doc.cols.join(' ') !== 'pending rnd active done dusted') fail(`cols ${doc.cols.join(' ')}`)
  if (doc.inv) fail('parsed INV')
  if (doc.places.some((p) => p.organ === 'CAL' || p.organ === 'SEAL' || p.organ === 'SKULL')) {
    fail('parsed salt places')
  }

  const nRepo = byId(doc, REPO)
  if (!nRepo || nRepo.status !== 'pending' || nRepo.parent !== SITE || nRepo.title !== 'REPO') {
    fail('node 30 pending under site')
  }
  const nLoop = byId(doc, LOOP)
  if (!nLoop || nLoop.status !== 'rnd' || nLoop.parent !== HOME || !nLoop.loose || nLoop.body !== '8s loop, no sting') {
    fail('node 13 loose rnd under home')
  }
  const nRamp = byId(doc, RAMP)
  if (!nRamp || !nRamp.urgent || nRamp.parent !== HOME || nRamp.loose) fail('node 11 nested urgent home')
  if (!doc.notes.some((n) => n.text === SEED_NOTE)) fail('dump type ramp')

  const cards = managerCards(doc, SITE).map((n) => n.id)
  if (!cards.includes(HOME) || !cards.includes(LOOP) || !cards.includes(REPO)) fail(`manager cards ${cards.join(',')}`)
  if (cards.includes(RAMP) || cards.includes(12) || cards.includes(SITE) || cards.includes(RUN)) {
    fail(`manager leaked nested ${cards.join(',')}`)
  }
  if (nestedOf(doc, HOME).map((n) => n.id).join(',') !== '11,12') fail('home nested hides loose')

  const printCards = managerCards(doc, PRINT).map((n) => n.id)
  if (printCards.join(',') !== String(RUN)) fail(`print cards ${printCards.join(',')}`)

  const round = parseDoc(serializeDoc(doc))
  if (round.nodes.length !== doc.nodes.length) fail('serialize nodes')
  if (byId(round, LOOP)?.body !== '8s loop, no sting') fail('serialize body')
  if (byId(round, REPO)?.parent !== SITE) fail('serialize parent')
  if (!byId(round, LOOP)?.loose) fail('serialize LOOSE')
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

  let session = { ...freshSession(), selected: { kind: 'NODE' as const, id: REPO } }
  let result = commitLine('SHOVEL', session, seed)
  let next = byId(parseDoc(result.source), REPO)
  if (next?.status !== 'rnd') fail(`shovel1 ${next?.status}`)

  result = commitLine('SHOVEL', session, result.source)
  next = byId(parseDoc(result.source), REPO)
  if (next?.status !== 'active') fail(`shovel2 ${next?.status}`)

  result = commitLine('SHOVEL', { ...freshSession(), selected: { kind: 'NODE', id: CONTACT } }, seed)
  if (byId(parseDoc(result.source), CONTACT)?.status !== 'dusted') fail('shovel done onto dusted')

  const madeNone = applyHit({ kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: PRINT }, freshSession(), seed)
  const scrapId = madeNone.session.draftId
  if (scrapId == null) fail('add under print')
  else {
    const scrap = byId(parseDoc(madeNone.source), scrapId)
    if (scrap?.status !== 'pending' || scrap.parent !== PRINT) fail(`job under project ${scrap?.status} p${scrap?.parent}`)
    const lifted = commitLine('SHOVEL', { ...freshSession(), selected: { kind: 'NODE', id: scrapId } }, madeNone.source)
    if (byId(parseDoc(lifted.source), scrapId)?.status !== 'rnd') fail('shovel pending onto rnd')
  }

  result = commitLine(
    'HOME PAGE, lock type ramp, crop hero still, open repo',
    freshSession(),
    seed,
  )
  const dumped = parseDoc(result.source)
  if (dumped.nodes.length !== parseDoc(seed).nodes.length) fail('dock dump created nodes')
  if (result.session.find !== 'HOME PAGE, lock type ramp, crop hero still, open repo') {
    fail(`dock find ${result.session.find}`)
  }
  if (result.session.echo !== 'FIND _') fail(`dock dump echo ${result.session.echo}`)

  result = commitLine('FIND loop', freshSession(), seed)
  if (result.session.find !== 'loop') fail(`FIND query ${result.session.find}`)
  if (result.session.echo !== 'FIND 1') fail(`FIND echo ${result.session.echo}`)
  if (result.session.selected?.kind !== 'NODE' || result.session.selected.id !== LOOP) fail('FIND selects still loop')

  result = commitLine('NOTE scratch line', { ...freshSession(), lens: 'pipe' }, seed)
  if (!parseDoc(result.source).notes.some((n) => n.text === 'scratch line')) fail('NOTE append')

  const dumpLive = commitLine('from dump', { ...freshSession(), lens: 'dump', selected: { kind: 'DUMP' } }, seed)
  if (!parseDoc(dumpLive.source).notes.some((n) => n.text === 'from dump')) fail('dump lens note')
  if (parseDoc(dumpLive.source).nodes.length !== parseDoc(seed).nodes.length) fail('dump lens created nodes')

  result = commitLine('CLEAR', freshSession(), result.source)
  if (parseDoc(result.source).pipeName !== 'vault') fail('CLEAR seed')
  if (!byId(parseDoc(result.source), REPO)) fail('CLEAR nodes')
  if (/PLACE\s+CAL/.test(result.source)) fail('CLEAR restored CAL')

  const staged = stageCard(freshSession(), seed, HOME, 'done')
  if (byId(parseDoc(staged.source), HOME)?.status !== 'done') fail('stage job status')
  if (byId(parseDoc(staged.source), RAMP)?.status !== 'done') fail('stage nested followed')
  if (byId(parseDoc(staged.source), LOOP)?.status !== 'rnd') fail('stage kept loose satellite')
  if (byId(parseDoc(staged.source), LOOP)?.parent !== HOME) fail('stage kept satellite parent')

  const reordered = stageCard(freshSession(), seed, REPO, 'pending', HOME)
  const siteKids = childrenOf(parseDoc(reordered.source), SITE).map((n) => n.id)
  if (siteKids[0] !== REPO) fail(`reorder siblings ${siteKids.join(',')}`)

  const nestedAdd = addNested(freshSession(), seed, REPO)
  const nestDraft = parseDoc(nestedAdd.source)
  const nestKids = nestedOf(nestDraft, REPO)
  if (nestKids.length !== 1) fail('first nested insert')
  if (byId(nestDraft, REPO)?.status !== 'pending') fail('draft nested stays pending')
  const named = commitFieldLine({ ...nestedAdd.session, fieldBuffer: 'open git remote' }, nestedAdd.source)
  const namedDoc = parseDoc(named.source)
  if (byId(namedDoc, REPO)?.status !== 'active') fail('first nested commit promotes pending')
  if (nestedOf(namedDoc, REPO)[0]?.status !== 'active') fail('nested inherits active')

  const pulled = pullCard(freshSession(), seed, RAMP, 'rnd')
  const pulledNode = byId(parseDoc(pulled.source), RAMP)
  if (!pulledNode?.loose) fail('pull sets LOOSE')
  if (pulledNode?.status !== 'rnd') fail(`pull status ${pulledNode?.status}`)
  if (pulledNode?.parent !== HOME) fail(`pull parent ${pulledNode?.parent}`)
  if (byId(parseDoc(pulled.source), HOME)?.status !== 'active') fail('pull left parent')
  const afterPull = managerCards(parseDoc(pulled.source), SITE).map((n) => n.id)
  if (!afterPull.includes(RAMP)) fail('pulled satellite is a card')

  const withNote = commitLine('NOTE second', { ...freshSession(), lens: 'pipe' }, seed)
  const moved = applyNoteOrder(freshSession(), withNote.source, 1, 0)
  const notes = parseDoc(moved.source).notes.map((n) => n.text)
  if (notes[0] !== 'second' || notes[1] !== SEED_NOTE) fail(`note reorder ${notes.join('|')}`)
  if (!serializeDoc(parseDoc(moved.source)).includes('NOTE') || notes.length !== 2) fail('note reorder serialize')

  const addHit = applyHit(
    { kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: HOME },
    freshSession(),
    seed,
  )
  const added = parseDoc(addHit.source)
  const newKids = nestedOf(added, HOME)
  if (newKids.length < 3) fail('nest add child')
  if (addHit.session.field?.slot !== 'title' || addHit.session.draftId == null) fail('add opens field')
  if (newKids[newKids.length - 1]?.status !== 'active') fail('directory add inherits')

  const fold = applyHit(
    { kind: 'TOGGLE', x: 0, y: 0, w: 10, h: 10, z: 20, payload: HOME },
    freshSession(),
    seed,
  )
  if (!fold.session.nestClosed.includes(HOME)) fail('nest collapse')

  const tab0 = applyHit(
    { kind: 'NODE', x: 0, y: 0, w: 10, h: 10, z: 10, payload: LOOP },
    freshSession(),
    seed,
  )
  if (tab0.session.pipeOpen !== LOOP || tab0.session.field) fail(`folio open ${tab0.session.pipeOpen} ${tab0.session.field?.slot}`)
  const tabTitle = applyHit(
    { kind: 'SLOT', x: 0, y: 0, w: 10, h: 10, z: 10, payload: `${LOOP}:title` },
    tab0.session,
    tab0.source,
  )
  if (tabTitle.session.field?.slot !== 'title') fail('tab0 title')
  const tab1 = cycleField(tabTitle.session, tabTitle.source, 1)
  if (tab1.session.field?.slot !== 'body') fail(`tab1 ${tab1.session.field?.slot}`)
  const tab2 = cycleField(tab1.session, tab1.source, 1)
  if (tab2.session.field?.slot !== 'subtask') fail(`tab2 ${tab2.session.field?.slot}`)
  const tab3 = cycleField(tab2.session, tab2.source, 1)
  if (tab3.session.field?.slot !== 'status') fail(`tab3 ${tab3.session.field?.slot}`)

  const esc = applyKey('Escape', false, tab3.session, tab3.source)
  if (esc.session.pipeOpen != null || esc.session.field) fail('esc collapse')

  const focused = commitLine(`FOCUS ${HOME}`, { ...freshSession(), selected: { kind: 'NODE', id: HOME } }, seed)
  if (focused.session.nestFocus !== HOME) fail(`FOCUS ${HOME}`)

  const indent = applyKey(
    'Tab',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: REPO }, lens: 'nest' },
    seed,
  )
  if (byId(parseDoc(indent.source), REPO)?.parent !== SPEC) fail(`indent ${byId(parseDoc(indent.source), REPO)?.parent}`)

  const emptyHit = applyHit(
    { kind: 'EMPTY', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 'pending' },
    freshSession(),
    seed,
  )
  const created = parseDoc(emptyHit.source).nodes.find((n) => n.id === emptyHit.session.draftId)
  if (!created || created.status !== 'pending' || created.parent !== SITE) fail('empty job create')

  const rootAdd = applyHit({ kind: 'ADD', x: 0, y: 0, w: 10, h: 10, z: 20, payload: 0 }, freshSession(), seed)
  const newRoot = byId(parseDoc(rootAdd.source), rootAdd.session.draftId ?? -1)
  if (!newRoot || newRoot.parent != null || newRoot.status !== 'none') fail('header add project')
  if (rootAdd.session.projectId !== newRoot?.id) fail('header focuses new project')

  const shoveHit = applyHit(
    { kind: 'SHOVEL', x: 0, y: 0, w: 10, h: 10, z: 20, payload: REPO },
    freshSession(),
    seed,
  )
  if (byId(parseDoc(shoveHit.source), REPO)?.status !== 'rnd') fail('hit shovel')

  const hitchSrc = `${seed.replace(
    `NOTE 09.09.26 "${SEED_NOTE}"`,
    `NOTE 09.09.26 "${SEED_NOTE}"\n  NOTE 09.09.26 NODE ${LOOP} "hitch leftover"`,
  )}`
  const hitchDoc = parseDoc(hitchSrc)
  const hitch = hitchDoc.notes.find((n) => n.text === 'hitch leftover')
  if (!hitch || hitch.node !== LOOP || hitch.date !== '09.09.26') fail(`hitch parse ${JSON.stringify(hitch)}`)
  const hitchRound = parseDoc(serializeDoc(hitchDoc)).notes.find((n) => n.text === 'hitch leftover')
  if (!hitchRound || hitchRound.node !== LOOP) fail('hitch serialize')
  if (!serializeDoc(hitchDoc).includes(`NOTE 09.09.26 NODE ${LOOP}`)) fail('hitch source NODE')

  if (COL_ORDER.length !== 5) fail('lane count')

  const bodyHit = applyHit(
    { kind: 'SLOT', x: 0, y: 0, w: 10, h: 10, z: 10, payload: `${LOOP}:body` },
    freshSession(),
    seed,
  )
  if (bodyHit.session.field?.slot !== 'body' || bodyHit.session.field.id !== LOOP) fail('body slot')
  const bodySaved = commitFieldLine(typeField(bodyHit.session, 'new sting'), bodyHit.source)
  if (byId(parseDoc(bodySaved.source), LOOP)?.body !== 'new sting') fail('body write')

  const hitchLive = hitchNote(freshSession(), seed, 0, HOME)
  const hitchNote0 = parseDoc(hitchLive.source).notes[0]
  if (hitchNote0?.node !== HOME || hitchNote0.text !== SEED_NOTE) fail(`hitch live ${JSON.stringify(hitchNote0)}`)
  if (!serializeDoc(parseDoc(hitchLive.source)).includes(`NOTE 09.09.26 NODE ${HOME}`)) fail('hitch live serialize')
  const unhitched = hitchNote(freshSession(), hitchLive.source, 0, null)
  if (parseDoc(unhitched.source).notes[0]?.node != null) fail('unhitch')

  const killed = applyKey(
    'Backspace',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: RAMP } },
    hitchLive.source,
  )
  if (byId(parseDoc(killed.source), RAMP)) fail('kill nested')
  if (byId(parseDoc(killed.source), HOME)) {
    /* parent stays */
  } else fail('kill left parent')
  const delRepo = applyKey(
    'Delete',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: REPO } },
    seed,
  )
  if (byId(parseDoc(delRepo.source), REPO)) fail('kill job')
  const keepRoot = applyKey(
    'Backspace',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: SITE } },
    seed,
  )
  if (!byId(parseDoc(keepRoot.source), SITE) || !byId(parseDoc(keepRoot.source), HOME)) fail('kill skipped project')

  const hitchThenKill = hitchNote(freshSession(), seed, 0, REPO)
  const afterKillHitch = applyKey(
    'Backspace',
    false,
    { ...freshSession(), selected: { kind: 'NODE', id: REPO } },
    hitchThenKill.source,
  )
  if (parseDoc(afterKillHitch.source).notes[0]?.node != null) fail('kill cleared hitch')

  const pulledThenDock = dockCard(freshSession(), pulled.source, RAMP, HOME)
  const dockedRamp = byId(parseDoc(pulledThenDock.source), RAMP)
  if (dockedRamp?.loose) fail('dock clears LOOSE')
  if (dockedRamp?.parent !== HOME) fail(`dock parent ${dockedRamp?.parent}`)
  if (!nestedOf(parseDoc(pulledThenDock.source), HOME).some((n) => n.id === RAMP)) fail('dock nested again')
  if (managerCards(parseDoc(pulledThenDock.source), SITE).some((n) => n.id === RAMP)) fail('dock left the rack')
  if (/NODE 11[^\n]*LOOSE/.test(serializeDoc(parseDoc(pulledThenDock.source)))) fail('dock serialize LOOSE')

  const loopDock = dockCard(freshSession(), seed, LOOP, HOME)
  if (byId(parseDoc(loopDock.source), LOOP)?.loose) fail('dock seed satellite')
  if (!nestedOf(parseDoc(loopDock.source), HOME).some((n) => n.id === LOOP)) fail('dock loop boxed')

  const picked = selectNode(freshSession(), seed, REPO)
  if (picked.session.selected?.kind !== 'NODE' || picked.session.selected.id !== REPO) fail('select node')
  if (picked.session.field) fail('select opened field')
  if (picked.session.pipeOpen != null) fail('select opened folio')

  const homeFolio = applyHit(
    { kind: 'NODE', x: 0, y: 0, w: 10, h: 10, z: 10, payload: HOME },
    freshSession(),
    seed,
  )
  if (homeFolio.session.pipeOpen !== HOME || homeFolio.session.field) fail('home folio')

  const searched = searchFind(freshSession(), seed, 'loop')
  if (searched.session.find !== 'loop') fail(`searchFind ${searched.session.find}`)
  if (searched.session.selected?.kind !== 'NODE' || searched.session.selected.id !== LOOP) fail('searchFind select')
  const noteCount = parseDoc(seed).notes.length
  const searchNote = searchFind(freshSession(), seed, 'NOTE should not append')
  if (parseDoc(searchNote.source).notes.length !== noteCount) fail('FIND created a note')

  return fails
}
