interface VaultHeaderProps {
  onToggleDark: () => void;
}

export function VaultHeader({ onToggleDark }: VaultHeaderProps) {
  return (
    <header className="pt-24 pb-12 flex flex-col items-center justify-center relative">
      {/* Dark Mode Toggle */}
      <button 
        onClick={onToggleDark}
        className="absolute top-8 right-8 text-[#0000FF] font-black text-xs md:text-sm border-2 border-[#0000FF] px-3 py-1 hover:bg-[#0000FF] hover:text-[#F4F4F0] transition-colors tracking-widest"
      >
        [ INVERT_OS ]
      </button>

      <svg width="240" height="120" viewBox="0 0 200 100" fill="none" className="text-[#111]">
        <ellipse cx="100" cy="50" rx="95" ry="48" stroke="currentColor" strokeWidth="2.5" />
        <path d="M5 50 Q100 85 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 50 Q100 15 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <ellipse cx="100" cy="50" rx="45" ry="48" stroke="currentColor" strokeWidth="1.5" />
        <line x1="100" y1="2" x2="100" y2="98" stroke="currentColor" strokeWidth="2" />
        <rect x="40" y="30" width="120" height="40" fill="#0a0a0a" />
        <text x="100" y="58" textAnchor="middle" fill="currentColor" className="font-sans font-black text-4xl tracking-[0.1em] uppercase">VAULT</text>
      </svg>
    </header>
  );
}
