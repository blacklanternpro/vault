import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Cross } from './Glyph'

type ModalProps = {
  title: string
  testId?: string
  onClose: () => void
  children: ReactNode
}

/**
 * One panel over the field: white on the hairline, 8px, the title as a
 * plaque. Esc is caught on the way down so it closes the panel and nothing
 * behind it; a press on the scrim closes it too. The first field inside
 * marked `data-autofocus` takes the caret, otherwise the panel does.
 */
export function Modal({ title, testId, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Once, on opening: the caret goes in, and Esc is caught until the panel goes.
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      e.preventDefault()
      closeRef.current()
    }
    window.addEventListener('keydown', esc, true)
    const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')
    ;(first ?? panelRef.current)?.focus()
    return () => window.removeEventListener('keydown', esc, true)
  }, [])

  return (
    <div
      className="modal-scrim"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelId} tabIndex={-1} ref={panelRef} data-testid={testId}>
        <div className="modal-head">
          <h2 className="modal-title" id={labelId}>
            {title}
          </h2>
          <button type="button" className="drawer-tool" aria-label="Close" title="Close (Esc)" onClick={onClose}>
            <Cross />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
