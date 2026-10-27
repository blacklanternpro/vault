import { useLayoutEffect, useRef, type RefObject } from 'react'

/** Below this a card has not moved; the browser has only re-laid it out. */
const MOVED = 1.5

/**
 * A drop already flies its own copy into the landing spot, so the card under it
 * must not slide there as well. The drag records which card that is and when,
 * and the board leaves that one alone while still moving everything the same
 * change pushed out of the way.
 */
export type Settling = { id: number; at: number } | null

/** How long a drop's own landing owns the card it is landing. */
const SETTLE_MS = 500

type Spot = { x: number; y: number }

/**
 * Cards change lane by a verb, not only by hand: shovel one on and it belongs
 * somewhere else, the cards under it in the old lane close up, and the new lane
 * opens to take it. Cutting straight to the result loses which card went where,
 * so every card that moved is put back where it was for one frame and then let
 * go of. Reduced motion is answered by the sheet, which holds every duration to
 * nothing, so this same code arrives instantly there.
 */
export function useBoardFlip(host: RefObject<HTMLElement | null>, graph: unknown, settling: RefObject<Settling>): void {
  const spots = useRef(new Map<string, Spot>())

  useLayoutEffect(() => {
    const root = host.current
    if (!root) return

    const base = root.getBoundingClientRect()
    const next = new Map<string, Spot>()
    const moved: Array<[HTMLElement, number, number]> = []
    const flying =
      settling.current && performance.now() - settling.current.at < SETTLE_MS ? String(settling.current.id) : null

    for (const el of root.querySelectorAll<HTMLElement>('[data-card-id]')) {
      const id = el.dataset.cardId
      if (!id) continue
      const box = el.getBoundingClientRect()
      /*
       * Measured against the board's own content rather than the viewport, so
       * its sideways scroll cannot read as every card having moved at once.
       */
      const spot = {
        x: box.left - base.left + root.scrollLeft,
        y: box.top - base.top + root.scrollTop,
      }
      const was = spots.current.get(id)
      next.set(id, spot)
      if (!was || id === flying) continue
      const dx = was.x - spot.x
      const dy = was.y - spot.y
      if (Math.abs(dx) > MOVED || Math.abs(dy) > MOVED) moved.push([el, dx, dy])
    }
    spots.current = next
    if (!moved.length) return

    for (const [el, dx, dy] of moved) {
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
    }
    // One frame holding the old place, then let go of it.
    const play = requestAnimationFrame(() => {
      for (const [el] of moved) {
        el.style.transition = 'transform 260ms cubic-bezier(0.2, 0.7, 0.3, 1)'
        el.style.transform = ''
      }
    })
    // Handed back to the sheet, which owns the card's border and background.
    const release = window.setTimeout(() => {
      for (const [el] of moved) el.style.transition = ''
    }, 300)

    return () => {
      cancelAnimationFrame(play)
      window.clearTimeout(release)
      for (const [el] of moved) {
        el.style.transition = ''
        el.style.transform = ''
      }
    }
  }, [graph, host, settling])
}
