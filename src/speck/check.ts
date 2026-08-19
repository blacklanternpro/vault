import { compile, PACK_COLS } from './compile'
import { commitLine, freshSession, applyHit } from './machine'
import { monthLength, tapeDate } from './ir'
import { isCommandLine, parse, parseCommand } from './parse'
import { see } from './see'
import { DEFAULT_SOURCE } from './source'

const NOW = { year: 2026, month: 7, day: 19 }

function measure(text: string): number {
  return text.length * 7
}

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  if (monthLength(2026, 7) !== 31) fail('August 2026 days')
  if (Math.ceil(31 / PACK_COLS) !== 5) fail('7-col pack rows')
  if (tapeDate(2026, 7, 19) !== '08.19.26') fail(`tape ${tapeDate(2026, 7, 19)}`)

  const { stmts, error } = parse('DAY 08.19.26 "ridge"\nDAY 08.19.26 "call"')
  if (error) fail(`parse error ${error}`)
  if (stmts.length !== 2) fail(`day stmts ${stmts.length}`)
  if (stmts[0].kind !== 'DAY' || stmts[0].date !== '08.19.26' || stmts[0].text !== 'ridge') {
    fail('parse DAY ridge')
  }

  if (!isCommandLine('SEE')) fail('SEE command')
  if (!isCommandLine('CLEAR')) fail('CLEAR command')
  if (isCommandLine('todo')) fail('todo classified as command')
  if (parseCommand('CLEAR').kind !== 'CLEAR') fail('parse CLEAR')

  const empty = freshSession()
  const missed = commitLine('hello', empty, DEFAULT_SOURCE, NOW)
  if (missed.source !== DEFAULT_SOURCE) fail('note without day')
  if (missed.session.echo !== '? DAY') fail('echo ? DAY')

  const picked = { ...freshSession(), selectedDay: 19 }
  const saved = commitLine('ridge', picked, DEFAULT_SOURCE, NOW)
  if (!saved.source.includes('DAY 08.19.26 "ridge"')) fail(`commit ${saved.source}`)

  const again = commitLine('call', { ...picked, buffer: '' }, saved.source, NOW)
  if (!again.source.includes('DAY 08.19.26 "call"')) fail('second note')

  const world = {
    source: again.source,
    session: { ...picked, notesOpen: false, buffer: '', echo: null },
    now: NOW,
    width: 360,
    viewH: 640,
    caretOn: true,
  }
  const field = compile(world, measure).field
  const lines = field.ops.filter((op) => op.op === 'LINE')
  if (lines.length < 1) fail('underline missing')
  const days = field.ops.filter((op) => op.op === 'GLYPH' && /^\d+$/.test(op.text))
  if (days.length !== 31) fail(`glyphs ${days.length}`)
  const chipsClosed = field.ops.filter((op) => op.op === 'CHIP')
  if (chipsClosed.length !== 0) fail('overlay while closed')

  const open = compile(
    { ...world, session: { ...world.session, notesOpen: true, selectedDay: 19 } },
    measure,
  ).field
  const chips = open.ops.filter((op) => op.op === 'CHIP')
  if (chips.length < 2) fail(`overlay chips ${chips.length}`)

  const bare = compile({ ...world, source: '' }, measure).field
  if (bare.ops.some((op) => op.op === 'LINE')) fail('underline on empty day')
  if (bare.ops.some((op) => op.op === 'SEAL')) fail('seal still paints')

  const hit = applyHit(
    { kind: 'DAY', x: 0, y: 0, w: 10, h: 10, z: 10, payload: 19 },
    picked,
    again.source,
    NOW,
  )
  if (!hit.session.notesOpen || hit.session.selectedDay !== 19) fail('tap noted day')

  const dismissed = applyHit(
    { kind: 'FIELD', x: 0, y: 0, w: 10, h: 10, z: 0 },
    hit.session,
    again.source,
    NOW,
  )
  if (dismissed.session.notesOpen) fail('field tap dismiss')

  const src = see(again.source)
  if (!src.includes('DAY 08.19.26')) fail('see notes')
  if (src.includes('SEAL') || src.includes('NEST') || src.includes('DUMP')) fail('see dead organs')

  const wiped = commitLine('CLEAR', picked, again.source, NOW)
  if (wiped.source !== DEFAULT_SOURCE) fail('CLEAR')

  return fails
}
