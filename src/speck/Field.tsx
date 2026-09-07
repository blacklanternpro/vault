import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { compile, DOCK_LAYOUT } from './compile'
import { parseDoc, placeOf } from './doc'
import { hitTest, type HitBox, type OrganName, type Session } from './ir'
import { applyHit, commitLine, freshSession, placeOrgan } from './machine'
import { makeMeasure, paint, sizeCanvas } from './paint'
import { loadSource, saveSource } from './source'

type Drag = {
  organ: OrganName
  origX: number
  origY: number
  startX: number
  startY: number
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
  const drawRef = useRef<() => void>(() => {})
  const hitsRef = useRef<{ field: HitBox[]; dock: HitBox[] }>({ field: [], dock: [] })
  const dragRef = useRef<Drag | null>(null)
  sessionRef.current = session
  sourceRef.current = source

  useEffect(() => {
    saveSource(source)
  }, [source])

  useEffect(() => {
    drawRef.current()
  }, [session, source])

  useEffect(() => {
    const host = hostRef.current
    const field = fieldRef.current
    const dock = dockRef.current
    if (!host || !field || !dock) return

    let caretOn = true
    let dockH = DOCK_LAYOUT.h

    const frame = () => {
      const width = host.clientWidth || 1200
      const viewH = Math.max(240, (host.clientHeight || 800) - dockH)
      const world = {
        source: sourceRef.current,
        session: sessionRef.current,
        width,
        viewH,
        caretOn,
      }
      const fctx = sizeCanvas(field, width, Math.max(viewH, 400))
      if (!fctx) return
      const measure = makeMeasure(fctx)
      const program = compile(world, measure)
      dockH = program.dock.h
      hitsRef.current = { field: program.field.hits, dock: program.dock.hits }
      sizeCanvas(field, width, program.field.h)
      paint(fctx, program.field.ops, width, program.field.h)

      const dctx = sizeCanvas(dock, width, dockH)
      if (dctx) paint(dctx, program.dock.ops, width, dockH)
      host.style.setProperty('--speck-dock-h', `${dockH}px`)
    }
    drawRef.current = frame
    frame()

    const caret = window.setInterval(() => {
      caretOn = !caretOn
      frame()
    }, 450)
    const ro = new ResizeObserver(() => frame())
    ro.observe(host)

    const onField = (e: PointerEvent) => {
      const rect = field.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const hit = hitTest(hitsRef.current.field, x, y)
      if (!hit) return
      if (hit.kind === 'ORGAN') {
        const organ = (String(hit.payload ?? 'PIPE') || 'PIPE') as OrganName
        const at = placeOf(parseDoc(sourceRef.current), organ)
        dragRef.current = {
          organ,
          origX: at.x,
          origY: at.y,
          startX: x,
          startY: y,
        }
        field.setPointerCapture(e.pointerId)
      }
      const result = applyHit(hit, sessionRef.current, sourceRef.current)
      setSession(result.session)
      setSource(result.source)
      inputRef.current?.focus()
    }
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const rect = field.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const nx = drag.origX + (x - drag.startX)
      const ny = drag.origY + (y - drag.startY)
      setSource(placeOrgan(sourceRef.current, drag.organ, nx, ny))
    }
    const onUp = () => {
      dragRef.current = null
    }
    const onDock = (e: PointerEvent) => {
      const rect = dock.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const hit = hitTest(hitsRef.current.dock, x, y)
      if (hit?.kind === 'COMMIT') {
        const result = commitLine(
          sessionRef.current.buffer,
          sessionRef.current,
          sourceRef.current,
        )
        setSession(result.session)
        setSource(result.source)
        return
      }
      if (hit) {
        const result = applyHit(hit, sessionRef.current, sourceRef.current)
        setSession(result.session)
        setSource(result.source)
      }
      inputRef.current?.focus()
    }

    field.addEventListener('pointerdown', onField)
    field.addEventListener('pointermove', onMove)
    field.addEventListener('pointerup', onUp)
    field.addEventListener('pointercancel', onUp)
    dock.addEventListener('pointerdown', onDock)
    return () => {
      window.clearInterval(caret)
      ro.disconnect()
      field.removeEventListener('pointerdown', onField)
      field.removeEventListener('pointermove', onMove)
      field.removeEventListener('pointerup', onUp)
      field.removeEventListener('pointercancel', onUp)
      dock.removeEventListener('pointerdown', onDock)
    }
  }, [])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = commitLine(session.buffer, session, source)
    setSession(result.session)
    setSource(result.source)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSession((s) => ({ ...s, buffer: e.target.value, echo: null }))
  }

  return (
    <div ref={hostRef} className="speck-host">
      <canvas ref={fieldRef} className="speck-field" aria-label="VAULT field" />
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
            aria-label="note"
          />
        </form>
      </div>
    </div>
  )
}
