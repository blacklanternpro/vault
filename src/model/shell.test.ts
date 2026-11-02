import { describe, expect, it } from 'vitest'
import { byId, childrenOf, depthOf, reparentNode, sanitizeDoc } from './doc'
import { seedDoc } from './seed'
import { completePath, laneFrom, listing, paletteKind, paletteRows, parseFilters, pathOf, resolvePath, runShell, tokenize } from './shell'
import type { Doc } from './types'

/*
 * Seed ids: homepage 1, SITE REDESIGN 2 (subtasks 3–7), NAV RESTRUCTURE 8,
 * brand 9, UPDATE BRANDING 10, DESIGN EXPLORATION 11, research 12,
 * MARKET RESEARCH 13, TECH SPIKE 14, vault-worldwide 15, archive 20.
 */
const top = (doc: Doc = seedDoc()) => ({ doc, cwd: null as number | null })

describe('tokenize', () => {
  it('splits on whitespace and groups quotes', () => {
    expect(tokenize('mv homepage/site  brand/')).toEqual(['mv', 'homepage/site', 'brand/'])
    expect(tokenize('rename homepage/site "Site, again"')).toEqual(['rename', 'homepage/site', 'Site, again'])
    expect(tokenize("touch 'a b'/c")).toEqual(['touch', 'a b/c'])
    expect(tokenize('   ')).toEqual([])
    expect(tokenize('a ""')).toEqual(['a', ''])
  })
})

describe('paths', () => {
  it('matches each segment by case-insensitive prefix, ignoring spaces and punctuation', () => {
    const doc = seedDoc()
    const hit = resolvePath(doc, null, 'home/site-re/create')
    expect(hit.ok && hit.node?.id).toBe(5)
    expect(resolvePath(doc, null, 'HOMEPAGE/').ok && (resolvePath(doc, null, 'HOMEPAGE/') as { node: { id: number } }).node.id).toBe(1)
  })

  it('refuses an ambiguous prefix and names the candidates', () => {
    const r = resolvePath(seedDoc(), null, 'vault/design')
    // DESIGN SYSTEM INIT is the only DESIGN… under vault-worldwide; make it ambiguous with research/ which has none
    expect(r.ok).toBe(true)
    const amb = resolvePath(seedDoc(), null, 'homepage/site/de')
    expect(amb.ok).toBe(false)
    expect(!amb.ok && amb.error).toMatch(/ambiguous "de": Define new information hierarchy, Design high-fidelity mockups/)
  })

  it('exact beats prefix', () => {
    const doc = sanitizeDoc({
      nodes: [
        { id: 1, title: 'p', status: 'none', parent: null },
        { id: 2, title: 'ART', status: 'active', parent: 1 },
        { id: 3, title: 'ARTWORK', status: 'active', parent: 1 },
      ],
      notes: [],
    })
    const r = resolvePath(doc, null, 'p/art')
    expect(r.ok && r.node?.id).toBe(2)
  })

  it('knows . .. / and ~, and is relative to the working directory', () => {
    const doc = seedDoc()
    expect(resolvePath(doc, 1, 'site').ok && (resolvePath(doc, 1, 'site') as { node: { id: number } }).node.id).toBe(2)
    expect((resolvePath(doc, 1, '.') as { node: { id: number } }).node.id).toBe(1)
    expect((resolvePath(doc, 1, '..') as { node: null }).node).toBeNull()
    expect((resolvePath(doc, 1, '/') as { node: null }).node).toBeNull()
    expect((resolvePath(doc, 1, '~/brand') as { node: { id: number } }).node.id).toBe(9)
    expect((resolvePath(doc, 1, '/brand/update') as { node: { id: number } }).node.id).toBe(10)
  })

  it('falls back to the top when a relative path finds nothing', () => {
    const doc = seedDoc()
    expect((resolvePath(doc, 1, 'brand/update') as { node: { id: number } }).node.id).toBe(10)
    const miss = resolvePath(doc, 1, 'nowhere')
    expect(miss.ok).toBe(false)
    expect(!miss.ok && miss.error).toBe('no such path: nowhere')
  })

  it('prints a path', () => {
    const doc = seedDoc()
    expect(pathOf(doc, 5)).toBe('~/homepage/SITE REDESIGN/Create wireframes')
    expect(pathOf(doc, null)).toBe('~')
  })
})

