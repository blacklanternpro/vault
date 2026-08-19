import { parse, isCommandLine, parseCommand } from './parse'
import { lex } from './lex'
import { commitLine, freshSession } from './machine'
import { see } from './see'
import { DEFAULT_SOURCE } from './source'

const EXAMPLE = `SEAL reindustrialize
GLYPH "FLUSH RESOLVERS"
CHIP "OPS"
STEM ops/
  STEM net/ flush_stale_resolvers.sh
GRAIN
SCAN`

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  const lines = lex(EXAMPLE)
  if (lines.length < 6) fail(`lex lines ${lines.length}`)

  const { stmts, error } = parse(EXAMPLE)
  if (error) fail(`parse error ${error}`)
  const kinds = stmts.map((s) => s.kind)
  if (kinds[0] !== 'SEAL') fail(`first ${kinds[0]}`)
  const glyph = stmts.find((s) => s.kind === 'GLYPH')
  if (!glyph || glyph.kind !== 'GLYPH' || glyph.text !== 'FLUSH RESOLVERS') fail('GLYPH')
  const chip = stmts.find((s) => s.kind === 'CHIP')
  if (!chip || chip.kind !== 'CHIP' || chip.text !== 'OPS') fail('CHIP')
  const stems = stmts.filter((s) => s.kind === 'STEM')
  if (stems.length !== 2) fail(`STEM count ${stems.length}`)
  else if (stems[0].kind === 'STEM' && !stems[0].text.toLowerCase().startsWith('ops')) {
    fail(`stem path ${stems[0].text}`)
  }
  if (!stmts.some((s) => s.kind === 'GRAIN') || !stmts.some((s) => s.kind === 'SCAN')) {
    fail('GRAIN/SCAN')
  }

  if (!isCommandLine('INV')) fail('INV command')
  if (!isCommandLine('SEE')) fail('SEE command')
  if (!isCommandLine('CLEAR')) fail('CLEAR command')
  if (!isCommandLine('GLYPH hello')) fail('GLYPH command')
  if (isCommandLine('FLUSH RESOLVERS')) fail('data classified as command')
  if (isCommandLine('todo')) fail('todo classified as command')
  if (isCommandLine('DAY 11')) fail('DAY still a command')
  if (parseCommand('INV').kind !== 'INV') fail('parse INV')
  if (parseCommand('WORDS').kind !== 'WORDS') fail('parse WORDS')
  if (parseCommand('CLEAR').kind !== 'CLEAR') fail('parse CLEAR')

  const session = freshSession()
  const src = see(DEFAULT_SOURCE, session)
  if (!src.includes('SEAL reindustrialize')) fail('see SEAL')
  if (src.includes('CAL')) fail('see still emits CAL')
  if (src.includes('NEST')) fail('see still emits NEST')
  if (src.includes('DUMP')) fail('see still emits DUMP')
  if (!src.includes('GRAIN')) fail('see GRAIN')

  const data = commitLine('todo', session, DEFAULT_SOURCE)
  if (!data.source.includes('GLYPH "todo"')) fail(`data glyph ${data.source}`)

  const painted = commitLine('CHIP "FLUSH"', freshSession(), DEFAULT_SOURCE)
  if (!painted.source.includes('CHIP "FLUSH"')) fail(`chip append ${painted.source}`)

  const wiped = commitLine('CLEAR', freshSession(), data.source)
  if (wiped.source !== DEFAULT_SOURCE) fail('CLEAR')

  return fails
}
