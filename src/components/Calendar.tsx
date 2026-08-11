import { useState, type FormEvent, type MouseEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface CalendarProps {
  year: number;
  monthIndex: number; // 0-based
  currentDay: number;
  monthShort: string;
}

const getOrdinal = (n: number) => {
  const s = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

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
  monthShort,
}: CalendarProps) {
  const { sysLogs, markedDays, addSysLog, deleteSysLog } = useCrdtState();

  const [selectedDay, setSelectedDay] = useState<number | null>(currentDay);
  const [dayNoteInput, setDayNoteInput] = useState('');

  const totalDays = daysInMonth(year, monthIndex);
  const yy = String(year).slice(-2);
  const mm = pad2(monthIndex + 1);

  const dateKey = (day: number) => `${mm}.${pad2(day)}.${yy}`;

  const getFullDateString = (day: number) => {
    const dateObj = new Date(year, monthIndex, day);
    const dayName = dateObj
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase();
    const monthName = dateObj
      .toLocaleDateString('en-US', { month: 'long' })
      .toUpperCase();
    return `${dayName} THE ${getOrdinal(day)} ${monthName} ${year}`;
  };

  const handleAddSysLog = (e: FormEvent) => {
    e.preventDefault();
    if (!dayNoteInput.trim() || selectedDay === null) return;
    addSysLog({
      id: Date.now().toString(),
      date: dateKey(selectedDay),
      text: dayNoteInput.trim().toUpperCase(),
      day: selectedDay,
    });
    setDayNoteInput('');
  };

  const handleDeleteSysLog = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSysLog(id);
  };

  return (
    <section className="relative w-full flex flex-col items-center mt-6 mb-4">
      {/* Grid + watermark locked together so watermark never shifts */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <span className="text-[42vw] md:text-[36rem] font-sans font-black text-acid tracking-tighter leading-none mix-blend-multiply opacity-55 select-none">
            {monthShort}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-0 w-full leading-none text-center relative z-10">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const key = dateKey(day);
            const dayLogs = sysLogs.filter((n) => n.date === key);
            const isMarked = dayLogs.length > 0 || markedDays.includes(day);
            const isPast = day < currentDay;
            const isToday = day === currentDay;
            const isSelected = selectedDay === day;

            const dateObj = new Date(year, monthIndex, day);
            const dayAbbr = dateObj
              .toLocaleDateString('en-US', { weekday: 'short' })
              .toUpperCase();

            return (
              <div
                key={day}
                className={`relative flex items-center justify-center w-full aspect-[4/3] cursor-pointer ${
                  isSelected ? 'z-40' : 'z-10'
                } hover:bg-ink/5`}
                onClick={() =>
                  setSelectedDay(selectedDay === day ? null : day)
                }
              >
                {/* Massive numeral */}
                <span
                  className={`font-sans font-light text-[5rem] md:text-[7.5rem] tracking-tighter leading-[0.75] transition-colors select-none ${
                    isSelected
                      ? 'text-cobalt font-medium'
                      : isPast
                        ? 'text-ink/15'
                        : 'text-ink'
                  } ${
                    isToday
                      ? 'border-b-[4px] md:border-b-[6px] border-ink pb-1 md:pb-2'
                      : ''
                  }`}
                >
                  {day}
                </span>

                {/*
                  Day label + inline logs.
                  Selected cell elevates to z-40 so the diary cascade paints
                  OVER neighboring numerals — never buried behind the grid.
                */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 pointer-events-none max-w-[95%]">
                  <span
                    className={`text-[12px] md:text-[16px] font-black text-cobalt tracking-widest bg-white px-1 leading-none ${
                      isPast ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    {dayAbbr}
                  </span>

                  {isSelected &&
                    dayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="mt-[2px] text-cobalt bg-white px-1 font-black text-[12px] md:text-[16px] tracking-widest leading-none flex items-center gap-1.5 pointer-events-auto whitespace-normal break-words text-left shadow-none"
                      >
                        <span>{log.text}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSysLog(e, log.id)}
                          className="text-cobalt hover:text-urgent transition-colors shrink-0"
                          aria-label="Delete log"
                        >
                          [X]
                        </button>
                      </div>
                    ))}
                </div>

                {/* Red strike OVER the day label */}
                {isMarked && (
                  <span className="absolute inset-x-0 h-[3px] md:h-[4px] bg-urgent top-1/2 -translate-y-1/2 pointer-events-none z-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* VCR / receipt logger — typography only, no boxes */}
      {selectedDay !== null && (
        <div className="mt-6 mb-2 w-full max-w-3xl mx-auto font-mono relative z-0 bg-canvas">
          <div className="text-cobalt text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-3 select-none opacity-80">
            {'*'.repeat(160)}
          </div>

          <div className="flex justify-between items-end mb-3 text-cobalt text-xs md:text-sm font-bold uppercase tracking-widest">
            <span>DATE // {getFullDateString(selectedDay)}</span>
          </div>

          <form
            onSubmit={handleAddSysLog}
            className="flex items-end gap-3 text-cobalt text-xs md:text-sm"
          >
            <span className="font-bold vault-caret mb-1">{'>'}</span>
            <input
              type="text"
              value={dayNoteInput}
              onChange={(e) => setDayNoteInput(e.target.value)}
              placeholder="APPEND RECORD TO SELECTED DATE..."
              className="flex-1 bg-transparent border-b-[2px] border-cobalt outline-none text-cobalt placeholder:text-cobalt/40 pb-1 rounded-none uppercase font-bold caret-cobalt"
            />
            <button
              type="submit"
              className="font-bold hover:bg-cobalt hover:text-canvas px-3 py-1 transition-colors tracking-widest"
            >
              [ENTER]
            </button>
          </form>

          <div className="text-cobalt text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mt-4 select-none opacity-80">
            {'*'.repeat(160)}
          </div>
        </div>
      )}
    </section>
  );
}