describe('completion', () => {
  it('finishes a unique segment, adds / to a project', () => {
    const doc = seedDoc()
    expect(completePath(doc, null, 'hom')).toEqual({ text: 'homepage/', candidates: ['homepage/'] })
    expect(completePath(doc, null, 'homepage/na')).toEqual({ text: 'homepage/NAV RESTRUCTURE', candidates: ['NAV RESTRUCTURE'] })
  })

  it('lists candidates and shares what it can when several fit', () => {
    const doc = seedDoc()
    const c = completePath(doc, null, 'homepage/site/d')
    expect(c.candidates).toEqual(['Define new information hierarchy', 'Design high-fidelity mockups'])
    expect(c.text).toBe('homepage/site/De')
    expect(completePath(doc, null, 'zzz')).toEqual({ text: 'zzz', candidates: [] })
  })

  it('completes relative to the working directory', () => {
    expect(completePath(seedDoc(), 1, 'si').text).toBe('SITE REDESIGN')
  })
})

describe('listing', () => {
  it('draws a project the way the directory does', () => {
    const doc = seedDoc()
    expect(listing(doc, 1).split('\n')).toEqual([
      'homepage/',
      '├── SITE REDESIGN    ACTIVE',
      '│   ├── [x] Review current homepage analytics',
      '│   ├── [x] Define new information hierarchy',
      '│   ├── [ ] Create wireframes',
      '│   ├── [ ] Design high-fidelity mockups',
      '│   └── [ ] Add motion prototypes',
      '└── NAV RESTRUCTURE  PENDING',
    ])
  })

  it('lists every project at the top', () => {
    const text = listing(seedDoc(), null)
    expect(text).toContain('homepage/\n')
    expect(text).toContain('archive/\n└── OLD LANDING PAGE')
    expect(listing({ nodes: [], notes: [], events: [] }, null)).toBe('(no projects)')
  })
})

describe('lanes', () => {
  it('takes names, labels and unique prefixes', () => {
    expect(laneFrom('a')).toEqual({ ok: true, lane: 'active' })
    expect(laneFrom('R&D')).toEqual({ ok: true, lane: 'rnd' })
    expect(laneFrom('du')).toEqual({ ok: true, lane: 'dusted' })
    expect(laneFrom('d').ok).toBe(false)
    expect(laneFrom('zzz').ok).toBe(false)
  })
})

