import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { byId, trailOf } from '../../src/model/doc'
import { AgentError, createHandlers, parseLane, type Handlers } from '../src/tools'
import { makeStore, T0, type Fixture } from './fixture'

const NOW = T0 + 3_600_000

let fx: Fixture
let h: Handlers
beforeEach(() => {
  fx = makeStore()
  h = createHandlers(fx.store, () => NOW)
})
afterEach(() => fx.cleanup())

const doc = () => fx.store.read().doc
const lastEvent = (id: number) => trailOf(doc(), id)[0]

describe('vault_list_tasks', () => {
  it('lists every card with a table and rows', () => {
    const r = h.listTasks()
    expect(r.data.count).toBe(11)
    expect(r.data.tasks.map((t) => t.id)).toEqual([2, 8, 10, 11, 13, 14, 16, 17, 18, 19, 21])
    expect(r.data.tasks[0]).toMatchObject({ id: 2, title: 'SITE REDESIGN', project: 'homepage', status: 'active', urgent: true, tonight: true, due: '2026-11-05', next: 'Create wireframes', progress: { done: 2, total: 6 } })
    expect(r.text).toMatch(/^11 tasks \(all projects\)\n/)
    expect(r.text).toContain('#2   ACTIVE   homepage         SITE REDESIGN')
    expect(r.text).toContain('2/6')
  })

  it('narrows by project (by name, fuzzily, or id), status and tonight', () => {
    expect(h.listTasks({ project: 'homepage' }).data.tasks.map((t) => t.id)).toEqual([2, 8])
    expect(h.listTasks({ project: 'Homepag' }).data.tasks.map((t) => t.id)).toEqual([2, 8])
    expect(h.listTasks({ project: 15 }).data.tasks.map((t) => t.id)).toEqual([16, 17, 18, 19])
    expect(h.listTasks({ status: 'rnd' }).data.tasks.map((t) => t.id)).toEqual([11, 13, 14])
    expect(h.listTasks({ status: 'R&D' }).data.tasks.map((t) => t.id)).toEqual([11, 13, 14])
    expect(h.listTasks({ tonight: true }).data.tasks.map((t) => t.id)).toEqual([2])
    expect(h.listTasks({ project: 'brand', status: 'done' }).text).toContain('No tasks match.')
  })

  it('refuses an unknown project or lane, naming what exists', () => {
    expect(() => h.listTasks({ project: 'hompage' })).not.toThrow()
    expect(() => h.listTasks({ project: 'zzz' })).toThrow(/No project matches 'zzz'.*Projects: homepage, brand, research, vault-worldwide, archive/)
    expect(() => h.listTasks({ status: 'sideways' })).toThrow(/not a status; use one of pending, rnd, active, done, dusted/)
  })
})

