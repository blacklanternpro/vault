import { type MouseEvent, useMemo, useState } from 'react'
import { useCrdtState } from '../hooks/useCrdtState'

type CalView = 'MONTH' | 'YEAR'

type CalendarProps = {
  viewYear: number
  viewMonth: number
  todayYear: number
  todayMonth: number
  todayDay: number
  selectedDay: number | null
  onSelectDay: (day: number) => void
  onNavigate: (year: number, month: number) => void
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

export function Calendar({
  viewYear,
  viewMonth,
  todayYear,
  todayMonth,
  todayDay,
  selectedDay,
  onSelectDay,
  onNavigate,
}: CalendarProps) {
  const { sysLogs, markedDays, deleteSysLog } = useCrdtState()
  const [calView, setCalView] = useState<CalView>('MONTH')

  const totalDays = daysInMonth(viewYear, viewMonth)
  const yy = String(viewYear).slice(-2)
  const mm = pad2(viewMonth + 1)
  const dateKey = (day: number) => `${mm}.${pad2(day)}.${yy}`
  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth

  const handleDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation()
    deleteSysLog(id)
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    onNavigate(d.getFullYear(), d.getMonth())
    setCalView('MONTH')
  }

  const monthLabel = useMemo(
    () => `${MONTHS[viewMonth]} '${yy}`,
    [viewMonth, yy],
  )

  return (
    <section className="relative w-full px-2 pb-2 pt-1 sm:px-3">
      <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cobalt">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (calView === 'YEAR') onNavigate(viewYear - 1, viewMonth)
              else shiftMonth(-1)
            }}
            className="px-1 font-bold hover:bg-cobalt hover:text-canvas"
            aria-label={calView === 'YEAR' ? 'Previous year' : 'Previous month'}
          >
            ◀
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setCalView('MONTH')
            }}
            className="px-1.5 font-bold tracking-[0.22em] hover:bg-cobalt hover:text-canvas"
          >
            {calView === 'YEAR' ? String(viewYear) : monthLabel}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (calView === 'YEAR') onNavigate(viewYear + 1, viewMonth)
              else shiftMonth(1)
            }}
            className="px-1 font-bold hover:bg-cobalt hover:text-canvas"
            aria-label={calView === 'YEAR' ? 'Next year' : 'Next month'}
          >
            ▶
          </button>
        </div>

        <div className="flex items-center gap-0 border border-cobalt">
          {(['MONTH', 'YEAR'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCalView(v)
              }}
              className={`px-2 py-0.5 font-bold tracking-[0.2em] ${
                calView === v
                  ? 'bg-cobalt text-canvas'
                  : 'text-cobalt hover:bg-cobalt hover:text-canvas'
              }`}
            >
              {v === 'MONTH' ? 'MO' : 'YR'}
            </button>
          ))}
        </div>
      </div>

      {calView === 'YEAR' ? (
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">
          {MONTHS.map((label, monthIndex) => {
            const count = daysInMonth(viewYear, monthIndex)
            const active = monthIndex === viewMonth
            return (
              <button
                key={label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(viewYear, monthIndex)
                  setCalView('MONTH')
                }}
                className={`text-left ${active ? 'bg-cobalt/5' : ''}`}
              >
                <div className="mb-1 font-mono text-[9px] font-bold tracking-[0.24em] text-cobalt">
                  {label}
                </div>
                <div className="flex flex-wrap gap-x-[2px] gap-y-0 leading-none">
                  {Array.from({ length: count }, (_, i) => i + 1).map((day) => (
                    <span
                      key={day}
                      className={`font-sans text-[9px] font-light tabular-nums tracking-tighter sm:text-[10px] ${
                        viewYear === todayYear &&
                        monthIndex === todayMonth &&
                        day === todayDay
                          ? 'text-cobalt underline'
                          : 'text-ink/55'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap content-start gap-x-0 gap-y-1 leading-none">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const key = dateKey(day)
            const dayLogs = sysLogs.filter((n) => n.date === key)
            const isMarked = dayLogs.length > 0 || markedDays.includes(day)
            const isPast = isCurrentMonth && day < todayDay
            const isToday = isCurrentMonth && day === todayDay
            const isSelected = selectedDay === day

            const dayAbbr = new Date(viewYear, viewMonth, day)
              .toLocaleDateString('en-US', { weekday: 'short' })
              .toUpperCase()

            return (
              <div
                key={day}
                className={`relative flex h-[3.35rem] w-[14.28%] items-center justify-center sm:h-[3.75rem] ${
                  isSelected ? 'z-40' : 'z-10'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectDay(day)
                }}
              >
                <span
                  className={`select-none font-sans text-[1.85rem] font-light leading-none tracking-tighter sm:text-[2.15rem] ${
                    isSelected
                      ? 'text-cobalt'
                      : isPast
                        ? 'text-ink/[0.18]'
                        : 'text-ink'
                  } ${
                    isToday
                      ? 'underline decoration-2 underline-offset-2 decoration-ink'
                      : ''
                  }`}
                >
                  {day}
                </span>

                <span
                  className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5 font-mono text-[8px] font-black leading-none tracking-[0.18em] text-cobalt sm:text-[9px] ${
                    isPast ? 'opacity-40' : ''
                  }`}
                >
                  {dayAbbr}
                </span>

                {isMarked && (
                  <span className="pointer-events-none absolute inset-x-1 top-1/2 z-20 h-[2px] -translate-y-1/2 bg-urgent sm:h-[3px]" />
                )}

                {isSelected && dayLogs.length > 0 && (
                  <div className="pointer-events-none absolute left-1/2 top-[58%] z-50 flex min-w-[120%] max-w-[240%] -translate-x-1/2 flex-col items-stretch">
                    {dayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="pointer-events-auto mt-[2px] flex items-start justify-between gap-1 bg-white px-1 py-0.5 font-mono text-[9px] font-black leading-tight tracking-wider text-cobalt sm:text-[11px]"
                      >
                        <span className="whitespace-normal break-words text-left uppercase">
                          {log.text}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, log.id)}
                          className="shrink-0 text-cobalt hover:text-urgent"
                          aria-label="Delete log"
                        >
                          [X]
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
