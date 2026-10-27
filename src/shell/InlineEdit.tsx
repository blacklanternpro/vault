import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

type InlineEditProps = {
  value: string
  className?: string
  ariaLabel: string
  placeholder?: string
  /** A textarea: Enter makes a new line, Ctrl/Cmd+Enter saves. */
  multiline?: boolean
  rows?: number
  /** Select everything on focus, so typing replaces the old name. */
  selectAll?: boolean
  /** Called once per edit, with what was typed. Blur, Enter and Escape all save. */
  onCommit: (value: string, how: 'enter' | 'blur' | 'escape') => void
  testId?: string
}

/**
 * The one way text gets edited anywhere: a native field with its own local
 * state, so nothing re-renders the board per keystroke and nothing is lost
 * on the way out. Escape keeps what you wrote (undo is there to take it back).
 */
export function InlineEdit({
  value,
  className,
  ariaLabel,
  placeholder = '_',
  multiline,
  rows = 4,
  selectAll,
  onCommit,
  testId,
}: InlineEditProps) {
  const [text, setText] = useState(value)
  const done = useRef(false)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    if (selectAll) el.select()
    else el.setSelectionRange(el.value.length, el.value.length)
  }, [selectAll])

  function finish(how: 'enter' | 'blur' | 'escape') {
    if (done.current) return
    done.current = true
    onCommit(text, how)
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      finish('escape')
      return
    }
    if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      finish('enter')
    }
  }

  const common = {
    ref,
    className,
    value: text,
    'aria-label': ariaLabel,
    'data-testid': testId,
    placeholder,
    onChange: (e: { target: { value: string } }) => setText(e.target.value),
    onBlur: () => finish('blur'),
    onKeyDown,
    onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  }
  return multiline ? <textarea {...common} rows={rows} /> : <input {...common} type="text" />
}
