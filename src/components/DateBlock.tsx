import { useState, type KeyboardEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface DateBlockProps {
  day: number;
}

/**
 * A single brutalist date block: a strict, zero-gap vertical stack of flush
 * boxes (Day Tag / TODO toggle / Notes dropdown). The block owns an id matching
 * the micro-calendar HUD links so those anchors hard-jump here.
 *
 * Per-date notes are backed by the CRDT sysLogs:
 *  - Click an active (amber) note to mark it completed (gray + red strike).
 *  - Type in the terminal input + Enter to append a note (which flickers in).
 *  - TODO button reflects state: dead (gray + red strike) + unclickable when
 *    empty; red + clickable with active notes; dead but still clickable when
 *    every note is completed (so history + input stay reachable).
 */
export function DateBlock({ day }: DateBlockProps) {
  const { sysLogs, addSysLog, toggleSysLog } = useCrdtState();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const dd = day < 10 ? `0${day}` : `${day}`;
  const dateStr = `08.${dd}.26`;
  const weekday = new Date(2026, 7, day)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();

  const records = sysLogs.filter((log) => log.date === dateStr);
  const total = records.length;
  const activeCount = records.filter((log) => !log.completed).length;
  const isEmpty = total === 0;
  const allCompleted = total > 0 && activeCount === 0;

  // Dead (gray + red strike) when empty or fully completed; only empty is
  // unclickable -- a fully-completed block still opens for history + input.
  const todoDead = isEmpty || allCompleted;
  const clickable = !isEmpty;

  const deadClass = 'text-gray-500 line-through decoration-red-500 decoration-2';

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    addSysLog({ id: Date.now().toString(), date: dateStr, text, day });
    setDraft('');
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addNote();
    }
  };

  return (
    <div id={`date-${day}`} className="flex flex-col gap-0 scroll-mt-40">
      {/* Day Tag */}
      <div className="font-sans font-black uppercase border-2 border-ink px-3 py-2 flex items-baseline justify-between">
        <span className="text-3xl leading-none tracking-tighter">{dd}</span>
        <span className="font-mono text-[10px] tracking-[0.25em]">{weekday}</span>
      </div>

      {/* TODO toggle -- flush underneath (border-t-0 avoids a double border) */}
      <button
        type="button"
        disabled={!clickable}
        aria-expanded={open}
        onClick={() => clickable && setOpen((prev) => !prev)}
        className={`border-2 border-t-0 border-ink px-3 py-2 text-left font-sans font-black uppercase tracking-widest ${
          todoDead ? deadClass : 'text-[#FF2B2B]'
        } ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'} ${
          clickable && !todoDead ? 'hover:bg-[#FF2B2B] hover:text-canvas' : ''
        }`}
      >
        TODO
      </button>

      {/* Notes dropdown -- snaps open (display: block), no transition */}
      {open && (
        <div className="border-2 border-t-0 border-ink px-3 py-2 font-mono text-xs flex flex-col gap-1">
          {records.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => toggleSysLog(log.id)}
              className={`text-left break-words leading-snug animate-amber-flicker cursor-pointer ${
                log.completed ? deadClass : 'text-amber-500'
              }`}
            >
              &gt; {log.text}
            </button>
          ))}

          {/* Terminal input -- stripped styling, amber caret + text */}
          <div className="flex items-center gap-1 text-amber-500">
            <span aria-hidden className="select-none">
              &gt;
            </span>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onInputKeyDown}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 text-amber-500 caret-amber-500 placeholder:text-amber-500/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