describe('vault_get_task', () => {
  it('finds a task by id, "#id", exact title, near title or prefix', () => {
    for (const ref of [2, '2', '#2', 'SITE REDESIGN', 'site redesign', 'site redesgin', 'site red']) {
      const r = h.getTask({ id: ref })
      expect(r.data.id).toBe(2)
      expect(r.text.startsWith('# SITE REDESIGN\n')).toBe(true)
    }
    expect(h.getTask({ title: 'nav restructure' }).data.id).toBe(8)
  })

  it('reaches a subtask by id or title when no card matches', () => {
    expect(h.getTask({ id: 5 }).data).toMatchObject({ id: 5, kind: 'subtask', title: 'Create wireframes' })
    expect(h.getTask({ id: 'mobile layout' }).data.id).toBe(22)
  })

  it('explains a miss with the closest title, and refuses projects', () => {
    expect(() => h.getTask({ id: 'navv' })).toThrow("No task matches 'navv'; closest: NAV RESTRUCTURE (#8)")
    expect(() => h.getTask({ id: 999 })).toThrow('No task #999')
    expect(() => h.getTask({ id: 1 })).toThrow(/#1 \(homepage\) is a project, not a task/)
    expect(() => h.getTask({})).toThrow(AgentError)
  })
})

describe('vault_tick', () => {
  it('ticks an open subtask by a forgiving title and logs an agent event', () => {
    const r = h.tick({ id: 2, subtask: 'create wireframe' })
    expect(r.data).toEqual({ task: { id: 2, title: 'SITE REDESIGN' }, subtask: { id: 5, title: 'Create wireframes' }, progress: { done: 3, total: 6 } })
    expect(r.text).toBe('Ticked "Create wireframes" on SITE REDESIGN (#2): 3/6 done.')
    expect(byId(doc(), 5)?.status).toBe('done')
    expect(lastEvent(2)).toEqual({ at: NOW, kind: 'ticked', node: 2, text: 'agent: ticked "Create wireframes"' })
    expect(byId(doc(), 2)?.touched).toBe(NOW)
  })

  it('takes a prefix, an id, or a nested line', () => {
    expect(h.tick({ id: 'site redesign', subtask: 'design high' }).data.subtask.id).toBe(6)
    expect(h.tick({ id: 2, subtask: '#7' }).data.subtask.id).toBe(7)
    expect(h.tick({ id: 2, subtask: 'mobile' }).data.subtask.id).toBe(22)
  })

  it('refuses a ticked, missing or ambiguous subtask with the closest one named', () => {
    expect(() => h.tick({ id: 2, subtask: 'Review current homepage analytics' })).toThrow('"Review current homepage analytics" (#3) is already ticked on SITE REDESIGN (#2)')
    expect(() => h.tick({ id: 2, subtask: 'wirefarmes' })).toThrow("No open subtask of SITE REDESIGN (#2) matches 'wirefarmes'; closest: Create wireframes (#5)")
    expect(() => h.tick({ id: 8, subtask: 'anything' })).toThrow(/has no subtasks yet/)
    h.addSubtask({ id: 2, title: 'Design A' })
    h.addSubtask({ id: 2, title: 'Design B' })
    expect(() => h.tick({ id: 2, subtask: 'design' })).toThrow(/could be Design A \(#\d+\) or Design B \(#\d+\); use the id/)
  })
})

describe('vault_add_subtask', () => {
  it('adds open or done lines and refuses a duplicate', () => {
    const open = h.addSubtask({ id: 2, title: 'Check contrast' })
    expect(open.data.subtask).toEqual({ id: 23, title: 'Check contrast', done: false })
    expect(open.data.progress).toEqual({ done: 2, total: 7 })
    const done = h.addSubtask({ id: 8, title: 'Count the entries', done: true })
    expect(byId(doc(), done.data.subtask.id)).toMatchObject({ parent: 8, status: 'done' })
    expect(lastEvent(8).text).toBe('agent: added subtask "Count the entries" (done)')
    expect(() => h.addSubtask({ id: 2, title: 'check  CONTRAST' })).toThrow(/already has "Check contrast" \(#23\)/)
    expect(() => h.addSubtask({ id: 2, title: '  ' })).toThrow(/needs a title/)
  })
})

describe('vault_set_status / set_next / left_off / add_link', () => {
  it('moves between lanes, with aliases and a no-op', () => {
    expect(h.setStatus({ id: 8, status: 'active' }).text).toBe('NAV RESTRUCTURE (#8): PENDING → ACTIVE.')
    expect(byId(doc(), 8)?.status).toBe('active')
    expect(lastEvent(8)).toMatchObject({ kind: 'moved', text: 'agent: moved to ACTIVE' })
    const before = fx.store.read().savedAt
    expect(h.setStatus({ id: 8, status: 'ACTIVE' }).text).toBe('NAV RESTRUCTURE (#8) is already ACTIVE.')
    expect(fx.store.read().savedAt).toBe(before)
    expect(h.setStatus({ id: 8, status: 'R&D' }).data.status).toBe('rnd')
    expect(parseLane('in progress')).toBe('active')
    expect(() => parseLane('later')).toThrow(AgentError)
  })

  it('sets and clears the next action and the left-off note', () => {
    expect(h.setNext({ id: 8, next: 'Count the top-level entries' }).data.next).toBe('Count the top-level entries')
    expect(byId(doc(), 8)?.next).toBe('Count the top-level entries')
    expect(lastEvent(8)).toMatchObject({ kind: 'note', text: 'agent: next action: Count the top-level entries' })
    expect(h.setNext({ id: 8, next: '' }).data.next).toBeNull()
    expect(byId(doc(), 8)?.next).toBeUndefined()
    expect(h.leftOff({ id: 2, text: 'Pricing table half done' }).data.leftOff).toBe('Pricing table half done')
    expect(byId(doc(), 2)?.leftOff).toBe('Pricing table half done')
    expect(lastEvent(2)).toMatchObject({ kind: 'leftoff', text: 'agent: left off: Pricing table half done' })
    expect(h.leftOff({ id: 2, text: ' ' }).data.leftOff).toBeNull()
  })

  it('adds http(s) links, labels them by host, and replaces a repeat', () => {
    const r = h.addLink({ id: 2, url: 'https://vault.example.com/deploy/42' })
    expect(r.data.link).toEqual({ label: 'vault.example.com', url: 'https://vault.example.com/deploy/42' })
    expect(r.data.links).toHaveLength(2)
    const again = h.addLink({ id: 2, url: 'https://vault.example.com/deploy/42', label: 'deploy' })
    expect(again.data.links).toEqual([
      { label: 'repo', url: 'https://github.com/blacklanternpro/vault' },
      { label: 'deploy', url: 'https://vault.example.com/deploy/42' },
    ])
    expect(() => h.addLink({ id: 2, url: 'javascript:alert(1)' })).toThrow(/not an http\(s\) URL/)
    expect(lastEvent(2).text).toBe('agent: linked deploy (https://vault.example.com/deploy/42)')
  })
})

describe('vault_report', () => {
  const REPORT = ['## Report', '- [x] Create wireframes', '- [x] Design high-fidelity mockup', '- [x] Review current homepage analytics', '- [x] Wrote the hero copy', '- [ ] Check contrast on the CTA', '- [ ] add motion prototypes', 'Some prose.', 'Left off: pricing table half done', ''].join('\n')

  it('applies ticks, additions and the left-off note in one write, and files the report in the inbox', () => {
    const eventsBefore = doc().events.length
    const r = h.report({ id: 'site redesign', report: REPORT })
    expect(r.data.ticked).toEqual([
      { id: 5, title: 'Create wireframes' },
      { id: 6, title: 'Design high-fidelity mockups' },
    ])
    expect(r.data.added).toEqual([
      { id: 23, title: 'Wrote the hero copy', done: true },
      { id: 24, title: 'Check contrast on the CTA', done: false },
    ])
    expect(r.data.skipped).toEqual([
      { line: 'Review current homepage analytics', reason: '"Review current homepage analytics" (#3) was already ticked' },
      { line: 'add motion prototypes', reason: 'already listed as "Add motion prototypes" (#7)' },
      { line: 'Some prose.', reason: 'not a `- [ ]`, `- [x]` or `Left off:` line' },
    ])
    expect(r.data.leftOff).toBe('pricing table half done')
    expect(r.data.progress).toEqual({ done: 5, total: 8 })
    expect(r.data.inboxIndex).toBe(0)
    expect(r.text).toContain('Report applied to SITE REDESIGN (#2): ticked 2, added 2, skipped 3, left off noted. 5/8 done. Delivered to the VAULT inbox (#0).')

    const after = doc()
    expect(byId(after, 5)?.status).toBe('done')
    expect(byId(after, 2)?.leftOff).toBe('pricing table half done')
    expect(byId(after, 2)?.touched).toBe(NOW)
    const fresh = after.events.slice(eventsBefore)
    expect(fresh.map((e) => e.kind)).toEqual(['ticked', 'ticked', 'created', 'created', 'leftoff', 'report'])
    expect(fresh.every((e) => e.text.startsWith('agent: ') && e.node === 2 && e.at === NOW)).toBe(true)
    expect(fresh.at(-1)?.text).toBe('agent: report: ticked 2, added 2, left off noted')
    expect(fx.store.readInbox()).toEqual([{ at: NOW, taskId: 2, text: REPORT.trim() }])
    expect(fs.existsSync(fx.store.backupFile)).toBe(true)
  })

  it('still delivers a report with nothing it could apply', () => {
    const r = h.report({ id: 8, report: 'Looked at it, nothing to tick yet.' })
    expect(r.data).toMatchObject({ ticked: [], added: [], leftOff: null, inboxIndex: 0 })
    expect(r.data.skipped).toHaveLength(1)
    expect(lastEvent(8).kind).toBe('report')
    expect(() => h.report({ id: 8, report: '   ' })).toThrow(/empty/)
    expect(() => h.report({ id: 'nope', report: '- [x] x' })).toThrow(/No task matches 'nope'/)
    expect(fx.store.readInbox()).toHaveLength(1)
  })
})

describe('vault_create_task', () => {
  it('creates a card in a project with status, next and due', () => {
    const r = h.createTask({ project: 'Brand', title: 'PRESS KIT', status: 'active', next: 'Collect logos', due: '2026-11-20' })
    expect(r.data).toMatchObject({ id: 23, title: 'PRESS KIT', project: 'brand', status: 'active', next: 'Collect logos', due: '2026-11-20', progress: { done: 0, total: 0 } })
    expect(r.text).toBe('Created PRESS KIT (#23) in brand, ACTIVE, due 2026-11-20.')
    const trail = trailOf(doc(), 23).map((e) => `${e.kind}: ${e.text}`)
    expect(trail).toEqual(['due: agent: due 2026-11-20', 'created: agent: created "PRESS KIT" in brand'])
    expect(h.listTasks({ project: 9 }).data.tasks.map((t) => t.id)).toEqual([10, 11, 23])
    expect(h.createTask({ project: 1, title: 'PLAIN' }).data).toMatchObject({ status: 'pending', next: null, due: null })
  })

  it('refuses a bad date, a missing project or an empty title', () => {
    expect(() => h.createTask({ project: 'brand', title: 'X', due: 'next week' })).toThrow(/not a date; use YYYY-MM-DD/)
    expect(() => h.createTask({ project: 'marketing', title: 'X' })).toThrow(/No project matches 'marketing'/)
    expect(() => h.createTask({ project: 2, title: 'X' })).toThrow(/is a task, not a project/)
    expect(() => h.createTask({ project: 'brand', title: ' ' })).toThrow(/needs a title/)
  })
})

describe('vault_search', () => {
  it('finds titles and goals and says which card each hit lives in', () => {
    const r = h.search({ q: 'design' })
    expect(r.data.count).toBe(4)
    expect(r.data.hits.map((x) => x.id)).toEqual([2, 6, 11, 18])
    expect(r.data.hits[1]).toEqual({ id: 6, title: 'Design high-fidelity mockups', kind: 'subtask', status: 'pending', cardId: 2, cardTitle: 'SITE REDESIGN', project: 'homepage' })
    expect(r.text).toContain("4 hits for 'design'")
    expect(r.text).toContain('#6 · subtask · PENDING · Design high-fidelity mockups — in SITE REDESIGN (#2) · homepage')
    expect(h.search({ q: 'mood boards' }).data.hits.map((x) => x.id)).toEqual([11])
    expect(h.search({ q: 'zzz' }).text).toBe("0 hits for 'zzz'")
    expect(() => h.search({ q: '  ' })).toThrow(AgentError)
  })
})

describe('resources', () => {
  it('renders the task table as markdown', () => {
    const md = h.tasksMarkdown()
    expect(md.startsWith('# VAULT tasks\n\nID ')).toBe(true)
    expect(md).toContain('#19  ACTIVE   vault-worldwide  AESTHETIC PASS')
  })
})
