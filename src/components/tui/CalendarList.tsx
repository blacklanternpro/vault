import { CALENDAR_ENTRIES } from '../../data/tui';

const GRID_COLS = 'grid-cols-[52px_1fr] sm:grid-cols-[64px_56px_120px_1fr]';

export function CalendarList() {
  return (
    <div>
      <div
        className={`grid ${GRID_COLS} gap-x-4 border-b border-grid-line pb-2 text-[9px] uppercase tracking-tighter text-ink/45 sm:text-[10px]`}
      >
        <span>DATE</span>
        <span className="hidden sm:block">TIME</span>
        <span className="hidden sm:block">NODE</span>
        <span>EVENT</span>
      </div>

      <ul>
        {CALENDAR_ENTRIES.map((entry) => (
          <li
            key={`${entry.date}-${entry.event}`}
            className={`grid ${GRID_COLS} items-baseline gap-x-4 border-b border-grid-line py-2.5 text-[11px] sm:text-xs`}
          >
            <span className="tabular-nums text-cobalt">{entry.date}</span>
            <span className="hidden text-ink/70 sm:block">{entry.time}</span>
            <span className="hidden truncate uppercase text-ink/70 sm:block">
              {entry.node}
            </span>
            <span className="truncate uppercase tracking-tight">
              {entry.event}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
