import { useState } from 'react';
import { VaultHeader } from './components/VaultHeader';
import { MainLayout } from './components/MainLayout';
import { Calendar } from './components/Calendar';
import { TaskNest } from './components/TaskNest';
import { Scratchpad } from './components/Scratchpad';

const CURRENT_DAY = 11; // August 11, 2026

export default function App() {
  const [isDark, setIsDark] = useState(false); // DARK MODE STATE

  return (
    // The master wrapper applies the invert and hue-rotate when isDark is true
    <div className={`min-h-screen bg-canvas text-ink font-mono selection:bg-[#0000FF] selection:text-white pb-32 antialiased transition-all duration-300 ${isDark ? 'invert hue-rotate-180' : ''}`}>
      
      {/* ===================================================================
          1. THE VAULT LOGO 
         =================================================================== */}
      <VaultHeader onToggleDark={() => setIsDark(!isDark)} currentDay={CURRENT_DAY} />

      <MainLayout>

        {/* The existing sections are not yet uniform date blocks, so they span
            the full grid width. Future ≤280px date blocks will drop in as
            direct grid children and auto-fill into the jagged layout. */}

        {/* ===================================================================
            2. CALENDAR 
           =================================================================== */}
        <div className="col-span-full">
          <Calendar currentDay={CURRENT_DAY} />
        </div>

        {/* ===================================================================
            3. TASKS 
           =================================================================== */}
        <div className="col-span-full">
          <TaskNest currentDay={CURRENT_DAY} />
        </div>

        {/* ===================================================================
            4. SCRATCHPAD 
           =================================================================== */}
        <div className="col-span-full">
          <Scratchpad currentDay={CURRENT_DAY} />
        </div>

      </MainLayout>
    </div>
  );
}
