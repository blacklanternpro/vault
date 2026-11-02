import { useMemo, useState } from 'react'
import { boardCards, byId, projectOf } from '../model/doc'
import { matchReport, parseReport, type PlanRow } from '../model/report'
import type { Doc } from '../model/types'
import { Modal } from './Modal'

type ReportProps = {
  doc: Doc
  /** The task the report is for. Null when the sender did not say, and the person picks one here. */
  taskId: number | null
  initialText: string
  onApply: (taskId: number, rows: PlanRow[]) => void
  onClose: () => void
}

function keyOf(row: PlanRow): string {
  return row.kind === 'leftOff' ? 'leftOff' : `${row.kind}:${row.title}`
}

function describe(row: PlanRow) {
  if (row.kind === 'tick') {
    return (
      <>
        Tick <strong>{row.matched}</strong>
        {row.matched.trim().toLowerCase() !== row.title.trim().toLowerCase() ? <span className="report-row-note"> for “{row.title}”</span> : null}
      </>
    )
  }
  if (row.kind === 'addDone')
    return (
      <>
        Add <strong>{row.title}</strong>
        <span className="report-row-note"> as done</span>
      </>
    )
  if (row.kind === 'add')
    return (
      <>
        Add <strong>{row.title}</strong>
      </>
    )
  return (
    <>
      Left off: <strong>{row.text}</strong>
    </>
  )
}

/**
 * Paste report: the agent's reply goes in, the plan it amounts to comes out as
 * a checklist, and Apply commits what is ticked as one change.
 */
export function ReportModal({ doc, taskId, initialText, onApply, onClose }: ReportProps) {
  const [text, setText] = useState(initialText)
  const cards = useMemo(() => boardCards(doc, null), [doc])
  const [picked, setPicked] = useState<number | null>(taskId ?? cards[0]?.id ?? null)
  const task = picked != null ? byId(doc, picked) : undefined
  const parsed = useMemo(() => parseReport(text), [text])
  const plan = useMemo(() => (task ? matchReport(doc, task.id, parsed) : { rows: [], already: [] }), [doc, task, parsed])
  /** Rows the person unticked, by key, so retyping the report keeps their choices. */
  const [off, setOff] = useState<ReadonlySet<string>>(() => new Set())
  const chosen = plan.rows.filter((row) => !off.has(keyOf(row)))

  return (
    <Modal title="Paste report" testId="report-modal" onClose={onClose}>
      <p className="modal-lead">
        {taskId == null ? (
          <label className="report-task">
            For
            <select aria-label="Task" data-testid="report-task" value={picked ?? ''} onChange={(e) => setPicked(Number(e.target.value))}>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {projectOf(doc, c.id)?.title.trim() || '_'} / {c.title.trim() || '_'}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            For <strong className="report-task-name">{task ? task.title.trim() || '_' : 'a task that is gone'}</strong>
          </>
        )}
      </p>
      <textarea
        className="report-input"
        data-testid="report-input"
        data-autofocus
        rows={7}
        value={text}
        placeholder={'## Report\n- [x] subtask you finished\n- [ ] something new\nLeft off: where you got to'}
        aria-label="Report"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
      {plan.rows.length ? (
        <ul className="report-plan" data-testid="report-plan">
          {plan.rows.map((row) => {
            const key = keyOf(row)
            const on = !off.has(key)
            return (
              <li key={key} className={`report-row${on ? '' : ' is-off'}`} data-kind={row.kind}>
                <label>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) =>
                      setOff((set) => {
                        const next = new Set(set)
                        if (e.target.checked) next.delete(key)
                        else next.add(key)
                        return next
                      })
                    }
                  />
                  <span>{describe(row)}</span>
                </label>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="report-empty">{text.trim() ? 'Nothing here to apply.' : '_'}</p>
      )}
      {plan.already.length ? <p className="report-aside">Already on the task: {plan.already.join(' · ')}</p> : null}
      {parsed.notes.length ? <p className="report-aside">Not applied: {parsed.notes.join(' · ')}</p> : null}
      <div className="modal-actions">
        <button type="button" className="modal-apply" data-testid="report-apply" disabled={!task || !chosen.length} onClick={() => task && onApply(task.id, chosen)}>
          Apply {chosen.length ? `(${chosen.length})` : ''}
        </button>
        <button type="button" className="modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
