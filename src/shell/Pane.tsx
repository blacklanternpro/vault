import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { clampDirWidth, DIR_MAX, DIR_MIN, DIR_STEP } from './paneWidth'

/*
 * Dragging the handle writes the CSS variable straight onto the stage frame by
 * frame and hands the final width up once, so the board is not re-rendered for
 * every pixel of travel.
 */

type PaneHandleProps = {
  width: number
  /** The width settled on, after a drag ends or a key moves it. */
  onWidth: (width: number) => void
}

/** The hairline between the directory and the board, draggable; arrow keys move it 16px at a time. */
export function PaneHandle({ width, onWidth }: PaneHandleProps) {
  const start = useRef<{ x: number; w: number } | null>(null)

  function stage(el: HTMLElement): HTMLElement | null {
    return el.closest<HTMLElement>('.stage')
  }

  function paint(el: HTMLElement, w: number) {
    stage(el)?.style.setProperty('--dir-width', `${w}px`)
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, w: width }
    e.currentTarget.classList.add('is-dragging')
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const s = start.current
    if (!s) return
    paint(e.currentTarget, clampDirWidth(s.w + e.clientX - s.x))
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    const s = start.current
    start.current = null
    e.currentTarget.classList.remove('is-dragging')
    if (!s) return
    const w = clampDirWidth(s.w + e.clientX - s.x)
    paint(e.currentTarget, w)
    onWidth(w)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const w = clampDirWidth(width + (e.key === 'ArrowLeft' ? -DIR_STEP : DIR_STEP))
    paint(e.currentTarget, w)
    onWidth(w)
  }

  return (
    <div
      className="pane-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Directory width"
      aria-valuenow={width}
      aria-valuemin={DIR_MIN}
      aria-valuemax={DIR_MAX}
      tabIndex={0}
      data-testid="pane-handle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    />
  )
}
