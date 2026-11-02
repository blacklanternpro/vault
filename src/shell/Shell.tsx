import { useRef, useState, type KeyboardEvent } from 'react'
import { byId } from '../model/doc'
import { completePath, VERBS, type ShellResult } from '../model/shell'
import { LANES, type Doc } from '../model/types'

type ShellProps = {
  doc: Doc
  /** The working directory: the project filter, or null for `~`. */
  cwd: number | null
  /** Runs the line and applies what it changed; the result comes back here to print. */
  onRun: (line: string) => ShellResult
}

type Out = { text: string; error: boolean }

const TWO_ARG = ['mv', 'st', 'rename']

/**
 * The prompt at the foot of the directory: one monospace line, the last
 * result under it. Up and Down recall what was typed this session, Tab
 * finishes the path being typed, and Esc clears the line (then leaves it).
 */
export function Shell({ doc, cwd, onRun }: ShellProps) {
  const [line, setLine] = useState('')
  const [out, setOut] = useState<Out | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const history = useRef<string[]>([])
  /** Where Up/Down is in the history; the history's length when not recalling. */
  const at = useRef(0)
  /** What was being typed before Up started recalling, so Down past the end gives it back. */
  const stash = useRef('')

  function submit() {
    const text = line
    if (!text.trim()) return
    const res = onRun(text)
    if (history.current[history.current.length - 1] !== text) history.current.push(text)
    at.current = history.current.length
    setLine('')
    setOut(res.clear ? null : { text: res.text, error: !res.ok })
  }

  function recall(dir: -1 | 1) {
    const h = history.current
    if (!h.length) return
    if (at.current === h.length) stash.current = line
    const next = Math.max(0, Math.min(h.length, at.current + dir))
    at.current = next
    setLine(next === h.length ? stash.current : h[next])
  }

  function complete() {
    const m = line.match(/^(\s*>?\s*)(\S+)(\s+)([\s\S]*)$/)
    if (!m) {
      // Only a verb so far: finish that.
      const word = line.trim().replace(/^>\s*/, '').toLowerCase()
      const fits = VERBS.filter((v) => v.startsWith(word))
      if (fits.length === 1) setLine(line.replace(/\S*$/, fits[0]) + ' ')
      else if (fits.length > 1) setOut({ text: fits.join('  '), error: false })
      return
    }
    const [, lead, verb, gap, args] = m
    const two = TWO_ARG.includes(verb.toLowerCase()) && /\S\s+\S/.test(args)
    let before = ''
    let partial = args
    if (two) {
      const cut = args.lastIndexOf(' ')
      before = args.slice(0, cut + 1)
      partial = args.slice(cut + 1)
      if (verb.toLowerCase() === 'rename') return
      if (verb.toLowerCase() === 'st') {
        const fits = LANES.filter((l) => l.startsWith(partial.toLowerCase()))
        if (fits.length === 1) setLine(lead + verb + gap + before + fits[0])
        else if (fits.length > 1) setOut({ text: fits.join('  '), error: false })
        return
      }
    }
    const c = completePath(doc, cwd, partial)
    if (c.candidates.length > 1) setOut({ text: c.candidates.join('\n'), error: false })
    if (c.text !== partial) setLine(lead + verb + gap + before + c.text)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      recall(e.key === 'ArrowUp' ? -1 : 1)
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      complete()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (line) setLine('')
      else inputRef.current?.blur()
    }
  }

  const here = cwd != null ? byId(doc, cwd) : undefined

  return (
    <div className="shell" data-testid="shell">
      {out && out.text ? (
        <pre className={`shell-out${out.error ? ' is-error' : ''}`} data-testid="shell-out" aria-live="polite">
          {out.text}
        </pre>
      ) : null}
      <form
        className="shell-line"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label className="shell-prompt" htmlFor="shell-input" aria-hidden="true">
          {here ? `${here.title.trim() || '_'} $` : '$'}
        </label>
        <input
          ref={inputRef}
          id="shell-input"
          className="shell-input"
          type="text"
          value={line}
          spellCheck={false}
          autoComplete="off"
          aria-label="Shell"
          placeholder="help"
          data-testid="shell-input"
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </form>
    </div>
  )
}
