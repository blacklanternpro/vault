import { useMemo } from 'react'
import { formatDuration, monthBounds, sessionsByProject, spentByProject } from '../model/brief'
import { projectsOf } from '../model/doc'
import type { Doc } from '../model/types'
import { Modal } from './Modal'

type TimesheetProps = {
  doc: Doc
  onClose: () => void
}

/** Hours to a decimal, the way an invoice wants them. */
function hours(seconds: number): string {
  return seconds ? (seconds / 3600).toFixed(2) : '—'
}

/**
 * Time this month: the session clock's sessions on the trail, added up by
 * project, beside everything ever logged. This is what an invoice reads from.
 */
export function TimesheetModal({ doc, onClose }: TimesheetProps) {
  const now = Date.now()
  const rows = useMemo(() => {
    const { from, to } = monthBounds(now)
    const month = new Map(sessionsByProject(doc, from, to).map((t) => [t.project.id, t.seconds]))
    const all = new Map(spentByProject(doc).map((t) => [t.project.id, t.seconds]))
    return projectsOf(doc)
      .map((project) => ({ project, month: month.get(project.id) ?? 0, all: all.get(project.id) ?? 0 }))
      .filter((r) => r.month > 0 || r.all > 0)
  }, [doc, now])
  const monthTotal = rows.reduce((s, r) => s + r.month, 0)
  const allTotal = rows.reduce((s, r) => s + r.all, 0)
  const monthName = new Date(now).toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <Modal title="Time this month" testId="timesheet" onClose={onClose}>
      <p className="modal-lead">{monthName} · from the session clock</p>
      {rows.length ? (
        <table className="timesheet">
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">This month</th>
              <th scope="col">Hours</th>
              <th scope="col">All time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.project.id}>
                <th scope="row">{r.project.title.trim() || '_'}</th>
                <td>{r.month ? formatDuration(r.month) : '—'}</td>
                <td>{hours(r.month)}</td>
                <td>{r.all ? formatDuration(r.all) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{monthTotal ? formatDuration(monthTotal) : '—'}</td>
              <td>{hours(monthTotal)}</td>
              <td>{allTotal ? formatDuration(allTotal) : '—'}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="report-empty">_</p>
      )}
    </Modal>
  )
}
