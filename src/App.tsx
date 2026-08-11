import { useMemo, useState } from 'react'
import { TeletextBar, type OsMode } from './components/TeletextBar'
import { Calendar } from './components/Calendar'
import { TaskNest } from './components/TaskNest'
import { Scratchpad } from './components/Scratchpad'
import { PromptDock } from './components/PromptDock'
import { Footer } from './components/Footer'
import { useClock } from './hooks/useClock'
import { useCrdtState } from './hooks/useCrdtState'
import type { TaskPriority } from './lib/vault-types'

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const clock = useClock()
  const { addSysLog, addTask, addNote } = useCrdtState()

  const [isDark, setIsDark] = useState(false)
  const [mode, setMode] = useState<OsMode>('DAY')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [activeParentId, setActiveParentId] = useState<string | null>(null)
  const [priority, setPriority] = useState<TaskPriority>('P2')

  const { year, monthIndex, currentDay, monthShort } = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    const short = now
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase()
    return {
      year: y,
      monthIndex: m,
      currentDay: d,
      monthShort: short,
    }
  }, [])

  const yy = String(year).slice(-2)
  const mm = pad2(monthIndex + 1)
  const dayForPrompt = selectedDay ?? currentDay
  const dateKey = `${mm}.${pad2(dayForPrompt)}.${yy}`

  const contextHint =
    mode === 'DAY'
      ? `SYS_LOG → ${dateKey}${selectedDay == null ? ' (TODAY)' : ''}`
      : mode === 'NEST'
        ? activeParentId
          ? `APPEND CHILD → ${activeParentId.slice(0, 8)}`
          : 'DEFINE ROOT NODE'
        : 'SCRATCH DUMP // RAW APPEND'

  const contextLabel =
    mode === 'DAY'
      ? dateKey
      : mode === 'NEST'
        ? activeParentId
          ? `CHILD_OF ${activeParentId.slice(0, 8)}`
          : 'ROOT'
        : 'DUMP'

  const handleMode = (next: OsMode) => {
    setMode(next)
    if (next !== 'NEST') setActiveParentId(null)
  }

  const handleSubmit = (text: string) => {
    if (mode === 'DAY') {
      addSysLog({
        id: uid(),
        date: dateKey,
        text: text.toUpperCase(),
        day: dayForPrompt,
      })
      if (selectedDay == null) setSelectedDay(dayForPrompt)
      return
    }
    if (mode === 'NEST') {
      addTask({
        id: uid(),
        text: text.toUpperCase(),
        parentId: activeParentId,
        priority,
      })
      setActiveParentId(null)
      setPriority('P2')
      return
    }
    addNote({
      id: uid(),
      date: dateKey,
      text,
    })
  }

  const handleAttach = (file: File) => {
    addNote({
      id: uid(),
      date: dateKey,
      text: `[ATTACH] ${file.name}`,
      attachment: file.name,
    })
    setMode('DUMP')
  }

  return (
    <div
      className={`relative min-h-dvh bg-canvas text-ink font-mono antialiased selection:bg-cobalt selection:text-canvas ${
        isDark ? 'invert hue-rotate-180' : ''
      }`}
    >
      <div className="vault-grain" aria-hidden />
      <div className="vault-scan" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
        <TeletextBar
          clock={clock}
          mode={mode}
          onMode={handleMode}
          onToggleDark={() => setIsDark((v) => !v)}
          monthLabel={monthShort}
          contextHint={contextHint}
        />

        <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section
            className="min-w-0 flex-1 overflow-x-clip border-b-2 border-ink lg:border-b-0 lg:border-r-2 cursor-pointer"
            onClick={() => setMode('DAY')}
          >
            <Calendar
              year={year}
              monthIndex={monthIndex}
              currentDay={currentDay}
              selectedDay={selectedDay}
              onSelectDay={(day) => {
                setSelectedDay(day)
                setMode('DAY')
              }}
            />
          </section>

          <aside className="flex w-full shrink-0 flex-col overflow-x-clip border-ink lg:w-[min(340px,36vw)]">
            <div
              className="border-b-2 border-ink px-3 py-3 sm:px-4"
              onClick={() => setMode('NEST')}
            >
              <TaskNest
                activeParentId={activeParentId}
                onSelectParent={(id) => {
                  setActiveParentId(id)
                  setMode('NEST')
                }}
              />
            </div>
            <div
              className="flex-1 px-3 py-3 sm:px-4"
              onClick={() => setMode('DUMP')}
            >
              <Scratchpad />
            </div>
          </aside>
        </main>

        <PromptDock
          mode={mode}
          contextLabel={contextLabel}
          priority={priority}
          onPriority={setPriority}
          onSubmit={handleSubmit}
          onAttach={handleAttach}
        />

        <Footer />
      </div>
    </div>
  )
}
