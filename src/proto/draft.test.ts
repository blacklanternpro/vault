import { describe, expect, it } from 'vitest'
import { byId, childrenOf, projectsOf } from '../model/doc'
import { seedDoc } from '../model/seed'
import { commitAsProject, commitDraft, parseTree, SAMPLE_PUSH } from './draft'

describe('parseTree', () => {
  it('reads an indented list into levels', () => {
    const d = parseTree('ONE\n  a\n  b\n    deep\nTWO\n')!
    expect(d.lines.map((l) => [l.level, l.text])).toEqual([
      [0, 'ONE'],
      [1, 'a'],
      [1, 'b'],
      [2, 'deep'],
      [0, 'TWO'],
    ])
  })

  it('strips bullets and checkboxes, keeping done', () => {
    const d = parseTree('- TASK\n  - [x] shipped\n  - [ ] not yet\n  1. numbered')!
    expect(d.lines.map((l) => l.text)).toEqual(['TASK', 'shipped', 'not yet', 'numbered'])
    expect(d.lines[1].done).toBe(true)
    expect(d.lines[2].done).toBe(false)
  })

  it('reads tree output', () => {
    const d = parseTree('site/\n├── HERO\n│   ├── [x] copy\n│   └── [ ] art\n└── NAV')!
    expect(d.name).toBe('site')
    expect(d.lines.map((l) => [l.level, l.text])).toEqual([
      [0, 'HERO'],
      [1, 'copy'],
      [1, 'art'],
      [0, 'NAV'],
    ])
  })

  it('never jumps two levels at once, and tabs count as indent', () => {
    const d = parseTree('A\n\t\t\tway down')!
    expect(d.lines[1].level).toBe(1)
  })

  it('returns null for nothing', () => {
    expect(parseTree('   \n\n')).toBeNull()
  })

  it('takes the sample push', () => {
    const d = parseTree(SAMPLE_PUSH)!
    expect(d.name).toBe('vault-phase-2')
    expect(d.lines.filter((l) => l.level === 0).map((l) => l.text)).toEqual(['THE PIVOT', 'THE DROP', 'THE WIRE'])
  })
})

describe('commitDraft', () => {
  it('files lines as tasks and subtasks under a folder, in order', () => {
    const doc = seedDoc()
    const project = projectsOf(doc)[0]
    const draft = parseTree('new thing\n  first\n  [x] second\n    nested')!
    const { doc: next, ids } = commitDraft(doc, draft, project.id)
    expect(ids).toHaveLength(4)
    const task = byId(next, ids[0])!
    expect(task.title).toBe('NEW THING')
    expect(task.parent).toBe(project.id)
    expect(childrenOf(next, task.id).map((n) => n.title)).toEqual(['first', 'second'])
    expect(byId(next, ids[2])!.status).toBe('done')
    expect(byId(next, ids[3])!.parent).toBe(ids[2])
  })

  it('files a draft as a new folder', () => {
    const doc = seedDoc()
    const { doc: next, ids } = commitAsProject(doc, parseTree(SAMPLE_PUSH)!)
    const folder = byId(next, ids[0])!
    expect(folder.parent).toBeNull()
    expect(folder.title).toBe('vault-phase-2')
    expect(childrenOf(next, folder.id)).toHaveLength(3)
  })
})
