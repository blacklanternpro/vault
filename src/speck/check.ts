import { parse, isCommandLine, parseCommand } from './parse'
import { lex } from './lex'
import { freshSession } from './machine'
import { see } from './see'
import { EMPTY_SNAPSHOT } from '../lib/vault-types'

const EXAMPLE = `SEAL reindustrialize
CAL cram AUG '26
  DAY 11 STRIKE
  CHIP "FLUSH RESOLVERS"
NEST ops/ URGENT
  STEM net/ flush_stale_resolvers.sh
DUMP 08.12.26 "ridge notes"
DOCK DAY 08.12.26
GRAIN
SCAN`

export function runSpeckChecks(): string[] {
  const fails: string[] = []
  const fail = (msg: string) => fails.push(msg)

  const lines = lex(EXAMPLE)
  if (lines.length < 8) fail(`lex lines ${lines.length}`)

  const { stmts, error } = parse(EXAMPLE)
  if (error) fail(`parse error ${error}`)
  const kinds = stmts.map((s) => s.kind)
  if (kinds[0] !== 'SEAL') fail(`first ${kinds[0]}`)
  const cal = stmts.find((s) => s.kind === 'CAL')
  if (!cal || cal.kind !== 'CAL') fail('missing CAL')
  else {
    if (cal.month !== 'AUG') fail(`month ${cal.month}`)
    if (cal.year !== 26) fail(`year ${cal.year}`)
    if (cal.days.length !== 1 || cal.days[0].n !== 11) fail('DAY 11')
    if (!cal.days[0].strike) fail('DAY STRIKE')
    if (cal.days[0].chips[0] !== 'FLUSH RESOLVERS') fail('CHIP adjacency')
  }
  const nest = stmts.find((s) => s.kind === 'NEST')
  if (!nest || nest.kind !== 'NEST') fail('missing NEST')
  else {
    if (!nest.path.toLowerCase().startsWith('ops')) fail(`nest path ${nest.path}`)
    if (!nest.flags.includes('URGENT')) fail('NEST URGENT')
    if (nest.stems.length < 1) fail('STEM missing')
  }
  const dump = stmts.find((s) => s.kind === 'DUMP')
  if (!dump || dump.kind !== 'DUMP' || dump.date !== '08.12.26') fail('DUMP date')
  if (!stmts.some((s) => s.kind === 'GRAIN') || !stmts.some((s) => s.kind === 'SCAN')) {
    fail('GRAIN/SCAN')
  }

  if (!isCommandLine('INV')) fail('INV command')
  if (!isCommandLine('DAY 11')) fail('DAY command')
  if (!isCommandLine('SEE')) fail('SEE command')
  if (isCommandLine('FLUSH RESOLVERS')) fail('data classified as command')
  if (parseCommand('INV').kind !== 'INV') fail('parse INV')
  if (parseCommand('DAY 11').kind !== 'DAY_SELECT') fail('parse DAY 11')
  if (parseCommand('WORDS').kind !== 'WORDS') fail('parse WORDS')

  const session = freshSession({ year: 2026, month: 7, day: 12 })
  const src = see(EMPTY_SNAPSHOT, session, { year: 2026, month: 7, day: 12 })
  if (!src.includes('SEAL reindustrialize')) fail('see SEAL')
  if (!src.includes("CAL cram AUG '26")) fail(`see CAL ${src}`)
  if (!src.includes('DOCK DAY')) fail('see DOCK')
  if (!src.includes('GRAIN')) fail('see GRAIN')

  return fails
}
