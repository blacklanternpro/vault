import { useRef, type PointerEvent, type RefObject } from 'react'
import { byId, type Doc } from '../speck/doc'
import { isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import type { LiveLeash } from './Filament'
import type { Settling } from './useBoardFlip'

/** Pointer travel a press has to cover before it stops being a tap. */
const THRESH = 7

export type DragKind = 'card' | 'nested'

type Drag = {
  id: number
  kind: DragKind
  origin: string
  startX: number
  startY: number
  live: boolean
}

type JobDragOptions = {
  doc: Doc
  /** Where the airborne end of the leash is, read by the filament every frame. */
  liveRef: RefObject<LiveLeash | null>
  /** Which card a drop is already landing, so the board does not land it twice. */
  settling: RefObject<Settling>
  setDragging: (on: boolean) => void
  onStage: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onPull: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onDock: (id: number, parentId: number) => void
  /** A press that never travelled far enough to be a drag. */
  onTap: (id: number, target: Element) => void
}

export type JobDrag = {
  /** `origin` is the selector for the element that gets lifted and cloned. */
  beginDrag: (e: PointerEvent<HTMLElement>, id: number, kind: DragKind, origin: string) => void
  onMove: (e: PointerEvent<HTMLElement>) => void
  finishDrag: (e: PointerEvent<HTMLElement>) => void
}

/**
 * One drag for the whole graph. A card lifts out of its lane and a subtask lifts
 * out of the drawer by the same gesture, so pulling a line of a job onto the
 * board — where it lands as a card still cabled to its parent — is the same
 * motion as moving a card between lanes, and docking it back reverses it.
 */
export function useJobDrag({
  doc,
  liveRef,
  settling,
  setDragging,
  onStage,
  onPull,
  onDock,
  onTap,
}: JobDragOptions): JobDrag {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLElement | null>(null)
  const originRef = useRef<HTMLElement | null>(null)

  function dropAt(clientX: number, clientY: number): { lane: ColName; beforeId: number | null } | null {
    const el = document.elementFromPoint(clientX, clientY)
    const laneEl = el instanceof Element ? el.closest('[data-lane]') : null
    if (!laneEl) return null
    const lane = laneEl.getAttribute('data-lane')
    if (!lane || !isBinderStatus(lane)) return null
    for (const item of laneEl.querySelectorAll('[data-card-id]')) {
      const id = Number(item.getAttribute('data-card-id'))
      const r = item.getBoundingClientRect()
      if (clientY < r.top + r.height / 2) return { lane, beforeId: id }
    }
    return { lane, beforeId: null }
  }

  /** Smallest slab under the pointer, so a satellite docks onto the card it lands on. */
  function dropDock(clientX: number, clientY: number, dragId: number): number | null {
    let best: { id: number; area: number } | null = null
    for (const el of document.querySelectorAll('[data-card-id]')) {
      const id = Number(el.getAttribute('data-card-id'))
      if (!Number.isFinite(id) || id === dragId) continue
      const r = el.getBoundingClientRect()
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) continue
      const area = r.width * r.height
      if (!best || area < best.area) best = { id, area }
    }
    return best?.id ?? null
  }

  /**
   * Where the dragged node's leash end sits while it is airborne. A satellite
   * pays out from its left edge; a parent card feeds from its right.
   */
  function pinFromGhost(kind: DragKind, id: number, ghost: HTMLElement) {
    const r = ghost.getBoundingClientRect()
    const sat = kind === 'nested' || Boolean(byId(doc, id)?.loose)
    liveRef.current = {
      id,
      parentId: byId(doc, id)?.parent ?? null,
      kind,
      x: sat ? r.left + 2 : r.right - 2,
      y: r.top + Math.min(14, r.height / 2),
    }
  }

  function releaseOrigin() {
    if (!originRef.current) return
    originRef.current.classList.remove('is-away')
    originRef.current.style.pointerEvents = ''
    originRef.current = null
  }

  /**
   * The airborne copy is not cut away on release: it travels the last stretch
   * into whatever the drop resolved to and fades out on top of it, so the eye
   * follows one object all the way down instead of losing it and finding it
   * again somewhere else. A drop that resolved to nothing goes home the same way.
   */
  function settle(ghost: HTMLElement, id: number | null, home: DOMRect | null) {
    const land = (r: DOMRect | null) => {
      if (!r) {
        ghost.remove()
        return
      }
      // Freeze the lift, then let the same frame's transition take it down.
      ghost.style.animation = 'none'
      ghost.style.transform = 'scale(1.025)'
      void ghost.offsetWidth
      ghost.style.transition =
        'left 190ms cubic-bezier(.2,.7,.3,1), top 190ms cubic-bezier(.2,.7,.3,1),' +
        'width 190ms cubic-bezier(.2,.7,.3,1), transform 190ms cubic-bezier(.2,.7,.3,1),' +
        // Front-loaded, because the real thing is already drawn underneath and
        // two of it is worse than losing the copy a little early.
        'opacity 140ms ease-out'
      ghost.style.left = `${r.left}px`
      ghost.style.top = `${r.top}px`
      ghost.style.width = `${r.width}px`
      ghost.style.transform = 'scale(1)'
      ghost.style.opacity = '0'
      window.setTimeout(() => ghost.remove(), 220)
    }
    if (id == null) {
      land(home)
      return
    }
    // One frame for the state to commit, one for the new box to be measurable.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const dest = document.querySelector(`[data-card-id="${id}"], [data-nested-id="${id}"]`)
        land(dest instanceof HTMLElement ? dest.getBoundingClientRect() : home)
      }),
    )
  }

  function beginDrag(e: PointerEvent<HTMLElement>, id: number, kind: DragKind, origin: string) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('input, textarea, button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, kind, origin, startX: e.clientX, startY: e.clientY, live: false }
  }

  function onMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.live && dx * dx + dy * dy < THRESH * THRESH) return
    drag.live = true
    if (!ghostRef.current) {
      const origin = e.currentTarget.closest(drag.origin)
      if (origin instanceof HTMLElement) {
        const r = origin.getBoundingClientRect()
        const ghost = origin.cloneNode(true) as HTMLElement
        ghost.style.position = 'fixed'
        ghost.style.left = `${r.left}px`
        ghost.style.top = `${r.top}px`
        ghost.style.width = `${r.width}px`
        ghost.style.pointerEvents = 'none'
        ghost.style.zIndex = '80'
        ghost.classList.add('is-ghost')
        origin.classList.add('is-away')
        origin.style.pointerEvents = 'none'
        originRef.current = origin
        document.body.appendChild(ghost)
        ghostRef.current = ghost
        drag.startX = e.clientX - r.left
        drag.startY = e.clientY - r.top
        setDragging(true)
      }
    }
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - drag.startX}px`
      ghostRef.current.style.top = `${e.clientY - drag.startY}px`
      pinFromGhost(drag.kind, drag.id, ghostRef.current)
    }
  }

  function finishDrag(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    const ghost = ghostRef.current
    dragRef.current = null
    ghostRef.current = null
    liveRef.current = null
    setDragging(false)
    e.stopPropagation()
    if (!drag || !drag.live) {
      ghost?.remove()
      releaseOrigin()
      if (!drag) return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      onTap(drag.id, el instanceof Element ? el : (e.target as Element))
      return
    }
    const dockId = dropDock(e.clientX, e.clientY, drag.id)
    const hit = dropAt(e.clientX, e.clientY)
    const home = originRef.current?.getBoundingClientRect() ?? null
    releaseOrigin()

    if (dockId != null && (drag.kind === 'nested' || Boolean(byId(doc, drag.id)?.loose))) {
      settling.current = { id: drag.id, at: performance.now() }
      onDock(drag.id, dockId)
      if (ghost) settle(ghost, drag.id, home)
      return
    }
    if (!hit) {
      if (ghost) settle(ghost, null, home)
      return
    }
    const before = hit.beforeId === drag.id ? undefined : hit.beforeId
    settling.current = { id: drag.id, at: performance.now() }
    if (drag.kind === 'nested') onPull(drag.id, hit.lane, before)
    else onStage(drag.id, hit.lane, before)
    if (ghost) settle(ghost, drag.id, home)
  }

  return { beginDrag, onMove, finishDrag }
}
