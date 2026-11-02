import { describe, expect, it } from 'vitest'
import { findBest, levenshtein, rank } from '../src/match'
import { parseReport } from '../src/report'

describe('parseReport', () => {
  it('reads the canonical shape', () => {
    const r = parseReport('## Report\n- [x] Create wireframes\n- [ ] Check contrast on the CTA\nLeft off: halfway through pricing\n')
    expect(r).toEqual({ done: ['Create wireframes'], todo: ['Check contrast on the CTA'], leftOff: 'halfway through pricing', ignored: [] })
  })

  it('takes only the Report section when there are other headings', () => {
    const text = '# SITE REDESIGN\n## Subtasks\n- [ ] not this\n\n## Report\n- [X] This one\n* [ ] and this\n\n## Notes\n- [ ] not this either\n'
    const r = parseReport(text)
    expect(r.done).toEqual(['This one'])
    expect(r.todo).toEqual(['and this'])
  })

  it('works without a heading, with any bullet, CRLF and bold Left off', () => {
    const r = parseReport('1. [x] one\r\n+ [ ] two\r\n- **Left off:** stopped at three\r\n')
    expect(r.done).toEqual(['one'])
    expect(r.todo).toEqual(['two'])
    expect(r.leftOff).toBe('stopped at three')
  })

  it('skips fenced code and keeps what it did not understand', () => {
    const text = '## Report\n```\n- [x] inside a fence\n# not a heading\n```\n- [x] real\nSome prose the agent wrote.\nleft off : at the end\n'
    const r = parseReport(text)
    expect(r.done).toEqual(['real'])
    expect(r.ignored).toEqual(['Some prose the agent wrote.'])
    expect(r.leftOff).toBe('at the end')
  })

  it('ignores the Report template inside a brief\'s code fence', () => {
    const brief = '## Report back\nreply with:\n\n```\n## Report\n- [x] a subtask you finished\n```\n\n## Report\n- [x] Actual work\n'
    expect(parseReport(brief)).toMatchObject({ done: ['Actual work'], todo: [] })
  })

  it('keeps the last Left off and drops empty checkboxes', () => {
    const r = parseReport('Left off: first\n- [ ]   \n- [x] ok\nLeft off: second')
    expect(r).toEqual({ done: ['ok'], todo: [], leftOff: 'second', ignored: [] })
  })
})

describe('matching', () => {
  it('levenshtein', () => {
    expect(levenshtein('', '')).toBe(0)
    expect(levenshtein('abc', '')).toBe(3)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('wireframes', 'wireframe')).toBe(1)
  })

  it('ranks exact, near, prefix, contained and misses', () => {
    expect(rank('Create wireframes', 'create  WIREFRAMES').tier).toBe(0)
    expect(rank('create wireframe', 'Create wireframes').tier).toBe(1)
    expect(rank('craete wireframes', 'Create wireframes').tier).toBe(1)
    expect(rank('craete wireframs', 'Create wireframes').tier).toBe(9)
    expect(rank('create', 'Create wireframes').tier).toBe(2)
    expect(rank('Create wireframes for mobile', 'Create wireframes').tier).toBe(2)
    expect(rank('wireframes', 'Create wireframes').tier).toBe(3)
    expect(rank('navv', 'NAV RESTRUCTURE').tier).toBe(9)
    expect(rank('ab', 'abcdef').tier).toBe(9)
  })

  const titles = ['SITE REDESIGN', 'NAV RESTRUCTURE', 'UPDATE BRANDING', 'DESIGN EXPLORATION', 'MARKET RESEARCH']

  it('finds the one thing a query means', () => {
    expect(findBest('site redesign', titles, (t) => t).hit).toBe('SITE REDESIGN')
    expect(findBest('nav restructur', titles, (t) => t).hit).toBe('NAV RESTRUCTURE')
    expect(findBest('market', titles, (t) => t).hit).toBe('MARKET RESEARCH')
    expect(findBest('branding', titles, (t) => t).hit).toBe('UPDATE BRANDING')
  })

  it('names the closest miss and refuses to guess between equals', () => {
    const miss = findBest('navv', titles, (t) => t)
    expect(miss.hit).toBeUndefined()
    expect(miss.closest).toBe('NAV RESTRUCTURE')
    // A prefix beats a contained phrase, and the shorter title wins among prefixes.
    expect(findBest('design', titles, (t) => t).hit).toBe('DESIGN EXPLORATION')
    const amb = findBest('design', [...titles, 'DESIGN A', 'DESIGN B'], (t) => t)
    expect(amb.hit).toBeUndefined()
    expect(amb.ambiguous).toEqual(['DESIGN A', 'DESIGN B'])
    expect(findBest('x', [], (t) => t)).toEqual({})
  })
})
