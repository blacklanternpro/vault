import { useState } from 'react';
import { VaultHeader } from './components/VaultHeader';
import { Calendar } from './components/Calendar';
import { TaskNest } from './components/TaskNest';
import { Scratchpad } from './components/Scratchpad';

const CURRENT_DAY = 11; // August 11, 2026

export default function App() {
  const [isDark, setIsDark] = useState(false); // DARK MODE STATE

  return (
    // The master wrapper applies the invert and hue-rotate when isDark is true
    <div className={`min-h-screen bg-neutral-950 text-neutral-100 font-mono selection:bg-[#0000FF] selection:text-white pb-32 antialiased overflow-x-hidden transition-all duration-300 ${isDark ? 'invert hue-rotate-180' : ''}`}>
      
      {/* ===================================================================
          1. THE VAULT LOGO 
         =================================================================== */}
      <VaultHeader onToggleDark={() => setIsDark(!isDark)} />

      <main className="max-w-4xl mx-auto px-4 md:px-8 space-y-32">
        
        {/* ===================================================================
            2. CALENDAR 
           =================================================================== */}
        <Calendar currentDay={CURRENT_DAY} />

        {/* ===================================================================
            3. TASKS 
           =================================================================== */}
        <TaskNest currentDay={CURRENT_DAY} />

        {/* ===================================================================
            4. SCRATCHPAD 
           =================================================================== */}
        <Scratchpad currentDay={CURRENT_DAY} />

      </main>
    </div>
  );
}
