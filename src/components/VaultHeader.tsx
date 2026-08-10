interface VaultHeaderProps {
  onToggleDark: () => void;
}

export function VaultHeader({ onToggleDark }: VaultHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-neutral-950 border-b-2 border-white flex items-center justify-center py-2 px-4">
      {/* 90s corporate brutalist logo assembly */}
      <div className="flex flex-row items-center gap-2 border border-white p-1">
        {/* Micro-Globe: pure-CSS wireframe reticle (no SVG) */}
        <div className="relative w-5 h-5 rounded-full border border-white overflow-hidden shrink-0">
          {/* Vertical crosshair */}
          <span className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white" />
          {/* Horizontal crosshair */}
          <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white" />
        </div>

        {/* Wordmark */}
        <span className="font-sans font-black tracking-tighter text-white uppercase leading-none bg-black px-2 py-1">
          VAULT
        </span>

        {/* Micro-Data */}
        <div className="flex flex-col font-mono text-[9px] uppercase leading-none text-zinc-400 gap-0.5">
          <span>SYS.REC // 01</span>
          <span>WORLDWIDE</span>
        </div>
      </div>

      {/* Dark-mode invert toggle, kept out of the centered assembly */}
      <button
        onClick={onToggleDark}
        className="absolute right-4 text-[#0000FF] font-black text-[10px] md:text-xs border-2 border-[#0000FF] px-2 py-1 hover:bg-[#0000FF] hover:text-white transition-colors tracking-widest"
      >
        [ INVERT_OS ]
      </button>
    </header>
  );
}
