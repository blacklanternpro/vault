import { describe, expect, it } from 'vitest'
import { byId, pullCard, removeNode, sanitizeDoc, trailOf } from '../model/doc'
import type { Doc } from '../model/types'
import { cardIdOf, eventLine, laneArrow, note, quoted, stamp } from './trail'

function tiny(): Doc {
  return sanitizeDoc({
    nodes: [
      { id: 1, title: 'homepage', status: 'none', parent: null },
      { id: 2, title: 'SITE REDESIGN', status: 'active', parent: 1 },
      { id: 3, title: 'Create wireframes', status: 'pending', parent: 2 },
    ],
    notes: [],
    events: [],
  })
}

describe('stamping the trail', () => {
  it('writes the line against the card and touches both the line and the card', () => {
    const d = stamp(tiny(), 3, 'ticked', `ticked ${quoted('Create wireframes')}`, 5000)
    expect(cardIdOf(d, 3)).toBe(2)
    expect(byId(d, 2)?.touched).toBe(5000)
    expect(byId(d, 3)?.touched).toBe(5000)
    expect(trailOf(d, 2)).toEqual([{ at: 5000, kind: 'ticked', node: 2, text: 'ticked “Create wireframes”' }])
  })

  it('a pulled line is its own card, so the line lands on it', () => {
    const d = stamp(pullCard(tiny(), 3, 'rnd'), 3, 'moved', `pulled ${laneArrow('rnd')}`, 7000)
    expect(trailOf(d, 3).map((e) => e.text)).toEqual(['pulled → R&D'])
    expect(trailOf(d, 2)).toEqual([])
  })

  it('a note about the board carries no card, and reads as itself', () => {
    const d = note(removeNode(tiny(), 2), 'deleted', `deleted ${quoted('SITE REDESIGN')}`, 9000)
    expect(d.events[0].node).toBeUndefined()
    expect(eventLine(d, d.events[0])).toBe('deleted “SITE REDESIGN”')
  })

  it('a line on a card reads with the card’s name', () => {
    const d = stamp(tiny(), 2, 'moved', laneArrow('done'), 1)
    expect(eventLine(d, d.events[0])).toBe('SITE REDESIGN → DONE')
    expect(quoted('  ')).toBe('“_”')
  })
})
