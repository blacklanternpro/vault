import { useCrdtState } from '../hooks/useCrdtState';

interface VaultHeaderProps {
  onToggleDark: () => void;
  currentDay: number;
}

/**
 * Micro-Calendar HUD: a horizontally scrollable strip of 1..31 sitting under
 * the logo. Noted days glow terminal amber, empty days are concrete gray, and
 * the current day is an inverted chip. Each number is an anchor that hard-jumps
 * to its date cell in the calendar below.
 */
function MicroCalendarLegend({ currentDay }: { currentDay: number }) {
  const { sysLogs, markedDays } = useCrdtState();

  const notedDays = new Set<number>(markedDays);
  for (const log of sysLogs) {
    const day = parseInt(log.date.split('.')[1] ?? '', 10);
    if (!Number.isNaN(day)) notedDays.add(day);
  }

  return (
    <nav className="w-72 max-w-full flex overflow-x-auto gap-3 no-scrollbar font-mono text-xs">
      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
        const isCurrent = day === currentDay;
        const hasNotes = notedDays.has(day);

        const stateClass = isCurrent
          ? 'bg-ink text-canvas px-1' // inverted current-day chip
          : hasNotes
            ? 'text-[#FFB000]' // terminal amber
            : 'text-zinc-700'; // dead concrete gray

        return (
          <a
            key={day}
            href={`#date-${day}`}
            onClick={(e) => {
              // Force a harsh, instant jump regardless of the browser's
              // smooth-scroll setting, while keeping the anchor href + hash.
              e.preventDefault();
              document
                .getElementById(`date-${day}`)
                ?.scrollIntoView({ behavior: 'instant', block: 'start' });
              history.replaceState(null, '', `#date-${day}`);
            }}
            className={`shrink-0 leading-none tabular-nums no-underline hover:opacity-70 ${stateClass}`}
          >
            {day}
          </a>
        );
      })}
    </nav>
  );
}

/**
 * Standalone 90s corporate "digital globe" logo (WRLDWD / Pacific-Bell lineage):
 * a wide wireframe globe rendered in electric cobalt with the bold VAULT
 * wordmark banded across the equator. No box, no dates -- clean and stands
 * alone. Non-scaling strokes keep every grid line a crisp 1px hairline.
 */
function VaultGlobeLogo() {
  return (
    <div className="relative w-72 h-20 select-none">
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full text-[#0000FF]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      >
        <ellipse cx="100" cy="50" rx="98" ry="48" vectorEffect="non-scaling-stroke" />
        {/* Meridians */}
        <line x1="100" y1="2" x2="100" y2="98" vectorEffect="non-scaling-stroke" />
        <ellipse cx="100" cy="50" rx="34" ry="48" vectorEffect="non-scaling-stroke" />
        <ellipse cx="100" cy="50" rx="67" ry="48" vectorEffect="non-scaling-stroke" />
        {/* Latitudes */}
        <line x1="2" y1="50" x2="198" y2="50" vectorEffect="non-scaling-stroke" />
        <ellipse cx="100" cy="50" rx="98" ry="17" vectorEffect="non-scaling-stroke" />
        <ellipse cx="100" cy="50" rx="98" ry="34" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Wordmark -- knocked out across the equator, styled bold + slanted.
          The knockout uses the shared canvas token so it always matches the
          page background, even when the base color changes later. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-start bg-canvas px-3">
        <span className="font-sans font-black tracking-tighter text-ink uppercase leading-none text-5xl -skew-x-6">
          VAULT
        </span>
        <span className="font-mono text-xs text-[#0000FF] leading-none ml-1 mt-1">&reg;</span>
      </div>
    </div>
  );
}

export function VaultHeader({ onToggleDark, currentDay }: VaultHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-canvas border-b-2 border-ink flex flex-col items-center gap-2 py-3 px-4">
      <VaultGlobeLogo />
      <MicroCalendarLegend currentDay={currentDay} />

      {/* Dark-mode invert toggle, kept out of the standalone logo */}
      <button
        onClick={onToggleDark}
        className="absolute top-4 right-4 text-[#0000FF] font-black text-[10px] md:text-xs border-2 border-[#0000FF] px-2 py-1 hover:bg-[#0000FF] hover:text-white transition-colors tracking-widest"
      >
        [ INVERT_OS ]
      </button>
    </header>
  );
}
