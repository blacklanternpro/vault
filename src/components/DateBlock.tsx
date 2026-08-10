import { useState } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';

interface DateBlockProps {
  day: number;
}

/**
 * A single brutalist date block: a strict, zero-gap vertical stack of three
 * flush-stacked boxes (Day Tag / TODO toggle / Notes dropdown). The block owns
 * an id matching the micro-calendar HUD links so those anchors hard-jump here.
 *
 * The dropdown snaps open instantly (conditional render -> display: block, no
 * transition); on mount its amber text flickers via a steps() keyframe.
 */
export function DateBlock({ day }: DateBlockProps) {
  const { sysLogs, notes } = useCrdtState();
  const [open, setOpen] = useState(false);

  const dd = day < 10 ? `0${day}` : `${day}`;
  const dateStr = `08.${dd}.26`;
  const weekday = new Date(2026, 7, day)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();

  const records = [
    ...sysLogs.filter((log) => log.date === dateStr).map((log) => log.text),
    ...notes.filter((note) => note.date === dateStr).map((note) => note.text),
  ];

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
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="border-2 border-t-0 border-ink px-3 py-2 text-left font-sans font-black uppercase tracking-widest text-[#FF2B2B] hover:bg-[#FF2B2B] hover:text-canvas"
      >
        TODO
      </button>

      {/* Notes dropdown -- same box, flush underneath, amber mono text */}
      {open && (
        <div className="border-2 border-t-0 border-ink px-3 py-2 font-mono text-xs text-amber-500 flex flex-col gap-1 animate-amber-flicker">
          {records.length > 0 ? (
            records.map((text, index) => (
              <span key={index} className="break-words leading-snug">
                &gt; {text}
              </span>
            ))
          ) : (
            <span className="opacity-60">&gt; NO_RECORDS</span>
          )}
        </div>
      )}
    </div>
  );
}
