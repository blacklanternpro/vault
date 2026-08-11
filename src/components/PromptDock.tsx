import { useRef, useState, type FormEvent } from 'react'
import type { OsMode } from './TeletextBar'
import type { TaskPriority } from '../lib/vault-types'
import { NestPriorityRow } from './TaskNest'

type PromptDockProps = {
  mode: OsMode
  contextLabel: string
  priority: TaskPriority
  onPriority: (p: TaskPriority) => void
  onSubmit: (text: string) => void
  onAttach?: (file: File) => void
}

export function PromptDock({
  mode,
  contextLabel,
  priority,
  onPriority,
  onSubmit,
  onAttach,
}: PromptDockProps) {
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handle = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSubmit(text.trim())
    setText('')
  }

  const placeholder =
    mode === 'DAY'
      ? 'APPEND RECORD TO SELECTED DATE...'
      : mode === 'NEST'
        ? 'DEFINE ROOT / APPEND TO FOCUSED NODE...'
        : 'DUMP RAW TEXT / LINK...'

  return (
    <div className="sticky bottom-0 z-[100] shrink-0 border-t-2 border-cobalt bg-canvas">
      <div className="px-3 py-3 sm:px-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest md:text-[11px]">
          <span className="text-cobalt">
            <span className="tui-chip mr-2">{mode}</span>
            {contextLabel}
          </span>
          {mode === 'NEST' ? (
            <NestPriorityRow value={priority} onChange={onPriority} />
          ) : null}
          {mode === 'DUMP' ? (
            <>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f && onAttach) onAttach(f)
                  if (fileRef.current) fileRef.current.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-bold tracking-wider text-cobalt underline"
              >
                + ATTACH
              </button>
            </>
          ) : null}
        </div>

        <form
          onSubmit={handle}
          className="flex items-end gap-2 text-xs text-cobalt md:text-sm"
        >
          <span className="vault-caret mb-1 font-black" aria-hidden>
            {'>'}
          </span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-b-2 border-cobalt bg-transparent pb-1 font-bold uppercase caret-cobalt outline-none placeholder:text-cobalt/35"
            autoComplete="off"
            aria-label="OS prompt"
          />
          <button
            type="submit"
            className="shrink-0 px-2 py-1 font-black tracking-widest hover:bg-cobalt hover:text-canvas"
          >
            [ENTER]
          </button>
        </form>
      </div>
    </div>
  )
}
