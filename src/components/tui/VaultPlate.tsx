import { Fragment } from 'react';
import { VAULT_ROWS } from '../../data/tui';

/**
 * The "VAULT" micro-graphic: a dense, black hardware-serial-plate block that
 * sits starkly against the off-white canvas. Pure data, tightly padded,
 * perfectly column-aligned via CSS grid rather than manual space-padding.
 */
export function VaultPlate() {
  return (
    <div className="bg-ink text-canvas">
      <div className="flex items-center justify-between gap-3 border-b border-white/15 px-3 py-2 sm:px-4">
        <span className="truncate text-[9px] font-bold uppercase tracking-tighter text-white/55 sm:text-[10px]">
          VAULT_MICRO // SERIAL_PLATE
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[9px] uppercase tracking-tighter text-white/55 sm:text-[10px]">
          <span
            className="h-1.5 w-1.5 shrink-0 animate-pulse bg-term-green"
            aria-hidden="true"
          />
          LIVE
        </span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-3 py-3 text-[10px] sm:px-4 sm:py-4 sm:text-xs">
        {VAULT_ROWS.map((row) => (
          <Fragment key={row.key}>
            <dt className="whitespace-nowrap text-white/55">[{row.key}]</dt>
            <dd className="truncate text-white">{row.value}</dd>
          </Fragment>
        ))}
      </dl>

      <div className="flex items-center gap-1.5 px-3 pb-3 text-[10px] text-white/40 sm:px-4 sm:pb-4">
        <span aria-hidden="true">&gt;</span>
        <span
          className="caret-blink inline-block h-3 w-1.5 bg-term-green"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
