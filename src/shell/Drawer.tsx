import { useEffect, useRef, useState } from 'react'
import { daysUntil, laneOf, linesOf, projectOf, trailOf } from '../model/doc'
import { LANES, LANE_LABEL, type Doc, type Lane, type Node } from '../model/types'
import { Caret, Check, Cross, Flag, Folder, Plus, Trash } from './Glyph'
import { InlineEdit } from './InlineEdit'
import { Mark } from './Mark'
import type { Draft, Editing } from './Studio'
import type { JobDrag } from './useJobDrag'
/* --- agent handoff --- */
import type { ClipboardEvent } from 'react'
import { findUrls } from '../model/brief'
import type { Link } from '../model/types'
import { HandoffTools } from './Handoff'
import { LinksSection } from './Links'
/* --- end agent handoff --- */
/* night shift */
import { LeftOffPrompt } from './LeftOff'
import { Calendar, Pennant } from './NightGlyph'
import { daysSince, dueLabel, dueTone } from './time'
import { STALE_DAYS } from './trail'
import { Trail } from './Trail'

type DrawerProps = {
  doc: Doc
  query: string
  selectedId: number | null
  editing: Editing | null
  draft: Draft | null
  node: Node
  drag: JobDrag
  onClose: () => void
  onSetLane: (lane: Lane) => void
  onToggleUrgent: () => void
  onDelete: () => void
  onEdit: (id: number, field: 'title' | 'body') => void
  onRename: (id: number, title: string) => void
  onBody: (body: string) => void
  onToggleDone: (id: number) => void
  onDeleteLine: (id: number) => void
  onStartLine: () => void
  /** `keepGoing` after Enter, so a list of subtasks can be typed one after another. */
  onLineCommit: (title: string, keepGoing: boolean) => void
  onOpenProject: (projectId: number) => void
  /* --- agent handoff: links, brief, report, session clock (all optional, so the drawer stands without them) --- */
  /** Seconds logged on this task and everything inside it. */
  spent?: number
  /** The session clock is running on this task. */
  sessionRunning?: boolean
  onLinks?: (links: Link[]) => void
  onCopyBrief?: () => void
  onDownloadBrief?: () => void
  onPasteReport?: () => void
  onStartSession?: () => void
  onStopSession?: () => void
  /* --- end agent handoff --- */
  /* ----- night shift (all optional, so the drawer stands without the Studio wiring) ----- */
  /** The clock the chips read; defaults to the moment of render. */
  now?: Date
  /** ISO YYYY-MM-DD, or '' to clear. */
  onDue?: (due: string) => void
  onNext?: (next: string) => void
  onToggleTonight?: () => void
  /** Shelve a stale card. */
  onDust?: () => void
  /** Set while the drawer is closing after a long stay: asks where you got to before it goes. */
  leftOff?: { onSave: (text: string) => void; onSkip: () => void } | null
}

