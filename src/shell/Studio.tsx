import { useEffect, useMemo, useRef, useState } from 'react'
import {
  applyHit,
  applyKey,
  applyNoteOrder,
  applyNoteText,
  commitFieldLine,
  commitLine,
  freshSession,
  stageCard,
  typeField,
  type Result,
} from '../speck/machine'
import { parseDoc } from '../speck/doc'
import type { Session } from '../speck/ir'
import { loadSource, saveSource } from '../speck/source'
import type { ColName } from '../speck/tokens'
import { Directory } from './Directory'
import { Manager } from './Manager'
import { Scratch } from './Scratch'

export function Studio() {
  const [session, setSession] = useState<Session>(() => freshSession())
  const [source, setSource] = useState(loadSource)
  const sessionRef = useRef(session)
  const sourceRef = useRef(source)
  const hostRef = useRef<HTMLDivElement>(null)
  sessionRef.current = session
  sourceRef.current = source

  const doc = useMemo(() => parseDoc(source), [source])

  useEffect(() => {
    saveSource(source)
  }, [source])

  function apply(result: Result) {
    setSession(result.session)
    setSource(result.source)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const tag = t?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'
      const inFind = Boolean(t?.closest('.studio-find'))
      const inScratch = Boolean(t?.closest('.scratch-text'))
      if (e.key === 'Escape') {
        if (typing) {
          if (sessionRef.current.field) apply(applyKey('Escape', false, sessionRef.current, sourceRef.current))
          t?.blur()
        } else {
          apply(applyKey('Escape', false, sessionRef.current, sourceRef.current))
        }
        return
      }
      if (inFind || inScratch) return
      if (typing && sessionRef.current.field) {
        if (e.key === 'Tab') {
          e.preventDefault()
          if (sessionRef.current.lens === 'nest') {
            apply(applyKey('Tab', e.shiftKey, sessionRef.current, sourceRef.current))
          } else {
            apply(commitFieldLine(sessionRef.current, sourceRef.current))
          }
        }
        return
      }
      const keys = ['Tab', ' ', '[', ']', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
      if (!keys.includes(e.key)) return
      if (e.key === 'Tab' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
      const nestSession =
        sessionRef.current.lens === 'nest'
          ? sessionRef.current
          : { ...sessionRef.current, lens: 'nest' as const }
      const result = applyKey(e.key, e.shiftKey, nestSession, sourceRef.current)
      apply(result)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function hit(
    kind: 'NODE' | 'STEM' | 'ADD' | 'TOGGLE' | 'SHOVEL' | 'EMPTY' | 'SLOT' | 'FIELD',
    payload: string | number,
  ) {
    apply(
      applyHit(
        { kind, x: 0, y: 0, w: 10, h: 10, z: 10, payload },
        sessionRef.current,
        sourceRef.current,
      ),
    )
  }

  function onFindChange(value: string) {
    const noting = session.lens === 'dump' || session.selected?.kind === 'NOTE' || session.selected?.kind === 'DUMP'
    setSession({
      ...session,
      buffer: value,
      find: noting ? session.find : value.trim() || null,
      echo: null,
    })
  }

  function onFindSubmit() {
    apply(commitLine(sessionRef.current.buffer, sessionRef.current, sourceRef.current))
  }

  function onFindFocus() {
    setSession({
      ...session,
      lens: 'pipe',
      echo: null,
    })
  }

  return (
    <div className="studio" ref={hostRef} data-testid="studio">
      <div className="studio-main">
        <Manager
          doc={doc}
          session={session}
          onStage={(id, status, beforeId) => apply(stageCard(sessionRef.current, sourceRef.current, id, status, beforeId))}
          onFocus={(id) => apply(commitLine(`FOCUS ${id}`, sessionRef.current, sourceRef.current))}
          onRename={(id) => hit('SLOT', `${id}:title`)}
          onCreate={(status: ColName) => hit('EMPTY', status)}
          onTitle={(value) => setSession(typeField(session, value))}
          onTitleCommit={() => apply(commitFieldLine(sessionRef.current, sourceRef.current))}
        />
        <Directory
          doc={doc}
          session={session}
          onSelect={(id) => hit('STEM', id)}
          onRename={(id) => hit('STEM', id)}
          onToggle={(id) => hit('TOGGLE', id)}
          onAdd={(parent) => hit('ADD', parent ?? 0)}
          onShovel={(id) => hit('SHOVEL', id)}
          onClearFocus={() => apply(commitLine('FOCUS _', sessionRef.current, sourceRef.current))}
          onTitle={(value) => setSession(typeField(session, value))}
          onTitleCommit={() => apply(commitFieldLine(sessionRef.current, sourceRef.current))}
        />
      </div>
      <Scratch
        doc={doc}
        session={session}
        onFindChange={onFindChange}
        onFindSubmit={onFindSubmit}
        onFindFocus={onFindFocus}
        onNoteFocus={(index) =>
          setSession({
            ...session,
            selected: { kind: 'NOTE', index },
            lens: 'dump',
            echo: null,
          })
        }
        onNoteEdit={(index, text) => apply(applyNoteText(sessionRef.current, sourceRef.current, index, text))}
        onReorder={(from, to) => apply(applyNoteOrder(sessionRef.current, sourceRef.current, from, to))}
      />
    </div>
  )
}
