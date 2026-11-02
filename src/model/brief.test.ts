import { describe, expect, it } from 'vitest'
import {
  briefOf,
  findUrls,
  formatDuration,
  linkKind,
  monthBounds,
  parseDuration,
  sessionSeconds,
  sessionText,
  sessionsByProject,
  slugOf,
  spentByProject,
  spentOf,
  stampOf,
} from './brief'
import { logEvent, sanitizeDoc, updateNode } from './doc'
import type { Doc } from './types'

function tiny(): Doc {
  return sanitizeDoc({
    nodes: [
      { id: 1, title: 'homepage', status: 'none', parent: null },
      { id: 2, title: 'SITE REDESIGN', status: 'active', parent: 1, body: 'Redesign the homepage.\nStrong CTAs.' },
      { id: 3, title: 'Review analytics', status: 'done', parent: 2 },
      { id: 4, title: 'Create wireframes', status: 'pending', parent: 2 },
      { id: 5, title: 'low-fi first', status: 'pending', parent: 4 },
      { id: 6, title: 'NAV RESTRUCTURE', status: 'pending', parent: 1 },
      { id: 7, title: 'brand', status: 'none', parent: null },
      { id: 8, title: 'UPDATE BRANDING', status: 'rnd', parent: 7 },
    ],
    notes: [],
  })
}

describe('briefOf', () => {
  it('writes every section in order, with the fixed headings', () => {
    const text = briefOf(tiny(), 2, Date.UTC(2026, 10, 2))
    const heads = text.split('\n').filter((l) => l.startsWith('#'))
    expect(heads).toEqual([
      '# SITE REDESIGN',
      '## Goal',
      '## Next action',
      '## Subtasks',
      '## Links',
      '## Where I left off',
      '## Recent trail',
      '## Done when',
      '## Report back',
    ])
    expect(text).toContain('Project: homepage · Status: ACTIVE · Due: — · Urgent: no')
    expect(text).toContain('Redesign the homepage.\nStrong CTAs.')
    expect(text).toContain('- [x] Review analytics\n- [ ] Create wireframes\n  - [ ] low-fi first\n')
    expect(text).toContain('## Done when\nEvery subtask above is ticked and the status is DONE.')
    expect(text).toContain('"## Report" section')
    expect(text.endsWith('\n')).toBe(true)
  })

  it('shows dashes for what is not there and fills what is', () => {
    let d = tiny()
    const bare = briefOf(d, 6)
    expect(bare).toContain('## Goal\n(no description)\n## Next action\n—\n## Subtasks\n—\n## Links\n—\n## Where I left off\n—\n## Recent trail\n—\n')

    d = updateNode(d, 6, {
      due: '2026-11-20',
      urgent: true,
      next: 'sketch the footer',
      leftOff: 'halfway through the nav list',
      links: [
        { label: '', url: 'https://github.com/bad-form/vault' },
        { label: 'live', url: 'https://vault.vercel.app' },
      ],
    })
    const now = new Date(2026, 10, 2, 22, 0).getTime()
    d = logEvent(d, 'ticked', 'ticked a line', 6, new Date(2026, 9, 12, 9, 5).getTime())
    d = logEvent(d, 'moved', 'moved → ACTIVE', 6, new Date(2026, 10, 2, 21, 14).getTime())
    d = logEvent(d, 'moved', 'other task moved', 2, now)
    const text = briefOf(d, 6, now)
    expect(text).toContain('Due: 2026-11-20 · Urgent: yes')
    expect(text).toContain('## Next action\nsketch the footer')
    expect(text).toContain('## Links\n- github.com: https://github.com/bad-form/vault\n- live: https://vault.vercel.app\n')
    expect(text).toContain('## Where I left off\nhalfway through the nav list')
    // Newest first, this task only, weekday inside the week and a date beyond it.
    expect(text).toContain('## Recent trail\n- Mon 21:14 moved → ACTIVE\n- 12 Oct 09:05 ticked a line\n## Done when')
    expect(text).not.toContain('other task moved')
  })

  it('keeps the trail to the last eight lines', () => {
    let d = tiny()
    for (let i = 0; i < 12; i++) d = logEvent(d, 'note', `line ${i}`, 2, 1000 + i)
    const text = briefOf(d, 2, 5000)
    expect(text.split('\n').filter((l) => /^- .*line \d+$/.test(l))).toHaveLength(8)
    expect(text).toContain('line 11')
    expect(text).not.toContain('line 3\n')
  })

  it('is empty for a node that is not there', () => {
    expect(briefOf(tiny(), 99)).toBe('')
  })

  it('names a project brief without a parent line', () => {
    expect(briefOf(tiny(), 1)).toContain('Project: — · Status: PENDING')
  })
})

describe('slugOf', () => {
  it('makes a file-safe name', () => {
    expect(slugOf('SITE REDESIGN')).toBe('site-redesign')
    expect(slugOf('  Ship "v2" — ünïcode 🔥 ')).toBe('ship-v2-n-code')
    expect(slugOf('')).toBe('task')
    expect(slugOf('a'.repeat(60))).toHaveLength(40)
  })
})

