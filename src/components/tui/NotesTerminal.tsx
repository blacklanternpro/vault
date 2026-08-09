import { NOTES_LOG } from '../../data/tui';

/**
 * NOTES rendered as an inverted terminal: pure black background, terminal
 * green text, bleeding full-width -- the one zone allowed to break the
 * "float on the canvas" rule, by design.
 */
export function NotesTerminal() {
  return (
    <div className="tui-scanlines bg-ink px-4 py-5 sm:px-5 sm:py-6">
      <p className="text-[10px] uppercase tracking-tighter text-term-green/60 sm:text-xs">
        root@tui-os:~$ tail -f notes.log
      </p>

      <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs">
        {NOTES_LOG.map((line) => (
          <li key={line.time} className="flex gap-3 text-term-green">
            <span className="shrink-0 tabular-nums text-term-green/55">
              {line.time}
            </span>
            <span className="truncate">{line.message}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-term-green sm:text-xs">
        <span className="text-term-green/55" aria-hidden="true">
          &gt;
        </span>
        <span
          className="caret-blink inline-block h-3.5 w-2 bg-term-green"
          aria-hidden="true"
        />
      </p>
    </div>
  );
}
