import { useRef, useState, type FormEvent } from 'react'
import type { OsMode } from '../lib/os-mode'
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
      ? 'log to selected day…'
      : mode === 'NEST'
        ? 'append node…'
        : 'dump note…'

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] border-t-2 border-cobalt bg-canvas pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-5xl px-3 py-2.5 sm:px-4">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.2em] text-cobalt sm:text-[10px]">
          <span className="min-w-0 truncate">
            <span className="font-black">{mode}</span>
            <span className="text-ink/30"> // </span>
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
                className="font-bold tracking-wider underline"
              >
                +ATTACH
              </button>
            </>
          ) : null}
        </div>

        <form
          onSubmit={handle}
          className="flex items-end gap-2 text-sm text-cobalt"
        >
          <span className="vault-caret mb-1 shrink-0 font-black" aria-hidden>
            {'>'}
          </span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-b-2 border-cobalt bg-transparent pb-1 font-bold uppercase caret-cobalt outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-cobalt/35"
            autoComplete="off"
            enterKeyHint="send"
            aria-label="OS prompt"
          />
          <button
            type="submit"
            className="mb-0.5 shrink-0 px-1.5 py-1 font-black tracking-widest hover:bg-cobalt hover:text-canvas"
          >
            ↵
          </button>
        </form>
      </div>
    </div>
  )
}
