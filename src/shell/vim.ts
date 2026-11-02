import { LANES, type Lane } from '../model/types'

/*
 * The board's vim keys, as pure arithmetic over the lanes' card order. The
 * board measures the cards and does the focusing; this decides where to go.
 */

export type VimKey = 'down' | 'up' | 'left' | 'right' | 'shoveLeft' | 'shoveRight' | 'open' | 'delete'

export function vimKey(key: string, shift: boolean): VimKey | null {
  switch (key) {
    case 'j':
      return 'down'
    case 'k':
      return 'up'
    case 'h':
      return 'left'
    case 'l':
      return 'right'
    case 'H':
      return shift ? 'shoveLeft' : null
    case 'L':
      return shift ? 'shoveRight' : null
    case 'o':
      return 'open'
    case 'x':
      return 'delete'
    default:
      return null
  }
}

export type LaneCards = { lane: Lane; ids: number[] }

/**
 * Where j/k/h/l go from `from`. Down and up stay in the lane and stop at its
 * ends; left and right take the nearest card (by vertical centre, from
 * `centre`) in the next lane along that has any, and go nowhere past the last.
 * With nothing focused, the first card on the board.
 */
export function vimTarget(move: 'down' | 'up' | 'left' | 'right', lanes: LaneCards[], from: number | null, centre: (id: number) => number): number | null {
  const li = from == null ? -1 : lanes.findIndex((l) => l.ids.includes(from))
  if (li < 0 || from == null) {
    const first = lanes.find((l) => l.ids.length)
    return first ? first.ids[0] : null
  }
  const ids = lanes[li].ids
  const ci = ids.indexOf(from)
  if (move === 'down') return ids[Math.min(ids.length - 1, ci + 1)]
  if (move === 'up') return ids[Math.max(0, ci - 1)]
  const dir = move === 'left' ? -1 : 1
  for (let i = li + dir; i >= 0 && i < lanes.length; i += dir) {
    const there = lanes[i].ids
    if (!there.length) continue
    const y = centre(from)
    let best = there[0]
    let gap = Infinity
    for (const id of there) {
      const d = Math.abs(centre(id) - y)
      if (d < gap) {
        gap = d
        best = id
      }
    }
    return best
  }
  return null
}

/** The lane one step along, or null at either end. */
export function shoveLane(lane: Lane, dir: -1 | 1): Lane | null {
  return LANES[LANES.indexOf(lane) + dir] ?? null
}

/** After a card goes, the one that should hold focus: the next in its lane, else the one before. */
export function afterDelete(lanes: LaneCards[], id: number): number | null {
  const lane = lanes.find((l) => l.ids.includes(id))
  if (!lane) return null
  const i = lane.ids.indexOf(id)
  return lane.ids[i + 1] ?? lane.ids[i - 1] ?? null
}
