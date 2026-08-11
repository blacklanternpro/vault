export type OsMode = 'DAY' | 'NEST' | 'DUMP';

interface TeletextBarProps {
  clock: string;
  mode: OsMode;
  onMode: (m: OsMode) => void;
  onToggleDark: () => void;
  monthLabel: string;
  contextHint: string;
}

const MODES: OsMode[] = ['DAY', 'NEST', 'DUMP'];

export function TeletextBar({
  clock,
  mode,
  onMode,
  onToggleDark,
  monthLabel,
  contextHint,
}: TeletextBarProps) {
  return (
    <header className="sticky top-0 z-[100] bg-canvas border-b-2 border-cobalt">
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] md:text-xs font-mono tracking-widest uppercase">
        {/* Micro seal — not a hero */}
        <div className="flex items-center gap-2 shrink-0">
          <svg width="28" height="16" viewBox="0 0 56 32" fill="none" className="text-ink" aria-hidden>
            <ellipse cx="28" cy="16" rx="26" ry="14" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="28" cy="16" rx="12" ry="14" stroke="#0000FF" strokeWidth="1.5" />
            <line x1="28" y1="2" x2="28" y2="30" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="font-black text-ink tracking-[0.2em]">VAULT</span>
          <span className="text-cobalt font-bold">®</span>
        </div>

        <span className="tui-chip">{monthLabel}</span>
        <span className="text-cobalt/50 hidden sm:inline">//</span>
        <span className="tui-chip hidden sm:inline">LOCAL</span>
        <span className="text-cobalt font-bold tabular-nums">{clock}</span>

        <div className="flex items-center gap-1 ml-auto">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMode(m)}
              className={`px-1.5 py-0.5 border border-cobalt tracking-widest font-bold transition-colors ${
                mode === m
                  ? 'bg-cobalt text-canvas'
                  : 'text-cobalt hover:bg-cobalt hover:text-canvas'
              }`}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleDark}
            className="px-1.5 py-0.5 border border-cobalt text-cobalt font-bold tracking-widest hover:bg-cobalt hover:text-canvas ml-1"
          >
            INV
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-3 md:px-4 pb-2 text-[10px] md:text-[11px] font-mono text-cobalt tracking-wider uppercase overflow-hidden whitespace-nowrap">
        <span className="opacity-50">CTX // </span>
        {contextHint}
      </div>
    </header>
  );
}
