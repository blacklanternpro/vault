import { useEffect, useMemo, useRef, useState } from 'react'
import type { LiveLeash } from './Filament'
import { useJobDrag } from './useJobDrag'
import {
  addNested,
  addScratch,
  applyHit,
  applyKey,
  applyNoteOrder,
  applyNoteText,
  commitFieldLine,
  commitLine,
  dockCard,
  freshSession,
  hitchNote,
  pullCard,
  searchFind,
  selectNode,
  stageCard,
  typeField,
  type Result,
} from '../speck/machine'
import { byId, parseDoc, projectsOf } from '../speck/doc'
import type { Session } from '../speck/ir'
import { loadSource, saveSource } from '../speck/source'
import type { ColName, NodeStatus } from '../speck/tokens'
import { Board } from './Board'
import { Directory } from './Directory'
import { Drawer } from './Drawer'
import { Scratch } from './Scratch'
import { TopBar } from './TopBar'

export function Studio() {
  const [session, setSession] = useState<Session>(() => freshSession())
  const [source, setSource] = useState(loadSource)
  const [filterId, setFilterId] = useState<number | null>(null)
  const [laneFilter, setLaneFilter] = useState<ColName | null>(null)
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [dragging, setDragging] = useState(false)
  const sessionRef = useRef(session)
  const sourceRef = useRef(source)
  const liveRef = useRef<LiveLeash | null>(null)
  sessionRef.current = session
  sourceRef.current = source

  const doc = useMemo(() => parseDoc(source), [source])
  const projects = projectsOf(doc)
  const open = session.pipeOpen != null ? byId(doc, session.pipeOpen) : undefined
  const openJob = open && open.parent != null ? open : undefined

  const hits = useMemo(() => {
    const q = session.find?.trim().toLowerCase()
    if (!q) return null
    return doc.nodes.filter((n) => n.title.toLowerCase().includes(q)).length
  }, [doc, session.find])

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
      const inScratch = Boolean(t?.closest('.note-text'))
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.find-input')?.focus()
        return
      }
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
      const folioOpen = sessionRef.current.pipeOpen != null
      const nestSession =
        sessionRef.current.lens === 'nest' || folioOpen
          ? sessionRef.current
          : { ...sessionRef.current, lens: 'nest' as const }
      apply(applyKey(e.key, e.shiftKey, nestSession, sourceRef.current))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function hit(
    kind: 'NODE' | 'STEM' | 'ADD' | 'TOGGLE' | 'SHOVEL' | 'EMPTY' | 'SLOT' | 'FIELD' | 'STATUS',
    payload: string | number,
  ) {
    apply(applyHit({ kind, x: 0, y: 0, w: 10, h: 10, z: 10, payload }, sessionRef.current, sourceRef.current))
  }

  function commitTitle() {
    const r = commitFieldLine(sessionRef.current, sourceRef.current)
    apply({
      session: { ...r.session, field: null, fieldBuffer: '', draftId: null },
      source: r.source,
    })
  }

  function onFieldBlur(id: number, slot: 'title' | 'body' | 'subtask' | 'status') {
    const live = sessionRef.current
    if (live.field?.id === id && live.field.slot !== slot) return
    if (live.draftId === id && !live.fieldBuffer.trim()) return
    commitTitle()
  }

  function onQueryChange(value: string) {
    setLive({ ...sessionRef.current, buffer: value, find: value.trim() || null, echo: null })
  }

  /*
   * The gesture is shared between the board and the drawer, so a card and a
   * line of a card lift the same way and the filament sees either one.
   */
  const drag = useJobDrag({
    doc,
    liveRef,
    setDragging,
    onStage: (id, status, beforeId) => apply(stageCard(sessionRef.current, sourceRef.current, id, status, beforeId)),
    onPull: (id, status, beforeId) => apply(pullCard(sessionRef.current, sourceRef.current, id, status, beforeId)),
    onDock: (id, parentId) => apply(dockCard(sessionRef.current, sourceRef.current, id, parentId)),
    onTap: (id, target) => {
      // A tap on a name that is already the open one puts the caret in it.
      const inDrawer = Boolean(target.closest('[data-nested-id]'))
      if (inDrawer || (target.closest('[data-title]') && sessionRef.current.pipeOpen === id)) {
        hit('SLOT', `${id}:title`)
        return
      }
      hit('NODE', id)
    },
  })

  return (
    <div className="studio" data-testid="studio">
      <div className="field">
        <TopBar
          query={session.buffer || session.find || ''}
          hits={hits}
          projects={projects}
          filterId={filterId}
          laneFilter={laneFilter}
          urgentOnly={urgentOnly}
          onQueryChange={onQueryChange}
          onQuerySubmit={() => apply(searchFind(sessionRef.current, sourceRef.current, sessionRef.current.buffer))}
          onQueryFocus={() => setLive({ ...sessionRef.current, lens: 'pipe', echo: null })}
          onFilterChange={setFilterId}
          onLaneFilterChange={setLaneFilter}
          onUrgentOnlyChange={setUrgentOnly}
          onNewJob={() => hit('EMPTY', 'pending')}
        />

        <div className={`stage${openJob ? ' has-drawer' : ''}`}>
          <Board
            doc={doc}
            session={session}
            filterId={filterId}
            laneFilter={laneFilter}
            urgentOnly={urgentOnly}
            drag={drag}
            liveRef={liveRef}
            dragging={dragging}
            onCreateJob={(status) => hit('EMPTY', status)}
            onTitle={(value) => setLive(typeField(sessionRef.current, value))}
            onTitleCommit={commitTitle}
            onFieldBlur={onFieldBlur}
          />

          {openJob ? (
            <Drawer
              /* A different job is a different drawer, so it arrives rather than cutting. */
              key={openJob.id}
              doc={doc}
              session={session}
              node={openJob}
              drag={drag}
              onClose={() => apply(applyKey('Escape', false, sessionRef.current, sourceRef.current))}
              onShovel={(id) => hit('SHOVEL', id)}
              onRename={(id) => hit('SLOT', `${id}:title`)}
              onEditBody={(id) => hit('SLOT', `${id}:body`)}
              onAddNested={(parentId) => apply(addNested(sessionRef.current, sourceRef.current, parentId))}
              onSetStatus={(id, status: NodeStatus) => hit('STATUS', `${id}:${status}`)}
              onOpenFolder={setFilterId}
              onTitle={(value) => setLive(typeField(sessionRef.current, value))}
              onTitleCommit={commitTitle}
              onFieldBlur={onFieldBlur}
            />
          ) : null}
        </div>
      </div>

      <div className="catalogue">
        <Directory
          doc={doc}
          session={session}
          onSelect={(id) => apply(selectNode(sessionRef.current, sourceRef.current, id))}
          onRename={(id) => hit('SLOT', `${id}:title`)}
          onToggle={(id) => hit('TOGGLE', id)}
          onAdd={(parent) => hit('ADD', parent ?? 0)}
          onStage={(id, status) => apply(stageCard(sessionRef.current, sourceRef.current, id, status))}
          onShovel={(id) => hit('SHOVEL', id)}
          onClearFocus={() => apply(commitLine('FOCUS _', sessionRef.current, sourceRef.current))}
          onTitle={(value) => setLive(typeField(sessionRef.current, value))}
          onTitleCommit={commitTitle}
        />
        <Scratch
          doc={doc}
          session={session}
          onAddNote={() => apply(addScratch(sessionRef.current, sourceRef.current))}
          onNoteFocus={(index) =>
            setLive({ ...sessionRef.current, selected: { kind: 'NOTE', index }, lens: 'dump', echo: null })
          }
          onNoteEdit={(index, text) => apply(applyNoteText(sessionRef.current, sourceRef.current, index, text))}
          onReorder={(from, to) => apply(applyNoteOrder(sessionRef.current, sourceRef.current, from, to))}
          onHitch={(index, nodeId) => apply(hitchNote(sessionRef.current, sourceRef.current, index, nodeId))}
          onUnhitch={(index) => apply(hitchNote(sessionRef.current, sourceRef.current, index, null))}
        />
      </div>
    </div>
  )
}
