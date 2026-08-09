import { INDEX_ITEMS, TASK_ITEMS } from '../../data/tui';

/**
 * Top-right header quadrant. Balances the VAULT plate on the left and
 * doubles as a table-of-contents for the zones scaffolded below.
 */
export function IndexPanel() {
  const openCount = TASK_ITEMS.filter((task) => task.status !== 'DONE').length;

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-bold uppercase tracking-tighter text-cobalt sm:text-[10px]">
            NAV_INDEX
          </span>
          <span className="text-[9px] uppercase tracking-tighter text-ink/50 sm:text-[10px]">
            QUEUE ({String(openCount).padStart(2, '0')})
          </span>
        </div>

        <ul className="mt-3 divide-y divide-grid-line border-t border-grid-line">
          {INDEX_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-2 text-[10px] uppercase tracking-tight sm:text-xs"
            >
              <span className="text-ink/40">[{item.id}]</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-cobalt" aria-hidden="true">
                -&gt;
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-tighter text-ink/50 sm:text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 bg-cobalt" aria-hidden="true" />
          ALL_SYSTEMS // NOMINAL
        </span>
        <span>ACCESS:: GRANTED</span>
      </div>
    </div>
  );
}
