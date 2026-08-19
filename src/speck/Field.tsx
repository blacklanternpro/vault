import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { compile, DOCK_LAYOUT } from './compile'
import { hitTest, type HitBox, type Now, type Session } from './ir'
import { applyHit, commitLine, focusHit, freshSession } from './machine'
import { makeMeasure, paint, sizeCanvas } from './paint'
import { loadSource, saveSource } from './source'

const LONG_PRESS_MS = 480
const DRAG_SLOP = 10

function nowOf(d = new Date()): Now {
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hh: d.getHours(),
    mm: d.getMinutes(),
  }
}

export function Field() {
  const [session, setSession] = useState<Session>(() => freshSession())
  const [source, setSource] = useState(loadSource)
  const fieldRef = useRef<HTMLCanvasElement>(null)
  const dockRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionRef = useRef(session)
  const sourceRef = useRef(source)
  sessionRef.current = session
  sourceRef.current = source

  useEffect(() => {
    saveSource(source)
  }, [source])

  useEffect(() => {
    const host = hostRef.current
    const field = fieldRef.current
    const dock = dockRef.current
    if (!host || !field || !dock) return

    let raf = 0
    let fieldH = 400
    let dockH = DOCK_LAYOUT.h
    let fieldHits: HitBox[] = []
    let dockHits: HitBox[] = []

    const frame = () => {
      const width = host.clientWidth || 360
      const caretOn = Date.now() % 1000 < 550
      // full viewport: the paper runs behind the dock and off the bottom edge
      const viewH = Math.max(320, window.innerHeight)
      const world = {
        source: sourceRef.current,
        session: sessionRef.current,
        now: nowOf(),
        width,
        viewH,
        caretOn,
      }
      const fctx = sizeCanvas(field, width, Math.max(fieldH, viewH))
      if (!fctx) {
        raf = requestAnimationFrame(frame)
        return
      }
      const measure = makeMeasure(fctx)
      const program = compile(world, measure)
      fieldH = program.field.h
      dockH = program.dock.h
      fieldHits = program.field.hits
      dockHits = program.dock.hits
      sizeCanvas(field, width, fieldH)
      paint(fctx, program.field.ops, width, fieldH)

      const dctx = sizeCanvas(dock, width, dockH)
      if (dctx) paint(dctx, program.dock.ops, width, dockH)

      host.style.setProperty('--speck-dock-h', `${dockH}px`)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const run = (fn: (s: Session, src: string) => { session: Session; source: string }) => {
      const result = fn(sessionRef.current, sourceRef.current)
      setSession(result.session)
      setSource(result.source)
    }

    // Field taps land on pointerup so a drag scrolls instead of firing,
    // and so a long press can claim the row first.
    let pending: { hit: HitBox; x: number; y: number } | null = null
    let timer = 0
    let claimed = false

    const clearPending = () => {
      pending = null
      claimed = false
      if (timer) {
        window.clearTimeout(timer)
        timer = 0
      }
    }

    const onFieldDown = (e: PointerEvent) => {
      const rect = field.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const hit = hitTest(fieldHits, x, y)
      if (!hit) return
      pending = { hit, x: e.clientX, y: e.clientY }
      claimed = false
      if (hit.kind === 'ROW' && hit.payload) {
        const path = String(hit.payload)
        timer = window.setTimeout(() => {
          claimed = true
          run((s, src) => focusHit(s, src, path))
        }, LONG_PRESS_MS)
      }
    }

    const onFieldMove = (e: PointerEvent) => {
      if (!pending) return
      if (Math.abs(e.clientX - pending.x) > DRAG_SLOP || Math.abs(e.clientY - pending.y) > DRAG_SLOP) {
        clearPending()
      }
    }

    const onFieldUp = () => {
      if (!pending) return
      const { hit } = pending
      const wasClaimed = claimed
      clearPending()
      if (wasClaimed) return
      run((s, src) => applyHit(hit, s, src, nowOf()))
      if (hit.kind === 'PLUS') inputRef.current?.focus()
    }

    const onDock = (e: PointerEvent) => {
      const rect = dock.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const hit = hitTest(dockHits, x, y)
      if (hit?.kind === 'COMMIT') {
        run((s, src) => commitLine(s.buffer, s, src, nowOf()))
        return
      }
      if (hit) run((s, src) => applyHit(hit, s, src, nowOf()))
      inputRef.current?.focus()
    }

    field.addEventListener('pointerdown', onFieldDown)
    field.addEventListener('pointermove', onFieldMove)
    field.addEventListener('pointerup', onFieldUp)
    field.addEventListener('pointercancel', clearPending)
    dock.addEventListener('pointerdown', onDock)
    return () => {
      cancelAnimationFrame(raf)
      clearPending()
      field.removeEventListener('pointerdown', onFieldDown)
      field.removeEventListener('pointermove', onFieldMove)
      field.removeEventListener('pointerup', onFieldUp)
      field.removeEventListener('pointercancel', clearPending)
      dock.removeEventListener('pointerdown', onDock)
    }
  }, [])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = commitLine(session.buffer, session, source, nowOf())
    setSession(result.session)
    setSource(result.source)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSession((s) => ({ ...s, buffer: e.target.value, echo: null }))
  }

  return (
    <div ref={hostRef} className="speck-host">
      <canvas ref={fieldRef} className="speck-field" aria-label="VAULT slip" />
      <div className="speck-dock">
        <canvas ref={dockRef} className="speck-dock-canvas" aria-hidden />
        <form className="speck-dock-form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className="speck-dock-input"
            value={session.buffer}
            onChange={onChange}
            autoComplete="off"
            enterKeyHint="send"
            spellCheck={false}
            aria-label="item"
          />
        </form>
      </div>
    </div>
  )
}