describe('stampOf', () => {
  it('uses the weekday inside the week and the date beyond it', () => {
    const now = new Date(2026, 10, 2, 22, 0).getTime()
    expect(stampOf(new Date(2026, 10, 2, 21, 14).getTime(), now)).toBe('Mon 21:14')
    expect(stampOf(new Date(2026, 9, 30, 8, 5).getTime(), now)).toBe('Fri 08:05')
    expect(stampOf(new Date(2026, 9, 12, 9, 5).getTime(), now)).toBe('12 Oct 09:05')
    expect(stampOf(new Date(2026, 10, 9, 9, 5).getTime(), now)).toBe('9 Nov 09:05')
  })
})

describe('links', () => {
  it('reads the kind off the host', () => {
    expect(linkKind('https://github.com/bad-form/vault')).toBe('repo')
    expect(linkKind('https://www.github.com/x')).toBe('repo')
    expect(linkKind('https://gitlab.com/x/y')).toBe('repo')
    expect(linkKind('https://vault-xyz.vercel.app')).toBe('deploy')
    expect(linkKind('https://vercel.com/bad-form/vault')).toBe('deploy')
    expect(linkKind('https://www.figma.com/file/abc')).toBe('figma')
    expect(linkKind('https://mail.google.com/mail/u/0/#inbox')).toBe('mail')
    expect(linkKind('https://outlook.live.com/mail/')).toBe('mail')
    expect(linkKind('https://docs.google.com/document/d/1')).toBe('doc')
    expect(linkKind('https://www.notion.so/page')).toBe('doc')
    expect(linkKind('https://bad-form.pro')).toBe('other')
    expect(linkKind('https://notgithub.com/x')).toBe('other')
    expect(linkKind('not a url')).toBe('other')
  })

  it('finds the URLs in a paste, without their trailing punctuation or duplicates', () => {
    expect(findUrls('see https://github.com/a/b, and (https://x.io/p?q=1). again https://github.com/a/b')).toEqual([
      'https://github.com/a/b',
      'https://x.io/p?q=1',
    ])
    expect(findUrls('plain text')).toEqual([])
    expect(findUrls('ftp://nope.com and javascript:alert(1)')).toEqual([])
  })
})

describe('time', () => {
  it('formats and parses the same way', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(90)).toBe('1m')
    expect(formatDuration(12 * 60 + 5)).toBe('12m')
    expect(formatDuration(3720)).toBe('1h 02m')
    expect(formatDuration(2 * 3600 + 15 * 60 + 59)).toBe('2h 15m')
    expect(parseDuration('1h 02m')).toBe(3720)
    expect(parseDuration('12m')).toBe(720)
    expect(parseDuration('45s')).toBe(45)
    expect(parseDuration('2h')).toBe(7200)
    expect(parseDuration('lunch')).toBeNull()
    expect(parseDuration('')).toBeNull()
    expect(sessionText(3720)).toBe('session 1h 02m')
    expect(sessionSeconds('session 1h 02m')).toBe(3720)
    expect(sessionSeconds('brief copied')).toBeNull()
    expect(sessionSeconds('session forever')).toBeNull()
  })

  it('adds up spent time under a task and a project', () => {
    let d = tiny()
    d = updateNode(d, 2, { spent: 600 })
    d = updateNode(d, 4, { spent: 60 })
    d = updateNode(d, 8, { spent: 30 })
    expect(spentOf(d, 2)).toBe(660)
    expect(spentOf(d, 6)).toBe(0)
    expect(spentByProject(d).map((t) => [t.project.title, t.seconds])).toEqual([
      ['homepage', 660],
      ['brand', 30],
    ])
  })

  it('reads a month of sessions off the trail, by project', () => {
    let d = tiny()
    const { from, to } = monthBounds(new Date(2026, 10, 15).getTime())
    d = logEvent(d, 'note', 'session 1h 00m', 2, from + 1000)
    d = logEvent(d, 'note', 'session 30m', 6, from + 2000)
    d = logEvent(d, 'note', 'session 15m', 8, to - 1)
    d = logEvent(d, 'note', 'session 5h 00m', 8, from - 1) // last month
    d = logEvent(d, 'note', 'session 5h 00m', 8, to) // next month
    d = logEvent(d, 'note', 'a note that is not a session', 8, from + 3000)
    d = logEvent(d, 'report', 'session 9h 00m', 8, from + 4000) // wrong kind
    expect(sessionsByProject(d, from, to).map((t) => [t.project.title, t.seconds])).toEqual([
      ['homepage', 5400],
      ['brand', 900],
    ])
  })

  it('bounds the month in local time', () => {
    const { from, to } = monthBounds(new Date(2026, 10, 15, 12).getTime())
    expect(new Date(from).toDateString()).toBe(new Date(2026, 10, 1).toDateString())
    expect(new Date(to).toDateString()).toBe(new Date(2026, 11, 1).toDateString())
  })
})
