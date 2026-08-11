interface VaultHeaderProps {
  onToggleDark: () => void;
  clock: string;
}

export function VaultHeader({ onToggleDark, clock }: VaultHeaderProps) {
  return (
    <header className="relative pt-16 pb-8 md:pt-20 md:pb-10 flex flex-col items-center justify-center">
      <button
        type="button"
        onClick={onToggleDark}
        className="absolute top-6 right-4 md:right-8 text-cobalt font-black text-[10px] md:text-xs border-2 border-cobalt px-2 py-1 hover:bg-cobalt hover:text-canvas transition-colors tracking-widest uppercase"
      >
        [ INVERT_OS ]
      </button>

      {/* WRLDWD-style wireframe seal with VAULT knocked into the equator */}
      <svg
        width="260"
        height="130"
        viewBox="0 0 200 100"
        fill="none"
        className="text-ink"
        aria-label="VAULT"
      >
        <ellipse cx="100" cy="50" rx="95" ry="48" stroke="currentColor" strokeWidth="2.5" />
        <path d="M5 50 Q100 85 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 50 Q100 15 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <ellipse cx="100" cy="50" rx="45" ry="48" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="100" cy="50" rx="18" ry="48" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <line x1="100" y1="2" x2="100" y2="98" stroke="currentColor" strokeWidth="2" />
        <rect x="36" y="30" width="128" height="40" fill="#F4F4F0" />
        <text
          x="100"
          y="58"
          textAnchor="middle"
          fill="currentColor"
          className="font-sans font-bold"
          style={{ fontSize: '28px', letterSpacing: '0.12em' }}
        >
          VAULT
        </text>
        <text
          x="168"
          y="38"
          fill="#0000FF"
          className="font-mono"
          style={{ fontSize: '10px', fontWeight: 700 }}
        >
          ®
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[10px] md:text-xs tracking-widest uppercase text-ink">
        <span className="bg-cobalt text-canvas px-1.5 py-0.5 font-bold">LOCAL</span>
        <span className="opacity-40">//</span>
        <span className="font-bold text-cobalt">SYNC_OK</span>
        <span className="opacity-40">//</span>
        <span className="tabular-nums">{clock}</span>
      </div>
    </header>
  );
}
