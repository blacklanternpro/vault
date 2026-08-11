import { useMemo, useState } from 'react'
import { VaultSeal } from './components/VaultSeal'
import { Calendar } from './components/Calendar'
import { TaskNest } from './components/TaskNest'
import { Scratchpad } from './components/Scratchpad'
import { PromptDock } from './components/PromptDock'
import { useClock } from './hooks/useClock'
import { useCrdtState } from './hooks/useCrdtState'
import type { OsMode } from './lib/os-mode'
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

  const today = useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    }
  }, [])

  const [viewYear, setViewYear] = useState(today.year)
  const [viewMonth, setViewMonth] = useState(today.month)

  const yy = String(viewYear).slice(-2)
  const mm = pad2(viewMonth + 1)
  const dayForPrompt = selectedDay ?? today.day
  const dateKey = `${mm}.${pad2(dayForPrompt)}.${yy}`
  const viewingToday =
    viewYear === today.year && viewMonth === today.month

  const contextLabel =
    mode === 'DAY'
      ? viewingToday || selectedDay != null
        ? dateKey
        : `${mm}.??.${yy}`
      : mode === 'NEST'
        ? activeParentId
          ? `>${activeParentId.slice(0, 10)}`
          : 'root/'
        : 'scratch'

  const handleSubmit = (text: string) => {
    if (mode === 'DAY') {
      const day = selectedDay ?? (viewingToday ? today.day : null)
      if (day == null) return
      const key = `${mm}.${pad2(day)}.${yy}`
      addSysLog({
        id: uid(),
        date: key,
        text: text.toUpperCase(),
        day,
      })
      setSelectedDay(day)
      return
    }
    if (mode === 'NEST') {
      addTask({
        id: uid(),
        text,
        parentId: activeParentId,
        priority,
      })
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

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col pb-[7.5rem]">
        <VaultSeal
          clock={clock}
          onToggleDark={() => setIsDark((v) => !v)}
        />

        <main className="flex min-h-0 flex-1 flex-col">
          <section
            className="min-w-0 border-b border-ink/30"
            onClick={() => setMode('DAY')}
          >
            <Calendar
              viewYear={viewYear}
              viewMonth={viewMonth}
              todayYear={today.year}
              todayMonth={today.month}
              todayDay={today.day}
              selectedDay={
                viewYear === today.year && viewMonth === today.month
                  ? selectedDay
                  : selectedDay
              }
              onSelectDay={(day) => {
                setSelectedDay(day)
                setMode('DAY')
                setActiveParentId(null)
              }}
              onNavigate={(year, month) => {
                setViewYear(year)
                setViewMonth(month)
                setSelectedDay(null)
                setMode('DAY')
              }}
            />
          </section>

          <section
            className="min-w-0 border-b border-ink/30 px-3 py-3 sm:px-4"
            onClick={() => {
              setMode('NEST')
            }}
          >
            <TaskNest
              activeParentId={activeParentId}
              onSelectParent={(id) => {
                setActiveParentId(id)
                setMode('NEST')
              }}
            />
          </section>

          <section
            className="min-w-0 flex-1 px-3 py-3 sm:px-4"
            onClick={() => {
              setMode('DUMP')
              setActiveParentId(null)
            }}
          >
            <Scratchpad />
          </section>
        </main>
      </div>

      <PromptDock
        mode={mode}
        contextLabel={contextLabel}
        priority={priority}
        onPriority={setPriority}
        onSubmit={handleSubmit}
        onAttach={handleAttach}
      />
    </div>
  )
}
