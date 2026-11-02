import { describe, expect, it } from 'vitest'
import { afterDelete, shoveLane, vimKey, vimTarget, type LaneCards } from './vim'

const lanes: LaneCards[] = [
  { lane: 'pending', ids: [1, 2, 3] },
  { lane: 'rnd', ids: [] },
  { lane: 'active', ids: [4, 5] },
  { lane: 'done', ids: [6] },
  { lane: 'dusted', ids: [] },
]
// Cards sit 100px apart down each lane.
const centre = (id: number) => {
  for (const l of lanes) {
    const i = l.ids.indexOf(id)
    if (i >= 0) return 50 + i * 100
  }
  return 0
}

describe('vim keys', () => {
  it('maps the keys, shift and all', () => {
    expect(vimKey('j', false)).toBe('down')
    expect(vimKey('k', false)).toBe('up')
    expect(vimKey('h', false)).toBe('left')
    expect(vimKey('l', false)).toBe('right')
    expect(vimKey('H', true)).toBe('shoveLeft')
    expect(vimKey('L', true)).toBe('shoveRight')
    expect(vimKey('J', true)).toBeNull()
    expect(vimKey('o', false)).toBe('open')
    expect(vimKey('x', false)).toBe('delete')
    expect(vimKey('Enter', false)).toBeNull()
  })

  it('j and k stay in the lane and stop at the ends', () => {
    expect(vimTarget('down', lanes, 1, centre)).toBe(2)
    expect(vimTarget('down', lanes, 3, centre)).toBe(3)
    expect(vimTarget('up', lanes, 2, centre)).toBe(1)
    expect(vimTarget('up', lanes, 1, centre)).toBe(1)
  })

  it('h and l take the nearest card in the next lane that has one', () => {
    expect(vimTarget('right', lanes, 3, centre)).toBe(5)
    expect(vimTarget('right', lanes, 1, centre)).toBe(4)
    expect(vimTarget('left', lanes, 5, centre)).toBe(2)
    expect(vimTarget('right', lanes, 6, centre)).toBeNull()
    expect(vimTarget('left', lanes, 1, centre)).toBeNull()
  })

  it('starts at the first card when nothing is focused', () => {
    expect(vimTarget('down', lanes, null, centre)).toBe(1)
    expect(vimTarget('down', [{ lane: 'pending', ids: [] }], null, centre)).toBeNull()
  })

  it('shoves one lane along and stops at the ends', () => {
    expect(shoveLane('pending', 1)).toBe('rnd')
    expect(shoveLane('pending', -1)).toBeNull()
    expect(shoveLane('dusted', 1)).toBeNull()
  })

  it('picks what holds focus after a delete', () => {
    expect(afterDelete(lanes, 1)).toBe(2)
    expect(afterDelete(lanes, 3)).toBe(2)
    expect(afterDelete(lanes, 6)).toBeNull()
    expect(afterDelete(lanes, 99)).toBeNull()
  })
})
