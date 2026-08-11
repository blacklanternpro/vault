import { type MouseEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface CalendarProps {
  year: number;
  monthIndex: number;
  currentDay: number;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function Calendar({
  year,
  monthIndex,
  currentDay,
  selectedDay,
  onSelectDay,
}: CalendarProps) {
  const { sysLogs, markedDays, deleteSysLog } = useCrdtState();

  const totalDays = daysInMonth(year, monthIndex);
  const yy = String(year).slice(-2);
  const mm = pad2(monthIndex + 1);
  const dateKey = (day: number) => `${mm}.${pad2(day)}.${yy}`;

  const handleDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSysLog(id);
  };

  return (
    <section className="relative w-full">
      {/* Full-bleed cram — no watermark, no section chrome */}
      <div className="grid grid-cols-7 gap-0 w-full leading-none text-center">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const key = dateKey(day);
          const dayLogs = sysLogs.filter((n) => n.date === key);
          const isMarked = dayLogs.length > 0 || markedDays.includes(day);
          const isPast = day < currentDay;
          const isToday = day === currentDay;
          const isSelected = selectedDay === day;

          const dayAbbr = new Date(year, monthIndex, day)
            .toLocaleDateString('en-US', { weekday: 'short' })
            .toUpperCase();

          return (
            <div
              key={day}
              className={`relative flex items-center justify-center w-full aspect-[3/4] md:aspect-[4/3] cursor-pointer ${
                isSelected ? 'z-40 bg-cobalt/5' : 'z-10'
              }`}
              onClick={() => onSelectDay(isSelected ? null : day)}
            >
              <span
                className={`font-sans font-light text-[4.25rem] sm:text-[5rem] md:text-[8rem] tracking-tighter leading-[0.7] select-none ${
                  isSelected
                    ? 'text-cobalt'
                    : isPast
                      ? 'text-ink/[0.12]'
                      : 'text-ink'
                } ${isToday ? 'underline decoration-[3px] md:decoration-[5px] underline-offset-2 decoration-ink' : ''}`}
              >
                {day}
              </span>

              <span
                className={`absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-white px-1 font-mono text-[10px] font-black leading-none tracking-[0.22em] text-cobalt pointer-events-none md:text-[13px] ${
                  isPast ? 'opacity-40' : ''
                }`}
              >
                {dayAbbr}
              </span>

              {isMarked && (
                <span className="absolute inset-x-0 h-[3px] md:h-[4px] bg-urgent top-1/2 -translate-y-1/2 pointer-events-none z-20" />
              )}

              {/* Parasite log stack — overlays the grid hard */}
              {isSelected && dayLogs.length > 0 && (
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 z-50 flex flex-col items-stretch pointer-events-none min-w-[70%] max-w-[220%]">
                  {dayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="mt-[3px] text-cobalt bg-white px-1.5 py-0.5 font-black text-[11px] md:text-[14px] tracking-widest leading-tight flex items-start justify-between gap-2 pointer-events-auto whitespace-normal break-words shadow-none border border-cobalt/20"
                    >
                      <span className="text-left uppercase">{log.text}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, log.id)}
                        className="text-cobalt hover:text-urgent shrink-0"
                        aria-label="Delete log"
                      >
                        [X]
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
