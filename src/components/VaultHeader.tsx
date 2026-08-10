interface VaultHeaderProps {
  onToggleDark: () => void;
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

export function VaultHeader({ onToggleDark }: VaultHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-canvas border-b-2 border-ink flex items-center justify-center py-3 px-4">
      <VaultGlobeLogo />

      {/* Dark-mode invert toggle, kept out of the standalone logo */}
      <button
        onClick={onToggleDark}
        className="absolute right-4 text-[#0000FF] font-black text-[10px] md:text-xs border-2 border-[#0000FF] px-2 py-1 hover:bg-[#0000FF] hover:text-white transition-colors tracking-widest"
      >
        [ INVERT_OS ]
      </button>
    </header>
  );
}
