import { sanitizeDoc } from './doc'
import type { Doc, Lane, Node } from './types'

/** First-run content, so an empty install shows what the board and directory are for. */

type Spec = [title: string, lane: Lane, body?: string, subtasks?: Array<[string, boolean]>]

const SEED: Array<[project: string, tasks: Spec[]]> = [
  [
    'homepage',
    [
      [
        'SITE REDESIGN',
        'active',
        'Redesign the homepage to better communicate the value prop and improve conversion.\nFocus on clarity, modern aesthetics, and strong CTAs.',
        [
          ['Review current homepage analytics', true],
          ['Define new information hierarchy', true],
          ['Create wireframes', false],
          ['Design high-fidelity mockups', false],
          ['Add motion prototypes', false],
        ],
      ],
      ['NAV RESTRUCTURE', 'pending', 'Flatten the top nav to five entries and move the rest into the footer.'],
    ],
  ],
  ['brand', [['UPDATE BRANDING', 'pending'], ['DESIGN EXPLORATION', 'rnd', 'Mood boards.']]],
  ['research', [['MARKET RESEARCH', 'rnd', 'Competitive analysis.'], ['TECH SPIKE', 'rnd', 'Next-gen stack.']]],
  [
    'vault-worldwide',
    [
      ['CREATE REPO', 'done'],
      ['PROJECT SETUP', 'done', 'Boilerplate and config.'],
      ['DESIGN SYSTEM INIT', 'done', 'Tokens and components.'],
      ['AESTHETIC PASS', 'active', 'Visual polish.'],
    ],
  ],
  ['archive', [['OLD LANDING PAGE', 'dusted', 'Deprecated.']]],
]

export function seedDoc(): Doc {
  const nodes: Node[] = []
  let id = 0
  for (const [project, tasks] of SEED) {
    const pid = ++id
    nodes.push({ id: pid, title: project, status: 'none', parent: null })
    for (const [title, lane, body, subtasks] of tasks) {
      const tid = ++id
      const task: Node = { id: tid, title, status: lane, parent: pid }
      if (body) task.body = body
      nodes.push(task)
      for (const [line, done] of subtasks ?? []) {
        nodes.push({ id: ++id, title: line, status: done ? 'done' : 'pending', parent: tid })
      }
    }
  }
  return sanitizeDoc({ nodes, notes: [{ id: 'seed-note', date: '09.09.26', text: 'ask about the analytics export' }] })
}
