import { useEffect, useRef } from 'react'

type LeftOffProps = {
  onSave: (text: string) => void
  onSkip: () => void
}

/**
 * Asked once, at the top of a drawer that has been open a while and is now
 * closing: one line on where you got to, so the card can say it back next
 * time. Enter keeps it, Esc lets it go; either way the drawer then closes.
 */
export function LeftOffPrompt({ onSave, onSkip }: LeftOffProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <form
      className="leftoff"
      data-testid="leftoff"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(ref.current?.value ?? '')
      }}
    >
      <label className="leftoff-ask" htmlFor="leftoff-input">
        Where did you get to?
      </label>
      <input
        ref={ref}
        id="leftoff-input"
        className="leftoff-input"
        type="text"
        data-testid="leftoff-input"
        placeholder="hero copy done, nav next"
        autoComplete="off"
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') {
            e.preventDefault()
            onSkip()
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <p className="leftoff-keys" aria-hidden="true">
        enter saves · esc skips
      </p>
    </form>
  )
}
