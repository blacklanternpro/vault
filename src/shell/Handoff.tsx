import { formatDuration } from '../model/brief'
import { ClockMark, CopyMark, DownloadMark, PasteMark, PlayMark, StopMark } from './HandoffGlyph'

type HandoffProps = {
  /** Seconds logged on this task and everything inside it. */
  spent: number
  /** The session clock is running on this task. */
  running: boolean
  onCopyBrief: () => void
  onDownloadBrief: () => void
  onPasteReport: () => void
  onStartSession: () => void
  onStopSession: () => void
}

/**
 * The drawer's HANDOFF: the task goes out as a brief, comes back as a
 * report, and the clock in between is kept on it.
 */
export function HandoffTools({ spent, running, onCopyBrief, onDownloadBrief, onPasteReport, onStartSession, onStopSession }: HandoffProps) {
  return (
    <>
      <h2 className="drawer-label">Handoff</h2>
      <div className="handoff" data-testid="handoff">
        <button type="button" className="handoff-button" data-testid="copy-brief" onClick={onCopyBrief}>
          <CopyMark className="handoff-mark" />
          Copy as brief
        </button>
        <button type="button" className="handoff-button" data-testid="download-brief" onClick={onDownloadBrief}>
          <DownloadMark className="handoff-mark" />
          Download .md
        </button>
        <button type="button" className="handoff-button" data-testid="paste-report" onClick={onPasteReport}>
          <PasteMark className="handoff-mark" />
          Paste report
        </button>
        <button
          type="button"
          className={`handoff-button${running ? ' is-on' : ''}`}
          aria-pressed={running}
          data-testid="session-toggle"
          onClick={running ? onStopSession : onStartSession}
        >
          {running ? <StopMark className="handoff-mark" /> : <PlayMark className="handoff-mark" />}
          {running ? 'Stop session' : 'Start session'}
        </button>
      </div>
      {spent > 0 || running ? (
        <p className="handoff-spent" data-testid="spent">
          <ClockMark className="handoff-mark" />
          {spent > 0 ? `${formatDuration(spent)} spent` : 'Clock running'}
          {spent > 0 && running ? ' · clock running' : ''}
        </p>
      ) : null}
    </>
  )
}