export function Drawer({
  doc,
  query,
  editing,
  draft,
  node,
  drag,
  onClose,
  onSetLane,
  onToggleUrgent,
  onDelete,
  onEdit,
  onRename,
  onBody,
  onToggleDone,
  onDeleteLine,
  onStartLine,
  onLineCommit,
  onOpenProject,
  /* --- agent handoff --- */
  spent,
  sessionRunning,
  onLinks,
  onCopyBrief,
  onDownloadBrief,
  onPasteReport,
  onStartSession,
  onStopSession,
  /* --- end agent handoff --- */
  now,
  onDue,
  onNext,
  onToggleTonight,
  onDust,
  leftOff,
}: DrawerProps) {
  /* --- agent handoff: a URL pasted anywhere in the drawer (bar the link form itself) is offered as a link --- */
  const [offer, setOffer] = useState<string | null>(null)
  function onPaste(e: ClipboardEvent<HTMLElement>) {
    if (!onLinks) return
    const target = e.target as HTMLElement
    if (target.closest('.link-form, .drawer-title-input')) return
    const url = findUrls(e.clipboardData?.getData('text') ?? '').find((u) => !(node.links ?? []).some((l) => l.url === u))
    if (url) setOffer(url)
  }
  /* --- end agent handoff --- */
  const lane = laneOf(node.status)
  const project = projectOf(doc, node.id)
  // Nested lines show indented under their parent line, so nothing in the card is out of sight.
  const lines = linesOf(doc, node.id)
  const editingTitle = editing?.id === node.id && editing.field === 'title' && editing.where === 'drawer'
  const editingBody = editing?.id === node.id && editing.field === 'body'
  const drafting = draft?.where === 'drawer' && draft.parent === node.id
  // A fresh key per committed line resets the input, so Enter goes straight on to the next one.
  const [lineKey, setLineKey] = useState(0)
  const paragraphs = (node.body ?? '').split('\n')

  /* ----- night shift ----- */
  const clock = now ?? new Date()
  const [editingNext, setEditingNext] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  // The drawer opens on its title: a reader lands on the name, not somewhere behind the rail.
  // Opened from the directory, it leaves focus there: the tree is a keyboard surface mid-use.
  useEffect(() => {
    if (document.activeElement?.closest('.forest')) return
    titleRef.current?.focus({ preventScroll: true })
  }, [])
  const dueDays = node.due ? daysUntil(node.due, clock) : null
  const untouched = node.touched != null && node.status !== 'done' && node.status !== 'dusted' ? daysSince(node.touched, clock.getTime()) : 0
  const stale = untouched >= STALE_DAYS
  const trail = trailOf(doc, node.id)
  /* ----- end night shift ----- */

  return (
    <aside className="drawer" data-testid="drawer" aria-label="Task detail" onPaste={onPaste /* agent handoff */}>
      {leftOff ? <LeftOffPrompt onSave={leftOff.onSave} onSkip={leftOff.onSkip} /> : null}
      <div className="drawer-top">
        <label className={`drawer-status is-${lane}`}>
          <span className="drawer-dot" aria-hidden="true" />
          {LANE_LABEL[lane]}
          <Caret className="drawer-status-caret" />
          <select aria-label="Status" data-testid="drawer-status" value={lane} onChange={(e) => onSetLane(e.target.value as Lane)}>
            {LANES.map((l) => (
              <option key={l} value={l}>
                {LANE_LABEL[l]}
              </option>
            ))}
          </select>
        </label>
        <div className="drawer-tools">
          {onToggleTonight ? (
            <button
              type="button"
              className={`drawer-tool drawer-tonight${node.tonight ? ' is-tonight' : ''}`}
              aria-pressed={Boolean(node.tonight)}
              aria-label={node.tonight ? "Take off tonight's shelf" : "Put on tonight's shelf"}
              title={node.tonight ? 'Off the shelf (t)' : 'Tonight (t)'}
              data-testid="drawer-tonight"
              onClick={onToggleTonight}
            >
              <Pennant />
            </button>
          ) : null}
          <button
            type="button"
            className={`drawer-tool${node.urgent ? ' is-on' : ''}`}
            aria-pressed={Boolean(node.urgent)}
            aria-label={node.urgent ? 'Unmark urgent' : 'Mark urgent'}
            title={node.urgent ? 'Unmark urgent' : 'Mark urgent'}
            data-testid="drawer-urgent"
            onClick={onToggleUrgent}
          >
            <Flag />
          </button>
          <button type="button" className="drawer-tool" aria-label="Delete task" title="Delete task" data-testid="drawer-delete" onClick={onDelete}>
            <Trash />
          </button>
          <button type="button" className="drawer-tool" aria-label="Close task detail" title="Close (Esc)" data-testid="drawer-close" onClick={onClose}>
            <Cross />
          </button>
        </div>
      </div>

      {editingTitle ? (
        <InlineEdit className="drawer-title-input" value={node.title} ariaLabel="Task title" onCommit={(v) => onRename(node.id, v)} />
      ) : (
        <h1 className="drawer-title" data-title ref={titleRef} tabIndex={-1} data-testid="drawer-title" onClick={() => onEdit(node.id, 'title')}>
          <Mark text={node.title.trim() || '_'} query={query} />
        </h1>
      )}

      {project && project.id !== node.id ? (
        <button type="button" className="drawer-folder" aria-label={`Show only ${project.title}`} onClick={() => onOpenProject(project.id)}>
          <Folder />
          {project.title.trim() || '_'}
        </button>
      ) : null}

      {/* ----- night shift: due, next action, left-off, dust ----- */}
      {onDue || onNext ? (
        <div className="drawer-night" data-testid="drawer-night">
          {onDue ? (
            <div className="drawer-due-row">
              <label className={`drawer-due${node.due && dueDays != null ? ` is-${dueTone(dueDays)}` : ' is-unset'}`} data-testid="drawer-due-chip">
                <Calendar className="drawer-due-glyph" />
                <span className="drawer-due-label">{node.due ? dueLabel(node.due, clock) : 'due _'}</span>
                {/* The native picker is stretched over the chip, the way the top bar's chips carry their select. */}
                <input
                  key={node.due ?? ''}
                  type="date"
                  className="drawer-due-input"
                  aria-label="Due date"
                  data-testid="drawer-due"
                  defaultValue={node.due ?? ''}
                  onChange={(e) => {
                    if (e.target.value) onDue(e.target.value)
                  }}
                  onBlur={(e) => {
                    if (!e.target.value && node.due) onDue('')
                  }}
                />
              </label>
              {node.due ? (
                <button type="button" className="drawer-due-clear" aria-label="Clear due date" title="Clear due date" data-testid="drawer-due-clear" onClick={() => onDue('')}>
                  <Cross />
                </button>
              ) : null}
            </div>
          ) : null}
          {onNext ? (
            <div className="drawer-next-row">
              <span className="drawer-next-label">next</span>
              {editingNext ? (
                <InlineEdit
                  className="drawer-next-input"
                  value={node.next ?? ''}
                  ariaLabel="Next action"
                  placeholder="the one next action"
                  testId="drawer-next-input"
                  onCommit={(v) => {
                    setEditingNext(false)
                    onNext(v)
                  }}
                />
              ) : (
                <button type="button" className={`drawer-next${node.next ? '' : ' is-empty'}`} data-testid="drawer-next" onClick={() => setEditingNext(true)}>
                  {node.next ?? '_'}
                </button>
              )}
            </div>
          ) : null}
          {node.leftOff ? (
            <p className="drawer-leftoff" data-testid="drawer-leftoff">
              left off: {node.leftOff}
            </p>
          ) : null}
          {stale && onDust ? (
            <p className="drawer-stale" data-testid="drawer-stale">
              Untouched for {untouched} days — move to DUSTED?
              <button type="button" className="drawer-stale-dust" data-testid="drawer-dust" onClick={onDust}>
                → DUSTED
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
      {/* ----- end night shift ----- */}

      <hr className="drawer-rule" />

      <h2 className="drawer-label">Description</h2>
      {editingBody ? (
        <InlineEdit
          className="drawer-body-input"
          value={node.body ?? ''}
          ariaLabel="Description"
          placeholder="Add a description"
          multiline
          rows={6}
          testId="drawer-body-input"
          onCommit={(v) => onBody(v)}
        />
      ) : (
        <div className="drawer-body" data-testid="drawer-body" onClick={() => onEdit(node.id, 'body')}>
          {node.body ? (
            paragraphs.map((line, i) => (line.trim() ? <p key={i}><Mark text={line} query={query} /></p> : <p key={i} className="drawer-body-gap" />))
          ) : (
            <p className="drawer-body-empty">Add a description</p>
          )}
        </div>
      )}

      <h2 className="drawer-label">
        Subtasks
        {lines.length ? (
          <span className="drawer-label-count">
            {lines.filter((l) => l.node.status === 'done').length}/{lines.length}
          </span>
        ) : null}
      </h2>
      <ul className="subtasks">
        {lines.map(({ node: child, depth }) => {
          const done = child.status === 'done'
          const editingLine = editing?.id === child.id && editing.where === 'drawer'
          return (
            <li
              key={child.id}
              className={`subtask${done ? ' is-done' : ''}`}
              style={depth > 1 ? { paddingLeft: `${(depth - 1) * 22}px` } : undefined}
              data-nested-id={child.id}
              onPointerDown={(e) => drag.beginDrag(e, child.id, 'nested', '[data-nested-id]')}
              onPointerMove={drag.onMove}
              onPointerUp={drag.finishDrag}
              onPointerCancel={drag.finishDrag}
            >
              <button
                type="button"
                className="subtask-tick"
                aria-label={done ? `Reopen ${child.title}` : `Complete ${child.title}`}
                aria-pressed={done}
                onClick={() => onToggleDone(child.id)}
              >
                <Check />
              </button>
              {editingLine ? (
                <InlineEdit className="subtask-input" value={child.title} ariaLabel="Subtask title" onCommit={(v) => onRename(child.id, v)} />
              ) : (
                <span className="subtask-name">
                  <Mark text={child.title.trim() || '_'} query={query} />
                </span>
              )}
              <button type="button" className="subtask-delete" aria-label={`Delete ${child.title}`} onClick={() => onDeleteLine(child.id)}>
                <Cross />
              </button>
            </li>
          )
        })}
        <li className="subtask is-add">
          {drafting ? (
            <>
              <Plus className="subtask-add-glyph" />
              <InlineEdit
                key={lineKey}
                className="subtask-input"
                value=""
                ariaLabel="New subtask"
                placeholder="Subtask, then Enter for the next"
                testId={`new-subtask-${node.id}`}
                onCommit={(v, how) => {
                  const keepGoing = how === 'enter' && v.trim() !== ''
                  onLineCommit(v, keepGoing)
                  if (keepGoing) setLineKey((k) => k + 1)
                }}
              />
            </>
          ) : (
            <button type="button" className="subtask-add" data-testid={`add-subtask-${node.id}`} onClick={onStartLine}>
              <Plus className="subtask-add-glyph" />
              Add subtask
            </button>
          )}
        </li>
      </ul>

      {/* --- agent handoff: LINKS, then HANDOFF (brief out, report in, the clock between) --- */}
      {onLinks ? <LinksSection node={node} offer={offer} onOffer={setOffer} onChange={onLinks} /> : null}
      {onCopyBrief && onDownloadBrief && onPasteReport && onStartSession && onStopSession ? (
        <HandoffTools
          spent={spent ?? 0}
          running={Boolean(sessionRunning)}
          onCopyBrief={onCopyBrief}
          onDownloadBrief={onDownloadBrief}
          onPasteReport={onPasteReport}
          onStartSession={onStartSession}
          onStopSession={onStopSession}
        />
      ) : null}
      {/* --- end agent handoff --- */}
      {/* ----- night shift: the trail ----- */}
      <Trail events={trail} now={clock} />
    </aside>
  )
}
