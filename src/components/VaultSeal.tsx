/** Centered 90s-sleaze VAULT WORLDWIDE micrographic — no boxes. */
export function VaultSeal({
  clock,
  onToggleDark,
}: {
  clock: string
  onToggleDark: () => void
}) {
  return (
    <header className="relative z-[90] border-b border-ink/30 bg-canvas px-3 pb-3 pt-4 sm:px-4">
      <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4">
        <span className="font-mono text-[10px] tabular-nums tracking-[0.22em] text-cobalt">
          {clock}
        </span>
        <button
          type="button"
          onClick={onToggleDark}
          className="font-mono text-[10px] font-bold tracking-[0.2em] text-cobalt hover:bg-cobalt hover:text-canvas"
          aria-label="Invert display"
        >
          INV
        </button>
      </div>

      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <svg
          viewBox="0 0 280 118"
          className="h-auto w-[min(240px,78vw)] text-ink"
          role="img"
          aria-label="VAULT WORLDWIDE"
        >
          {/* Orbital industrial seal */}
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="140" cy="42" r="38" />
            <circle cx="140" cy="42" r="32" strokeDasharray="2 3" opacity="0.55" />
            <ellipse cx="140" cy="42" rx="28" ry="12" stroke="#0000FF" strokeWidth="1.4" />
            <ellipse
              cx="140"
              cy="42"
              rx="12"
              ry="28"
              stroke="#0000FF"
              strokeWidth="1.4"
              transform="rotate(55 140 42)"
            />
            <ellipse
              cx="140"
              cy="42"
              rx="12"
              ry="28"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.45"
              transform="rotate(-35 140 42)"
            />
          </g>

          {/* Scanline globe core */}
          <g stroke="#0000FF" strokeWidth="2.2" strokeLinecap="butt">
            {[
              [118, 24, 162, 24],
              [112, 29, 168, 29],
              [108, 34, 172, 34],
              [106, 39, 174, 39],
              [105, 44, 175, 44],
              [106, 49, 174, 49],
              [108, 54, 172, 54],
              [112, 59, 168, 59],
              [118, 64, 162, 64],
            ].map(([x1, y1, x2, y2], i) => (
              <line
                key={i}
                x1={x1 + (i % 2 === 0 ? 0 : 1.5)}
                y1={y1}
                x2={x2 - (i % 2 === 0 ? 0 : 1.5)}
                y2={y2}
                opacity={0.55 + (i % 3) * 0.12}
              />
            ))}
            <line x1="140" y1="18" x2="140" y2="66" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M118 42 C128 30, 152 30, 162 42 C152 54, 128 54, 118 42"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
          </g>

          {/* Ring legend */}
          <text
            x="140"
            y="12"
            textAnchor="middle"
            fill="currentColor"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '6.5px',
              letterSpacing: '0.28em',
            }}
          >
            REINDUSTRIALIZE
          </text>

          {/* Wordmark */}
          <text
            x="140"
            y="92"
            textAnchor="middle"
            fill="currentColor"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.34em',
            }}
          >
            VAULT
          </text>
          <text
            x="140"
            y="108"
            textAnchor="middle"
            fill="#0000FF"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.42em',
            }}
          >
            WORLDWIDE ®
          </text>

          {/* Constellation ticks */}
          <g fill="#0000FF">
            <circle cx="86" cy="42" r="1.4" />
            <circle cx="94" cy="34" r="1.1" />
            <circle cx="94" cy="50" r="1.1" />
            <circle cx="194" cy="42" r="1.4" />
            <circle cx="186" cy="34" r="1.1" />
            <circle cx="186" cy="50" r="1.1" />
            <circle cx="140" cy="42" r="1.6" />
          </g>
        </svg>

        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-ink/45">
          local_first // no_cloud
        </p>
      </div>
    </header>
  )
}
