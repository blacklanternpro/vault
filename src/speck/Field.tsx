import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { compile, DOCK_LAYOUT } from './compile'
import { hitTest, type HitBox, type Now, type Session } from './ir'
import { applyHit, commitLine, freshSession } from './machine'
import { makeMeasure, paint, sizeCanvas } from './paint'
import { loadSource, saveSource } from './source'

function nowOf(d = new Date()): Now {
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
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
      const caretOn = Date.now() % 900 < 450
      const viewH = Math.max(240, (host.clientHeight || 640) - dockH)
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

    const onField = (e: PointerEvent) => {
      const rect = field.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const hit = hitTest(fieldHits, x, y)
      if (!hit) return
      const result = applyHit(hit, sessionRef.current, sourceRef.current, nowOf())
      setSession(result.session)
      setSource(result.source)
      inputRef.current?.focus()
    }
    const onDock = (e: PointerEvent) => {
      const rect = dock.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const hit = hitTest(dockHits, x, y)
      if (hit?.kind === 'COMMIT') {
        const result = commitLine(
          sessionRef.current.buffer,
          sessionRef.current,
          sourceRef.current,
          nowOf(),
        )
        setSession(result.session)
        setSource(result.source)
        return
      }
      if (hit) {
        const result = applyHit(hit, sessionRef.current, sourceRef.current, nowOf())
        setSession(result.session)
        setSource(result.source)
      }
      inputRef.current?.focus()
    }

    field.addEventListener('pointerdown', onField)
    dock.addEventListener('pointerdown', onDock)
    return () => {
      cancelAnimationFrame(raf)
      field.removeEventListener('pointerdown', onField)
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