describe('commands', () => {
  it('pwd, help, clear and an unknown verb', () => {
    expect(runShell('pwd', top())).toEqual({ ok: true, text: '~' })
    expect(runShell('pwd', { doc: seedDoc(), cwd: 1 }).text).toBe('~/homepage')
    expect(runShell('help', top()).text).toContain('touch path/NAME')
    expect(runShell('clear', top())).toEqual({ ok: true, text: '', clear: true })
    expect(runShell('', top())).toEqual({ ok: true, text: '' })
    expect(runShell('frob x', top())).toEqual({ ok: false, text: 'unknown command "frob"; try help' })
  })

  it('ls prints a subtree, with or without a path', () => {
    expect(runShell('ls homepage', top()).text).toContain('├── SITE REDESIGN')
    expect(runShell('ls', { doc: seedDoc(), cwd: 9 }).text.split('\n')[0]).toBe('brand/')
    expect(runShell('ls nope', top())).toEqual({ ok: false, text: 'no such path: nope' })
  })

  it('cd sets the working directory to a project, and .. / clear it', () => {
    expect(runShell('cd home', top())).toEqual({ ok: true, text: '~/homepage', cwd: 1 })
    expect(runShell('cd homepage/site', top()).cwd).toBe(1)
    expect(runShell('cd ..', { doc: seedDoc(), cwd: 1 })).toEqual({ ok: true, text: '~', cwd: null })
    expect(runShell('cd', { doc: seedDoc(), cwd: 1 }).cwd).toBeNull()
    expect(runShell('cd /', { doc: seedDoc(), cwd: 1 }).cwd).toBeNull()
  })

  it('touch makes a task in a project or a subtask in a task', () => {
    const r = runShell('touch homepage/NEW THING', top())
    expect(r.ok).toBe(true)
    expect(r.text).toBe('created NEW THING in homepage/')
    const made = byId(r.doc!, r.select!)!
    expect(made.title).toBe('NEW THING')
    expect(made.parent).toBe(1)
    expect(made.status).toBe('pending')

    const sub = runShell('touch homepage/site/check copy', top())
    expect(byId(sub.doc!, sub.select!)?.parent).toBe(2)

    const here = runShell('touch quick one', { doc: seedDoc(), cwd: 9 })
    expect(byId(here.doc!, here.select!)?.parent).toBe(9)
    expect(runShell('touch quick one', top()).ok).toBe(false)
    expect(runShell('touch homepage/', top()).ok).toBe(false)
  })

  it('mkdir makes a project', () => {
    const r = runShell('mkdir side quests', top())
    expect(r.text).toBe('made side quests/')
    expect(byId(r.doc!, r.select!)).toMatchObject({ title: 'side quests', parent: null, status: 'none' })
    expect(runShell('mkdir', top()).ok).toBe(false)
  })

  it('mv reparents, outdents with ., and refuses a cycle', () => {
    const r = runShell('mv homepage/nav brand/', top())
    expect(r.text).toBe('moved NAV RESTRUCTURE → brand/')
    expect(byId(r.doc!, 8)?.parent).toBe(9)
    expect(childrenOf(r.doc!, 9).map((n) => n.id)).toEqual([10, 11, 8])

    const out = runShell('mv homepage/site/create .', top())
    expect(out.text).toBe('moved Create wireframes → homepage/')
    expect(byId(out.doc!, 5)?.parent).toBe(1)

    const up = runShell('mv homepage/site .', top())
    expect(up.text).toBe('moved SITE REDESIGN → ~')
    expect(byId(up.doc!, 2)?.parent).toBeNull()

    const root = runShell('mv homepage/nav /', top())
    expect(byId(root.doc!, 8)?.parent).toBeNull()

    expect(runShell('mv homepage brand/site', top()).ok).toBe(false)
    expect(runShell('mv homepage/site homepage/site/create', top()).text).toBe('cannot move SITE REDESIGN into itself')
    expect(runShell('mv homepage .', top()).text).toBe('homepage is already at the top')
    expect(runShell('mv homepage/site homepage', top()).text).toBe('SITE REDESIGN is already in homepage/')
    expect(runShell('mv homepage/site', top()).ok).toBe(false)
  })

  it('rm hands the delete back, and refuses children without -r', () => {
    expect(runShell('rm homepage/site', top())).toEqual({ ok: false, text: 'SITE REDESIGN has 5 children; use rm -r' })
    expect(runShell('rm -r homepage/site', top())).toEqual({ ok: true, text: 'deleted SITE REDESIGN and 5 inside', remove: 2 })
    expect(runShell('rm homepage/nav', top())).toEqual({ ok: true, text: 'deleted NAV RESTRUCTURE', remove: 8 })
    expect(runShell('rm', top()).ok).toBe(false)
    expect(runShell('rm /', top()).ok).toBe(false)
  })

  it('done, undone and st set the lane; urgent flags', () => {
    const d = runShell('done homepage/nav', top())
    expect(d.text).toBe('done NAV RESTRUCTURE')
    expect(byId(d.doc!, 8)?.status).toBe('done')
    const u = runShell('undone homepage/site/review', top())
    expect(byId(u.doc!, 3)?.status).toBe('pending')
    const s = runShell('st homepage/nav a', top())
    expect(s.text).toBe('NAV RESTRUCTURE → ACTIVE')
    expect(byId(s.doc!, 8)?.status).toBe('active')
    expect(runShell('st homepage/nav d', top()).ok).toBe(false)
    expect(runShell('done homepage', top()).ok).toBe(false)
    const f = runShell('urgent homepage/nav', top())
    expect(f.text).toBe('NAV RESTRUCTURE is urgent')
    expect(byId(f.doc!, 8)?.urgent).toBe(true)
    expect(runShell('urgent homepage/nav', { doc: f.doc!, cwd: null }).text).toBe('NAV RESTRUCTURE is no longer urgent')
  })

  it('rename takes the last word, quoted for spaces', () => {
    const r = runShell('rename homepage/nav "NAV, FLATTER"', top())
    expect(r.text).toBe('renamed NAV RESTRUCTURE → NAV, FLATTER')
    expect(byId(r.doc!, 8)?.title).toBe('NAV, FLATTER')
    expect(runShell('rename homepage/nav', top()).ok).toBe(false)
  })

  it('open names the card, even from a subtask', () => {
    expect(runShell('open homepage/site/create', top())).toEqual({ ok: true, text: 'opened SITE REDESIGN', open: 2, select: 5 })
    expect(runShell('open homepage', top()).ok).toBe(false)
  })

  it('accepts a leading >', () => {
    expect(runShell('> pwd', top()).text).toBe('~')
  })

  it('never writes to the doc it was given', () => {
    const doc = seedDoc()
    const before = JSON.stringify(doc)
    runShell('mv homepage/nav brand', { doc, cwd: null })
    runShell('rename homepage/nav X', { doc, cwd: null })
    runShell('touch homepage/Y', { doc, cwd: null })
    expect(JSON.stringify(doc)).toBe(before)
  })
})

