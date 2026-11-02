import { describe, expect, it } from 'vitest'
import { byId, childrenOf, progressOf, sanitizeDoc, toggleDone, trailOf } from './doc'
import { applyPlan, levenshtein, matchReport, normalizeTitle, parseReport, revertApplied, titleScore } from './report'
import type { Doc } from './types'

function tiny(): Doc {
  return sanitizeDoc({
    nodes: [
      { id: 1, title: 'homepage', status: 'none', parent: null },
      { id: 2, title: 'SITE REDESIGN', status: 'active', parent: 1, leftOff: 'old note' },
      { id: 3, title: 'Review current homepage analytics', status: 'done', parent: 2 },
      { id: 4, title: 'Define new information hierarchy', status: 'done', parent: 2 },
      { id: 5, title: 'Create wireframes', status: 'pending', parent: 2 },
      { id: 6, title: 'Design high-fidelity mockups', status: 'pending', parent: 2 },
      { id: 7, title: 'Add motion prototypes', status: 'pending', parent: 2 },
      { id: 8, title: 'NAV RESTRUCTURE', status: 'pending', parent: 1 },
    ],
    notes: [],
  })
}

describe('parseReport', () => {
  it('reads ticked, open, left off and notes', () => {
    const r = parseReport(['## Report', '- [x] Create wireframes', '- [ ] Ship to staging', 'Left off: waiting on copy', 'Ran the build twice.', ''].join('\n'))
    expect(r).toEqual({
      done: ['Create wireframes'],
      added: ['Ship to staging'],
      leftOff: 'waiting on copy',
      notes: ['Ran the build twice.'],
    })
  })

  it('tolerates odd bullets, capitals, numbers, bold and spacing', () => {
    const r = parseReport(
      [
        '# Report',
        '* [X] One',
        '+ [x]   Two  ',
        '•[x] Three',
        '1. [x] Four',
        '2) [ ] Five',
        '[ ] Six',
        '-[] Seven',
        '  - [x] Eight',
        '**Left off:** halfway',
        '- left off : second one is a note',
        '- a plain bullet',
        '3. numbered note',
        '### Notes',
      ].join('\r\n'),
    )
    expect(r.done).toEqual(['One', 'Two', 'Three', 'Four', 'Eight'])
    expect(r.added).toEqual(['Five', 'Six', 'Seven'])
    expect(r.leftOff).toBe('halfway')
    expect(r.notes).toEqual(['left off : second one is a note', 'a plain bullet', 'numbered note'])
  })

  it('skips empty ticks and an empty left-off line', () => {
    const r = parseReport('- [x]\n- [ ]   \nLeft off:\nLeft off: now this\n')
    expect(r.done).toEqual([])
    expect(r.added).toEqual([])
    expect(r.leftOff).toBe('now this')
    expect(r.notes).toEqual([])
  })

  it('reads nothing from nothing', () => {
    expect(parseReport('')).toEqual({ done: [], added: [], notes: [] })
    expect(parseReport('   \n\n')).toEqual({ done: [], added: [], notes: [] })
  })
})

describe('matching titles', () => {
  it('normalizes case, spacing and a trailing stop', () => {
    expect(normalizeTitle('  Create   Wireframes. ')).toBe('create wireframes')
  })

  it('measures edit distance with a cut-off', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('abc', 'abc')).toBe(0)
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('kitten', 'sitting', 2)).toBe(3)
    expect(levenshtein('abcdefgh', 'ab', 2)).toBe(3)
  })

  it('scores exact, near and prefix matches, and refuses the rest', () => {
    expect(titleScore('Create wireframes', 'create wireframes')).toBe(0)
    expect(titleScore('Create wireframe', 'Create wireframes')).toBe(1)
    expect(titleScore('Craete wireframes', 'Create wireframes')).toBe(2)
    expect(titleScore('Craete wirefames', 'Create wireframes')).toBeNull()
    expect(titleScore('Create wireframes for the homepage', 'Create wireframes')).toBe(3)
    expect(titleScore('Create', 'Create wireframes')).toBe(3)
    expect(titleScore('Crea', 'Create wireframes')).toBeNull()
    expect(titleScore('Design mockups', 'Create wireframes')).toBeNull()
    expect(titleScore('', 'Create wireframes')).toBeNull()
  })
})

