import { useClock } from '../../hooks/useClock';

/**
 * Base status bar. Closes off the architectural frame and keeps a live
 * ticking clock so the "OFFLINE_READY" system reads as genuinely alive.
 */
export function StatusBar() {
  const time = useClock();

  return (
    <footer className="flex flex-col gap-1.5 border-t border-grid-line px-4 py-3 text-[9px] uppercase tracking-tighter text-ink/55 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:text-[10px]">
      <span>NODE:: EAST_BUNBURY_WA // GRID_REF:: 33.33S_115.64E</span>
      <span className="flex items-center gap-2">
        <span>BUILD:: TUI_KERNEL_V1</span>
        <span aria-hidden="true">//</span>
        <span className="tabular-nums text-ink">LOCAL_TIME:: {time}</span>
      </span>
    </footer>
  );
}
