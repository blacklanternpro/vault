import { useState, type FormEvent, type MouseEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface CalendarProps {
  currentDay: number;
}

const getOrdinal = (n: number) => {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const getFullDateString = (day: number) => {
  const dateObj = new Date(2026, 7, day);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  return `${dayName} THE ${getOrdinal(day)} AUGUST 2026`;
};

export function Calendar({ currentDay }: CalendarProps) {
  const { sysLogs, markedDays, addSysLog, deleteSysLog } = useCrdtState();

  const [selectedDay, setSelectedDay] = useState<number | null>(currentDay);
  const [dayNoteInput, setDayNoteInput] = useState('');

  const handleAddSysLog = (e: FormEvent) => {
    e.preventDefault();
    if (!dayNoteInput.trim() || selectedDay === null) return;
    addSysLog({
      id: Date.now().toString(),
      date: `08.${selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26`,
      text: dayNoteInput,
      day: selectedDay,
    });
    setDayNoteInput('');
  };

  const handleDeleteSysLog = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSysLog(id);
  };

  return (
    <section className="relative w-full flex flex-col items-center mt-12 mb-8">
      
      <div className="relative z-10 w-full max-w-4xl flex justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[45vw] md:text-[38rem] font-black text-[#00FFCC] tracking-tighter leading-none mix-blend-multiply opacity-60 select-none">
            AUG
          </span>
        </div>

        <div className="grid grid-cols-7 gap-0 w-full leading-none text-center relative z-10">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const dateStr = `08.${day < 10 ? `0${day}` : day}.26`;
            const dayLogs = sysLogs.filter(n => n.date === dateStr);
            const isMarked = dayLogs.length > 0 || markedDays.includes(day);
            const isPast = day < currentDay;
            const isToday = day === currentDay;
            const isSelected = selectedDay === day;
            
            const dateObj = new Date(2026, 7, day);
            const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

            return (
              <div key={day} className="relative flex items-center justify-center w-full aspect-[4/3] hover:bg-black/5 cursor-pointer z-10" onClick={() => setSelectedDay(selectedDay === day ? null : day)}>
                
                <span className={`font-sans font-light text-[4.5rem] md:text-[7.5rem] tracking-tighter leading-[0.75] transition-colors ${
                  isSelected ? 'text-[#0000FF] font-medium' : isPast ? 'text-gray-200' : 'text-[#111]'
                } ${isToday ? 'border-b-[4px] md:border-b-[6px] border-[#111] pb-1 md:pb-2' : ''}`}>
                  {day}
                </span>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 pointer-events-none">
                  <span className={`text-[12px] md:text-[16px] font-black text-[#0000FF] tracking-widest bg-[#F4F4F0] px-1 leading-none ${isPast ? 'opacity-40' : 'opacity-100'}`}>
                    {dayAbbr}
                  </span>
                  {isSelected && dayLogs.map((log) => (
                    <div key={log.id} className="text-[#0000FF] bg-[#F4F4F0] px-1 font-black text-[12px] md:text-[16px] tracking-widest leading-none mt-[2px] flex items-center gap-2 whitespace-nowrap pointer-events-auto shadow-sm">
                      <span>{log.text}</span>
                      <button onClick={(e) => handleDeleteSysLog(e, log.id)} className="text-[#0000FF] hover:text-[#FF2B2B] transition-colors">
                        [X]
                      </button>
                    </div>
                  ))}
                </div>
                
                {isMarked && (
                  <span className="absolute inset-x-0 h-[3px] md:h-[4px] bg-[#FF2B2B] top-1/2 -translate-y-1/2 pointer-events-none z-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay !== null && (
        <div className="mt-8 mb-4 w-full max-w-3xl mx-auto font-mono relative z-0 bg-[#F4F4F0]">
          <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-4 select-none opacity-80">
            {'*'.repeat(150)}
          </div>
          
          <div className="flex justify-between items-end mb-4 text-[#0000FF] text-xs md:text-sm font-bold uppercase tracking-widest">
            <span>DATE // {getFullDateString(selectedDay)}</span>
          </div>

          <form onSubmit={handleAddSysLog} className="flex items-end gap-3 text-[#0000FF] text-xs md:text-sm">
            <span className="font-bold animate-pulse mb-1">{'>'}</span>
            <input
              type="text"
              value={dayNoteInput}
              onChange={(e) => setDayNoteInput(e.target.value)}
              placeholder="APPEND RECORD TO SELECTED DATE..."
              className="flex-1 bg-transparent border-b-[2px] border-[#0000FF] outline-none text-[#0000FF] placeholder:text-[#0000FF]/40 pb-1 rounded-none uppercase font-bold"
            />
            <button type="submit" className="font-bold hover:bg-[#0000FF] hover:text-[#F4F4F0] px-3 py-1 transition-colors tracking-widest">
              [ENTER]
            </button>
          </form>

          <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mt-6 select-none opacity-80">
            {'*'.repeat(150)}
          </div>
        </div>
      )}
    </section>
  );
}
