import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { addNode, logEvent, updateNode } from '../../src/model/doc'
import { seedDoc } from '../../src/model/seed'
import type { Doc } from '../../src/model/types'
import { FileStore } from '../src/store'

/*
 * The seed board, with the fields the agent cares about filled in on
 * SITE REDESIGN (#2). Seed ids, for reference:
 *   1 homepage: 2 SITE REDESIGN (3,4 done; 5 Create wireframes, 6 Design high-fidelity mockups, 7 Add motion prototypes), 8 NAV RESTRUCTURE
 *   9 brand: 10 UPDATE BRANDING, 11 DESIGN EXPLORATION
 *   12 research: 13 MARKET RESEARCH, 14 TECH SPIKE
 *   15 vault-worldwide: 16 17 18 done, 19 AESTHETIC PASS
 *   20 archive: 21 OLD LANDING PAGE (dusted)
 *   22 "Mobile layout" nested under 5
 */
export const T0 = Date.UTC(2026, 10, 1, 12, 0, 0)

export function fixtureDoc(): Doc {
  let doc = seedDoc()
  doc = updateNode(doc, 2, {
    due: '2026-11-05',
    next: 'Create wireframes',
    leftOff: 'Hero section half drawn',
    links: [{ label: 'repo', url: 'https://github.com/blacklanternpro/vault' }],
    urgent: true,
    tonight: true,
    touched: T0,
  })
  doc = addNode(doc, { parent: 5, title: 'Mobile layout' }).doc
  for (let i = 0; i < 10; i++) doc = logEvent(doc, 'note', `older ${i}`, 2, T0 - (20 - i) * 60_000)
  doc = logEvent(doc, 'ticked', 'Define new information hierarchy', 2, T0 - 5 * 60_000)
  doc = logEvent(doc, 'moved', 'moved to ACTIVE', 2, T0 - 60_000)
  return doc
}

export type Fixture = { dir: string; store: FileStore; doc: Doc; cleanup: () => void }

export function makeStore(doc: Doc | null = fixtureDoc(), savedAt = T0): Fixture {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-agent-'))
  const store = new FileStore(path.join(dir, 'vault.json'))
  if (doc) store.write(doc, savedAt)
  return { dir, store, doc: doc ?? store.read().doc, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) }
}
