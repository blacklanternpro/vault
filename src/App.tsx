import { useMemo, useState } from 'react';
import { VaultHeader } from './components/VaultHeader';
import { Calendar } from './components/Calendar';
import { TaskNest } from './components/TaskNest';
import { Scratchpad } from './components/Scratchpad';
import { useClock } from './hooks/useClock';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const clock = useClock();

  const { year, monthIndex, currentDay, monthShort, dateLabel, noteDate } =
    useMemo(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const d = now.getDate();
      const short = now
        .toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase();
      const yy = String(y).slice(-2);
      const label = `${pad2(d)}.${pad2(m + 1)}.${yy}`;
      return {
        year: y,
        monthIndex: m,
        currentDay: d,
        monthShort: short,
        dateLabel: label,
        noteDate: label,
      };
    }, []);

  return (
    <div
      className={`min-h-screen bg-canvas text-ink font-mono selection:bg-cobalt selection:text-canvas pb-24 antialiased overflow-x-hidden ${
        isDark ? 'invert hue-rotate-180' : ''
      }`}
    >
      <div className="vault-grain" aria-hidden />
      <div className="vault-scan" aria-hidden />

      <VaultHeader
        onToggleDark={() => setIsDark((v) => !v)}
        clock={clock}
      />

      <main className="max-w-4xl mx-auto px-4 md:px-8 space-y-16 md:space-y-20">
        <Calendar
          year={year}
          monthIndex={monthIndex}
          currentDay={currentDay}
          monthShort={monthShort}
        />
        <TaskNest dateLabel={dateLabel} />
        <Scratchpad dateLabel={noteDate} />
      </main>

      <footer className="max-w-4xl mx-auto px-4 md:px-8 pt-16 pb-6 flex justify-between items-center font-mono text-[9px] md:text-[10px] tracking-widest uppercase text-ink/40">
        <span>VAULT // TUI_OS</span>
        <span className="tabular-nums">{clock}</span>
        <span>NO_NETWORK_REQUIRED</span>
      </footer>
    </div>
  );
}
