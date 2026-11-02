import { describe, expect, it } from 'vitest'
import { pullCard, setStatus, updateNode } from '../../src/model/doc'
import { briefOf, doneWhen, dueLabel, stamp, taskSummary } from '../src/brief'
import { fixtureDoc, T0 } from './fixture'

const NOW = new Date(2026, 10, 2, 9, 0, 0)

describe('briefOf', () => {
  it('renders every section in order with the task data', () => {
    const doc = fixtureDoc()
    const text = briefOf(doc, 2, { now: NOW })
    const lines = text.split('\n')
    expect(lines[0]).toBe('# SITE REDESIGN')
    expect(lines[1]).toBe('Task #2 · Project: homepage · Status: ACTIVE · Due: 2026-11-05 (in 3 days) · Urgent · Tonight')
    const headings = lines.filter((l) => l.startsWith('## '))
    expect(headings).toEqual(['## Goal', '## Next action', '## Subtasks', '## Links', '## Where I left off', '## Recent trail', '## Done when', '## Report back', '## Report'])
    expect(text).toContain('## Goal\nRedesign the homepage')
    expect(text).toContain('## Next action\nCreate wireframes\n')
    expect(text).toContain('- [x] Review current homepage analytics\n- [x] Define new information hierarchy\n- [ ] Create wireframes\n  - [ ] Mobile layout\n- [ ] Design high-fidelity mockups\n- [ ] Add motion prototypes\n')
    expect(text).toContain('## Links\n- [repo](https://github.com/blacklanternpro/vault)\n')
    expect(text).toContain('## Where I left off\nHero section half drawn\n')
    expect(text).toContain('## Done when\nEvery subtask above is ticked and the next action is done. 4 of 6 are still open.\n')
    expect(text).toContain('`vault_report` MCP tool (id 2)')
    expect(text).toContain('vault-agent report 2 < report.md')
  })

  it('shows the last 8 trail lines, newest first', () => {
    const doc = fixtureDoc()
    const text = briefOf(doc, 2, { now: NOW })
    const trail = text.split('## Recent trail\n')[1].split('\n\n')[0].split('\n')
    expect(trail).toHaveLength(8)
    expect(trail[0]).toBe(`- ${stamp(T0 - 60_000)} · moved · moved to ACTIVE`)
    expect(trail[1]).toBe(`- ${stamp(T0 - 5 * 60_000)} · ticked · Define new information hierarchy`)
    expect(trail[7]).toContain('older 4')
    expect(text).not.toContain('older 3')
  })

  it('leaves empty sections out and marks a missing next action', () => {
    const doc = fixtureDoc()
    const text = briefOf(doc, 8, { now: NOW })
    expect(text.split('\n').filter((l) => l.startsWith('## '))).toEqual(['## Goal', '## Next action', '## Subtasks', '## Done when', '## Report back', '## Report'])
    expect(text).toContain('Task #8 · Project: homepage · Status: PENDING\n')
    expect(text).toContain('## Next action\n(not set — pick the first open subtask)\n')
    expect(text).toContain('## Subtasks\n(none yet)\n')
    expect(text).toContain('## Done when\nThe goal above is met.')
    expect(briefOf(doc, 10, { now: NOW })).not.toContain('## Goal')
  })

  it('names the parent of a loose subtask', () => {
    const doc = pullCard(fixtureDoc(), 6, 'active')
    const text = briefOf(doc, 6, { now: NOW })
    expect(text).toContain('Loose from: SITE REDESIGN (#2)')
  })

  it('refuses a project or an unknown id', () => {
    const doc = fixtureDoc()
    expect(() => briefOf(doc, 1)).toThrow(/project, not a task/)
    expect(() => briefOf(doc, 999)).toThrow(/No task #999/)
  })
})

describe('pieces', () => {
  it('describes due dates relative to today', () => {
    expect(dueLabel('2026-11-02', NOW)).toBe('2026-11-02 (today)')
    expect(dueLabel('2026-11-03', NOW)).toBe('2026-11-03 (tomorrow)')
    expect(dueLabel('2026-11-10', NOW)).toBe('2026-11-10 (in 8 days)')
    expect(dueLabel('2026-11-01', NOW)).toBe('2026-11-01 (1 day overdue)')
    expect(dueLabel('2026-10-20', NOW)).toBe('2026-10-20 (13 days overdue)')
  })

  it('says what done means', () => {
    const doc = fixtureDoc()
    expect(doneWhen(doc, doc.nodes.find((n) => n.id === 8)!)).toMatch(/goal above is met/)
    const withNext = updateNode(doc, 8, { next: 'Flatten the nav' })
    expect(doneWhen(withNext, withNext.nodes.find((n) => n.id === 8)!)).toBe('The next action above is done.')
    expect(doneWhen(doc, doc.nodes.find((n) => n.id === 2)!)).toBe('Every subtask above is ticked and the next action is done. 4 of 6 are still open.')
    const allDone = [5, 6, 7, 22].reduce((d, id) => setStatus(d, id, 'done'), doc)
    expect(doneWhen(allDone, allDone.nodes.find((n) => n.id === 2)!)).toBe('Every subtask is already ticked; finish the next action above.')
  })

  it('summarises a task for JSON', () => {
    const doc = fixtureDoc()
    const s = taskSummary(doc, doc.nodes.find((n) => n.id === 2)!)
    expect(s).toMatchObject({ id: 2, title: 'SITE REDESIGN', kind: 'task', project: 'homepage', projectId: 1, status: 'active', urgent: true, tonight: true, due: '2026-11-05', next: 'Create wireframes', progress: { done: 2, total: 6 } })
    expect(s.subtasks.map((x) => [x.id, x.done, x.depth])).toEqual([
      [3, true, 1],
      [4, true, 1],
      [5, false, 1],
      [22, false, 2],
      [6, false, 1],
      [7, false, 1],
    ])
  })
})
