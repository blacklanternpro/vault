import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { compile, DOCK_LAYOUT } from './compile'
import { parseDoc, placeOf } from './doc'
import { hitTest, isOrganName, type EditBox, type HitBox, type OrganName, type Session } from './ir'
import {
  applyHit,
  applyKey,
  commitFieldLine,
  commitLine,
  freshSession,
  placeOrgan,
  typeField,
} from './machine'
import { paintMaterial } from './material'
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
  const [editBox, setEditBox] = useState<EditBox | null>(null)
  const fieldRef = useRef<HTMLCanvasElement>(null)
  const materialRef = useRef<HTMLCanvasElement>(null)
  const dockRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cellRef = useRef<HTMLInputElement>(null)
  const sessionRef = useRef(session)
  const sourceRef = useRef(source)
  const drawRef = useRef<() => void>(() => {})
  const hitsRef = useRef<{ field: HitBox[]; dock: HitBox[] }>({ field: [], dock: [] })
  const dragRef = useRef<Drag | null>(null)
  const editKeyRef = useRef('')
  sessionRef.current = session
  sourceRef.current = source

  useEffect(() => {
    saveSource(source)
  }, [source])

  useEffect(() => {
    drawRef.current()
  }, [session, source])

  useEffect(() => {
    if (session.field) cellRef.current?.focus()
  }, [session.field])

  useEffect(() => {
    const host = hostRef.current
    const field = fieldRef.current
    const material = materialRef.current
    const dock = dockRef.current
    if (!host || !field || !material || !dock) return

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
      paintMaterial(material, width, program.field.h, program.grain, program.scan)

      const dctx = sizeCanvas(dock, width, dockH)
      if (dctx) paint(dctx, program.dock.ops, width, dockH)
      host.style.setProperty('--speck-dock-h', `${dockH}px`)
      host.style.setProperty('--speck-dock-input-y', `${program.dockInput.y}px`)
      host.style.setProperty('--speck-dock-input-h', `${program.dockInput.h}px`)
      host.style.setProperty('--speck-dock-input-x', `${program.dockInput.x}px`)
      host.style.setProperty('--speck-ground', program.inv ? '#F4F4F0' : '#000000')
      host.style.setProperty('--speck-ink', program.inv ? '#000000' : '#F4F4F0')
      const box = program.editBox
      const key = box ? `${box.x}:${box.y}:${box.w}:${box.h}:${box.slot}` : ''
      if (key !== editKeyRef.current) {
        editKeyRef.current = key
        setEditBox(box)
      }
    }
    drawRef.current = frame
    void document.fonts.load('700 32px Oswald').finally(() => frame())
    void document.fonts.ready.then(() => frame())
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
        const raw = String(hit.payload ?? 'PIPE')
        const organ = (isOrganName(raw) ? raw : 'PIPE') as OrganName
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
      if (result.session.field) queueMicrotask(() => cellRef.current?.focus())
      else inputRef.current?.focus()
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
        const result = commitLine(sessionRef.current.buffer, sessionRef.current, sourceRef.current)
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

    const onWinKey = (e: globalThis.KeyboardEvent) => {
      if (sessionRef.current.field) return
      const keys = ['Escape', 'Tab', ' ', '[', ']', 'ArrowLeft', 'ArrowRight']
      if (!keys.includes(e.key)) return
      if (e.key === 'Tab' || e.key === ' ') e.preventDefault()
      const result = applyKey(e.key, e.shiftKey, sessionRef.current, sourceRef.current)
      setSession(result.session)
      setSource(result.source)
    }
    window.addEventListener('keydown', onWinKey)

    field.addEventListener('pointerdown', onField)
    field.addEventListener('pointermove', onMove)
    field.addEventListener('pointerup', onUp)
    field.addEventListener('pointercancel', onUp)
    dock.addEventListener('pointerdown', onDock)
    return () => {
      window.clearInterval(caret)
      ro.disconnect()
      window.removeEventListener('keydown', onWinKey)
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

  const onCellSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = commitFieldLine(session, source)
    setSession(result.session)
    setSource(result.source)
  }

  const onCellChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSession((s) => typeField(s, e.target.value))
  }

  const onCellKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault()
      const result = applyKey(e.key, e.shiftKey, session, source)
      setSession(result.session)
      setSource(result.source)
      return
    }
    if (e.key === 'Backspace' && !session.fieldBuffer) {
      const result = applyKey('Backspace', false, session, source)
      if (result.session.draftId == null && session.draftId != null) {
        e.preventDefault()
        setSession(result.session)
        setSource(result.source)
      }
    }
  }

  return (
    <div ref={hostRef} className="speck-host">
      <canvas ref={fieldRef} className="speck-field" aria-label="VAULT field" />
      <canvas ref={materialRef} className="speck-material" aria-hidden />
      {session.field && editBox ? (
        <form
          className="speck-cell"
          style={{
            left: editBox.x,
            top: editBox.y,
            width: editBox.w,
            height: editBox.h,
          }}
          onSubmit={onCellSubmit}
        >
          <input
            ref={cellRef}
            className="speck-cell-input"
            value={session.fieldBuffer}
            onChange={onCellChange}
            onKeyDown={onCellKey}
            autoComplete="off"
            spellCheck={false}
            aria-label={session.field.slot}
          />
        </form>
      ) : null}
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
            aria-label="operator"
          />
        </form>
      </div>
    </div>
  )
}