describe('reparentNode', () => {
  it('moves a subtree as a block and drops loose', () => {
    let doc = seedDoc()
    doc = reparentNode(doc, 2, 9)
    expect(byId(doc, 2)?.parent).toBe(9)
    expect(childrenOf(doc, 2).map((n) => n.id)).toEqual([3, 4, 5, 6, 7])
    expect(depthOf(doc, 3)).toBe(2)
    expect(reparentNode(doc, 2, 3)).toBe(doc)
    expect(reparentNode(doc, 2, 2)).toBe(doc)
    expect(reparentNode(doc, 2, 9)).toBe(doc)
    expect(reparentNode(doc, 999, 9)).toBe(doc)
    const toTop = reparentNode(doc, 3, null)
    expect(byId(toTop, 3)?.parent).toBeNull()
    expect(byId(toTop, 3)?.status).toBe('done')
  })
})

describe('palette', () => {
  it('tells search, command and filter apart', () => {
    expect(paletteKind('')).toBe('empty')
    expect(paletteKind('wire')).toBe('search')
    expect(paletteKind('done')).toBe('search')
    expect(paletteKind('done homepage/nav')).toBe('command')
    expect(paletteKind('> anything')).toBe('command')
    expect(paletteKind('ls')).toBe('command')
    expect(paletteKind('p:home')).toBe('filter')
    expect(paletteKind('p:home s:active !')).toBe('filter')
    expect(paletteKind('p:home nope')).toBe('search')
  })

  it('parses filter words', () => {
    expect(parseFilters('p:home s:act !')).toEqual({ project: 'home', lane: 'act', urgent: true })
    expect(parseFilters('p:')).toEqual({ project: '' })
    expect(parseFilters('hello')).toBeNull()
  })

  it('lists task hits grouped by project, naming where the hit was', () => {
    const rows = paletteRows(seedDoc(), 'wire')
    expect(rows).toEqual([{ kind: 'task', id: 2, title: 'SITE REDESIGN', project: 'homepage', where: 'subtask', snippet: 'Create wireframes' }])
    const desc = paletteRows(seedDoc(), 'footer')
    expect(desc[0]).toMatchObject({ kind: 'task', id: 8, where: 'description' })
    expect(paletteRows(seedDoc(), 'e').length).toBeLessThanOrEqual(8)
    const grouped = paletteRows(seedDoc(), 'design')
    expect(grouped.map((r) => r.kind === 'task' && r.project)).toEqual(['homepage', 'brand', 'vault-worldwide'])
  })

  it('offers the command, and the filters the words name', () => {
    expect(paletteRows(seedDoc(), '> mv a b')).toEqual([{ kind: 'command', line: 'mv a b' }])
    expect(paletteRows(seedDoc(), 'mv a b')).toEqual([{ kind: 'command', line: 'mv a b' }])
    expect(paletteRows(seedDoc(), 'p:').map((r) => r.kind === 'filter' && r.project)).toEqual([1, 9, 12, 15, 20])
    expect(paletteRows(seedDoc(), 'p:home')).toEqual([{ kind: 'filter', label: 'homepage/', project: 1 }])
    expect(paletteRows(seedDoc(), 'p:home s:act !')).toEqual([{ kind: 'filter', label: 'homepage/ · Status: ACTIVE · Urgent only', project: 1, lane: 'active', urgent: true }])
    expect(paletteRows(seedDoc(), 's:d').map((r) => r.kind === 'filter' && r.lane)).toEqual(['done', 'dusted'])
    expect(paletteRows(seedDoc(), '!')).toEqual([{ kind: 'filter', label: 'Urgent only', urgent: true }])
    expect(paletteRows(seedDoc(), 'p:zzz')).toEqual([{ kind: 'none', label: 'no project matches “zzz”' }])
  })
})