describe('matchReport', () => {
  it('ticks the open line a done title matches, adds the rest, and sets left off', () => {
    const plan = matchReport(tiny(), 2, {
      done: ['create wireframes', 'Design high fidelity mockups', 'Write release notes'],
      added: ['Ship to staging'],
      leftOff: 'waiting on copy',
      notes: [],
    })
    expect(plan.rows).toEqual([
      { kind: 'tick', title: 'create wireframes', nodeId: 5, matched: 'Create wireframes' },
      { kind: 'tick', title: 'Design high fidelity mockups', nodeId: 6, matched: 'Design high-fidelity mockups' },
      { kind: 'addDone', title: 'Write release notes' },
      { kind: 'add', title: 'Ship to staging' },
      { kind: 'leftOff', text: 'waiting on copy' },
    ])
    expect(plan.already).toEqual([])
  })

  it('leaves alone what the task already has, and never takes a line twice', () => {
    const plan = matchReport(tiny(), 2, {
      done: ['Review current homepage analytics', 'Add motion prototypes', 'Add motion prototype'],
      added: ['Create wireframes', 'Create wireframes'],
      notes: [],
    })
    expect(plan.rows).toEqual([
      { kind: 'tick', title: 'Add motion prototypes', nodeId: 7, matched: 'Add motion prototypes' },
      { kind: 'addDone', title: 'Add motion prototype' },
    ])
    expect(plan.already).toEqual(['Review current homepage analytics', 'Create wireframes'])
  })

  it('prefers the exact line over a prefix match, and an open line over a done one', () => {
    const d = sanitizeDoc({
      nodes: [
        { id: 1, title: 'p', status: 'none', parent: null },
        { id: 2, title: 'T', status: 'active', parent: 1 },
        { id: 3, title: 'Write tests', status: 'done', parent: 2 },
        { id: 4, title: 'Write tests for the parser', status: 'pending', parent: 2 },
        { id: 5, title: 'Deploy', status: 'done', parent: 2 },
        { id: 6, title: 'Deploy', status: 'pending', parent: 2 },
      ],
      notes: [],
    })
    const plan = matchReport(d, 2, { done: ['Write tests', 'Deploy'], added: [], notes: [] })
    expect(plan.rows).toEqual([{ kind: 'tick', title: 'Deploy', nodeId: 6, matched: 'Deploy' }])
    expect(plan.already).toEqual(['Write tests'])
  })

  it('ignores a task that is not there', () => {
    expect(matchReport(tiny(), 99, { done: ['x'], added: ['y'], notes: [] })).toEqual({ rows: [], already: [] })
  })
})

describe('applyPlan', () => {
  it('applies every row, stamps the task, and leaves one report line on the trail', () => {
    const before = tiny()
    const plan = matchReport(before, 2, parseReport('- [x] Create wireframes\n- [x] Brand new and done\n- [ ] Ship to staging\nLeft off: waiting on copy'))
    const applied = applyPlan(before, 2, plan.rows, 1234)
    const d = applied.doc
    expect(applied.summary).toBe('report: 1 ticked, 2 added, left off noted')
    expect(byId(d, 5)?.status).toBe('done')
    const kids = childrenOf(d, 2).map((n) => [n.title, n.status])
    expect(kids).toContainEqual(['Brand new and done', 'done'])
    expect(kids).toContainEqual(['Ship to staging', 'pending'])
    expect(progressOf(d, 2)).toEqual({ done: 4, total: 7 })
    expect(byId(d, 2)?.leftOff).toBe('waiting on copy')
    expect(byId(d, 2)?.touched).toBe(1234)
    expect(trailOf(d, 2)).toEqual([{ at: 1234, kind: 'report', node: 2, text: 'report: 1 ticked, 2 added, left off noted' }])
    expect(applied.ticked).toEqual([5])
    expect(applied.added).toHaveLength(2)
    expect(applied.leftOffWas).toBe('old note')
    // The old doc is untouched, so one commit is one undo step.
    expect(progressOf(before, 2)).toEqual({ done: 2, total: 5 })
  })

  it('skips rows that are no longer true, and does nothing with nothing', () => {
    const d = toggleDone(tiny(), 5)
    const applied = applyPlan(d, 2, [{ kind: 'tick', title: 'Create wireframes', nodeId: 5, matched: 'Create wireframes' }], 1)
    expect(applied.doc).toBe(d)
    expect(applied.summary).toBe('report: nothing to apply')
    expect(applyPlan(d, 99, [{ kind: 'add', title: 'x' }]).doc).toBe(d)
  })

  it('can be taken back out of a doc that moved on', () => {
    const before = tiny()
    const plan = matchReport(before, 2, parseReport('- [x] Create wireframes\n- [ ] Ship to staging\nLeft off: waiting on copy'))
    const applied = applyPlan(before, 2, plan.rows)
    // Something else happens after the report: another line is ticked by hand.
    const later = toggleDone(applied.doc, 6)
    const reverted = revertApplied(later, 2, applied)
    expect(byId(reverted, 5)?.status).toBe('pending')
    expect(byId(reverted, 6)?.status).toBe('done')
    expect(childrenOf(reverted, 2).some((n) => n.title === 'Ship to staging')).toBe(false)
    expect(byId(reverted, 2)?.leftOff).toBe('old note')
  })
})
