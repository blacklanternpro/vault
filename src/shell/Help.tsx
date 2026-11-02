import { useEffect, useRef } from 'react'
import { Cross } from './Glyph'

type HelpProps = {
  open: boolean
  onClose: () => void
}

type Group = { name: string; keys: Array<[keys: string[], what: string]> }

/** Every shortcut in the app, grouped by where it works. The list is the one the `?` key and the ⋯ menu show. */
const SHORTCUTS: Group[] = [
  {
    name: 'Board',
    keys: [
      [['j', 'k'], 'next / previous card in the lane'],
      [['h', 'l'], 'nearest card in the lane to the left / right'],
      [['⇧ H', '⇧ L'], 'move the card one lane left / right'],
      [['o', 'Enter'], 'open the card'],
      [['F2'], 'rename'],
      [['x', 'Delete'], 'delete (Undo in the toast)'],
      [['Tab'], 'focus the board, then a card'],
    ],
  },
  {
    name: 'Directory',
    keys: [
      [['↑', '↓', 'Home', 'End'], 'move'],
      [['←', '→'], 'fold / unfold, or go to the parent / first child'],
      [['Enter', 'F2'], 'rename (double-click does too)'],
      [['+'], 'add inside (Enter for another, Esc to stop)'],
      [['Tab', '⇧ Tab'], 'indent / outdent'],
      [['Alt ↑', 'Alt ↓'], 'reorder among siblings'],
      [['x'], 'tick a subtask'],
      [['Delete'], 'delete (Undo in the toast)'],
      [['$'], 'the prompt: Tab completes a path, ↑ ↓ recall, help lists the commands'],
    ],
  },
  {
    name: 'Everywhere',
    keys: [
      [['Ctrl K', '/'], 'search, run a command (> mv …) or filter (p: s: !)'],
      [['Esc'], 'close the draft, edit, palette or drawer'],
      [['Ctrl Z', 'Ctrl ⇧ Z'], 'undo / redo'],
      [['?'], 'this list'],
    ],
  },
]

/** A light sheet over the field listing every shortcut. Esc or a click outside closes it. */
export function Help({ open, onClose }: HelpProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    ref.current?.focus()
    // Caught on the way down, so Esc closes the sheet and nothing behind it.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', esc, true)
    return () => {
      window.removeEventListener('keydown', esc, true)
      if (before instanceof HTMLElement && document.contains(before)) before.focus({ preventScroll: true })
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="help-backdrop" data-testid="help" onClick={onClose}>
      <div className="help" role="dialog" aria-modal="true" aria-labelledby="help-title" tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <h2 className="help-title" id="help-title">
            Keyboard shortcuts
          </h2>
          <button type="button" className="help-close" aria-label="Close" data-testid="help-close" onClick={onClose}>
            <Cross />
          </button>
        </div>
        <div className="help-groups">
          {SHORTCUTS.map((group) => (
            <section key={group.name} className="help-group" aria-label={group.name}>
              <h3 className="help-group-name">{group.name}</h3>
              <dl className="help-list">
                {group.keys.map(([keys, what]) => (
                  <div key={what} className="help-row">
                    <dt>
                      {keys.map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </dt>
                    <dd>{what}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
