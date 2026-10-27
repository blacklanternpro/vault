import { useEffect } from 'react'
import { Cross } from './Glyph'

export type Toast = {
  id: number
  text: string
  /** Offers to undo the change it reports. */
  undo?: boolean
  /** Stays until dismissed (load warnings), instead of fading after a few seconds. */
  sticky?: boolean
}

type NoticesProps = {
  toasts: Toast[]
  saveFailed: boolean
  onUndo: () => void
  onDismiss: (id: number) => void
  onExport: () => void
}

const TOAST_MS = 6000

export function Notices({ toasts, saveFailed, onUndo, onDismiss, onExport }: NoticesProps) {
  const fleeting = toasts.filter((t) => !t.sticky)
  const latest = fleeting[fleeting.length - 1]

  useEffect(() => {
    if (!latest) return
    const t = window.setTimeout(() => onDismiss(latest.id), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [latest, onDismiss])

  return (
    <>
      {saveFailed || toasts.some((t) => t.sticky) ? (
        <div className="banners">
          {saveFailed ? (
            <div className="banner is-danger" role="alert">
              <span>VAULT couldn't save your last change to this browser.</span>
              <button type="button" className="banner-action" onClick={onExport}>
                Export a copy
              </button>
            </div>
          ) : null}
          {toasts
            .filter((t) => t.sticky)
            .map((t) => (
              <div key={t.id} className="banner" role="status">
                <span>{t.text}</span>
                <button type="button" className="banner-close" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>
                  <Cross />
                </button>
              </div>
            ))}
        </div>
      ) : null}

      <div className="toasts" role="status" aria-live="polite">
        {latest ? (
          <div key={latest.id} className="toast" data-testid="toast">
            <span className="toast-text">{latest.text}</span>
            {latest.undo ? (
              <button type="button" className="toast-action" onClick={onUndo}>
                Undo
              </button>
            ) : null}
            <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => onDismiss(latest.id)}>
              <Cross />
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
