import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react'
import { useClock } from '../hooks/useClock'
import { useCrdtState, type VaultActions } from '../hooks/useCrdtState'
import { compile, DOCK_LAYOUT } from './compile'
import { hitTest, uid, type HitBox, type Now, type Session } from './ir'
import { applyHit, commitLine, freshSession, type Intent } from './machine'
import { makeMeasure, paint, sizeCanvas } from './paint'

function nowOf(d = new Date()): Now {
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

function dispatchIntent(
  intent: Intent,
  actions: VaultActions,
  fileRef: RefObject<HTMLInputElement | null>,
): void {
  switch (intent.type) {
    case 'ADD_SYS_LOG':
      actions.addSysLog({
        id: uid(),
        date: intent.date,
        text: intent.text,
        day: intent.day,
      })
      break
    case 'ADD_TASK':
      actions.addTask({
        id: uid(),
        text: intent.text,
        parentId: intent.parentId,
        priority: intent.priority,
      })
      break
    case 'ADD_NOTE':
      actions.addNote({
        id: uid(),
        date: intent.date,
        text: intent.text,
        attachment: intent.attachment,
      })
      break
    case 'TOGGLE_TASK':
      actions.toggleTask(intent.id)
      break
    case 'DELETE_SYS_LOG':
      actions.deleteSysLog(intent.id)
      break
    case 'ATTACH':
      fileRef.current?.click()
      break
  }
}

export function Field() {
  const clock = useClock()
  const crdt = useCrdtState()
  const [session, setSession] = useState<Session>(() => freshSession(nowOf()))
  const fieldRef = useRef<HTMLCanvasElement>(null)
  const dockRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sessionRef = useRef(session)
  const crdtRef = useRef(crdt)
  const clockRef = useRef(clock)
  sessionRef.current = session
  crdtRef.current = crdt
  clockRef.current = clock

  const applyIntents = (intents: Intent[]) => {
    for (const intent of intents) dispatchIntent(intent, crdtRef.current, fileRef)
  }

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
      const world = {
        snapshot: crdtRef.current,
        session: sessionRef.current,
        clock: clockRef.current,
        now: nowOf(),
        width,
        caretOn,
      }
      const fctx = sizeCanvas(field, width, Math.max(fieldH, 200))
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
      const result = applyHit(hit, sessionRef.current, crdtRef.current)
      setSession(result.session)
      applyIntents(result.intents)
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
          crdtRef.current,
          nowOf(),
        )
        setSession(result.session)
        applyIntents(result.intents)
        return
      }
      if (hit) {
        const result = applyHit(hit, sessionRef.current, crdtRef.current)
        setSession(result.session)
        applyIntents(result.intents)
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
    const result = commitLine(session.buffer, session, crdt, nowOf())
    setSession(result.session)
    applyIntents(result.intents)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = session.mode === 'DAY' ? e.target.value.toUpperCase() : e.target.value
    setSession((s) => ({ ...s, buffer: value, echo: null }))
  }

  const onAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const date = `${String(nowOf().month + 1).padStart(2, '0')}.${String(nowOf().day).padStart(2, '0')}.${String(nowOf().year).slice(-2)}`
    crdt.addNote({
      id: uid(),
      date,
      text: `[ATTACH] ${file.name}`,
      attachment: file.name,
    })
    setSession((s) => ({ ...s, mode: 'DUMP' }))
    e.target.value = ''
  }

  return (
    <div
      ref={hostRef}
      className={`speck-host ${session.inv ? 'speck-inv' : ''}`}
    >
      <div className="vault-grain" aria-hidden />
      <div className="vault-scan" aria-hidden />
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
            aria-label="SPECK prompt"
          />
        </form>
        <input ref={fileRef} type="file" className="speck-file" onChange={onAttach} />
      </div>
    </div>
  )
}
