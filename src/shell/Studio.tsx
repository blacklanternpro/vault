import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addNested,
  applyHit,
  applyKey,
  applyNoteOrder,
  applyNoteText,
  commitFieldLine,
  commitLine,
  freshSession,
  hitchNote,
  pullCard,
  setProject,
  stageCard,
  typeField,
  type Result,
} from '../speck/machine'
import { parseDoc, projectIdOf, projectsOf } from '../speck/doc'
import type { Session } from '../speck/ir'
import { loadSource, saveSource } from '../speck/source'
import { Directory } from './Directory'
import { Manager } from './Manager'
import { Scratch } from './Scratch'

export function Studio() {
  const [session, setSession] = useState<Session>(() => freshSession())
  const [source, setSource] = useState(loadSource)
  const sessionRef = useRef(session)
  const sourceRef = useRef(source)
  sessionRef.current = session
  sourceRef.current = source

  const doc = useMemo(() => parseDoc(source), [source])
  const projectId = projectIdOf(doc, session.projectId)
  const projects = projectsOf(doc)
  const project = projectId != null ? doc.nodes.find((n) => n.id === projectId) : undefined

  useEffect(() => {
    saveSource(source)
  }, [source])

  function apply(result: Result) {
    sessionRef.current = result.session
    sourceRef.current = result.source
    setSession(result.session)
    setSource(result.source)
  }

  function setLive(next: Session) {
    sessionRef.current = next
    setSession(next)
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
          apply(applyKey('Tab', e.shiftKey, sessionRef.current, sourceRef.current))
        }
        return
      }
      if (!typing && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault()
        apply(applyKey(e.key, false, sessionRef.current, sourceRef.current))
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

  function commitTitle() {
    const r = commitFieldLine(sessionRef.current, sourceRef.current)
    apply({
      session: {
        ...r.session,
        field: null,
        fieldBuffer: '',
        draftId: null,
      },
      source: r.source,
    })
  }

  function onFieldBlur(id: number, slot: 'title' | 'body' | 'subtask' | 'status') {
    const live = sessionRef.current
    if (live.field?.id === id && live.field.slot !== slot) return
    if (live.draftId === id && !live.fieldBuffer.trim()) return
    commitTitle()
  }

  function onFindChange(value: string) {
    const cur = sessionRef.current
    const noting = cur.lens === 'dump' || cur.selected?.kind === 'NOTE' || cur.selected?.kind === 'DUMP'
    setLive({
      ...cur,
      buffer: value,
      find: noting ? cur.find : value.trim() || null,
      echo: null,
    })
  }

  function onFindSubmit() {
    apply(commitLine(sessionRef.current.buffer, sessionRef.current, sourceRef.current))
  }

  function onFindFocus() {
    setLive({
      ...sessionRef.current,
      lens: 'pipe',
      echo: null,
    })
  }

  return (
    <div className="studio" data-testid="studio">
      <div className="studio-main">
        <div className="studio-rack">
          <header className="rack-bar">
            <label className="rack-project">
              <span className="rack-label">PROJECT</span>
              <select
                aria-label="Project"
                data-testid="project-select"
                value={projectId ?? ''}
                onChange={(e) => apply(setProject(sessionRef.current, sourceRef.current, Number(e.target.value)))}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title.trim() || '_'}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rack-add"
              data-testid="project-add"
              onClick={() => hit('ADD', 0)}
            >
              ADD
            </button>
          </header>
          <p className="rack-name" data-testid="project-name">
            {project?.title.trim() || '_'}
          </p>
          <Manager
            doc={doc}
            session={session}
            onStage={(id, status, beforeId) =>
              apply(stageCard(sessionRef.current, sourceRef.current, id, status, beforeId))
            }
            onPull={(id, status, beforeId) =>
              apply(pullCard(sessionRef.current, sourceRef.current, id, status, beforeId))
            }
            onFocus={(id) => apply(commitLine(`FOCUS ${id}`, sessionRef.current, sourceRef.current))}
            onRename={(id) => hit('SLOT', `${id}:title`)}
            onEditBody={(id) => hit('SLOT', `${id}:body`)}
            onAddNested={(parentId) => apply(addNested(sessionRef.current, sourceRef.current, parentId))}
            onCreateJob={() => hit('EMPTY', 'pending')}
            onTitle={(value) => setLive(typeField(sessionRef.current, value))}
            onTitleCommit={commitTitle}
            onFieldBlur={onFieldBlur}
          />
        </div>
        <Directory
          doc={doc}
          session={session}
          onSelect={(id) => hit('STEM', id)}
          onRename={(id) => hit('STEM', id)}
          onToggle={(id) => hit('TOGGLE', id)}
          onAdd={(parent) => hit('ADD', parent ?? 0)}
          onShovel={(id) => hit('SHOVEL', id)}
          onClearFocus={() => apply(commitLine('FOCUS _', sessionRef.current, sourceRef.current))}
          onTitle={(value) => setLive(typeField(sessionRef.current, value))}
          onTitleCommit={commitTitle}
        />
      </div>
      <Scratch
        doc={doc}
        session={session}
        onFindChange={onFindChange}
        onFindSubmit={onFindSubmit}
        onFindFocus={onFindFocus}
        onNoteFocus={(index) =>
          setLive({
            ...sessionRef.current,
            selected: { kind: 'NOTE', index },
            lens: 'dump',
            echo: null,
          })
        }
        onNoteEdit={(index, text) => apply(applyNoteText(sessionRef.current, sourceRef.current, index, text))}
        onReorder={(from, to) => apply(applyNoteOrder(sessionRef.current, sourceRef.current, from, to))}
        onHitch={(index, nodeId) => apply(hitchNote(sessionRef.current, sourceRef.current, index, nodeId))}
        onUnhitch={(index) => apply(hitchNote(sessionRef.current, sourceRef.current, index, null))}
      />
    </div>
  )
}
