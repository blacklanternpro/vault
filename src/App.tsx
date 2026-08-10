import React, { useState } from 'react';

// --- DATA TYPES ---
interface TaskNode {
  id: string;
  text: string;
  isAi?: boolean;
  children?: TaskNode[];
}

interface NoteEntry {
  id: string;
  date: string;
  text: string;
  attachment?: string;
}

export default function App() {
  const [selectedDay, setSelectedDay] = useState<number | null>(10); // Default to today: Aug 10
  const [markedDays, setMarkedDays] = useState<number[]>([2, 9, 14, 28]);
  const [dayNoteInput, setDayNoteInput] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [scratchInput, setScratchInput] = useState('');

  const CURRENT_DAY = 10; // August 10, 2026

  // The ASCII Task Tree from Hell (Proper Nested Filth)
  const [tasks] = useState<TaskNode[]>([
    {
      id: '1',
      text: 'root@tui_os:~/operations',
      children: [
        {
          id: '1-1',
          text: 'sys/offline_engine',
          children: [
            { id: '1-1-1', text: 'splice_raw_90s_breaks_for_mixtape' },
            { id: '1-1-2', text: 'idb_persistence_layer' },
            { 
              id: '1-1-3', 
              text: 'crdt_sync_resolver', 
              children: [
                { id: 'a1', text: 'benchmark_yjs_vectors' },
                { id: 'a2', text: 'build_dead_letter_queue', isAi: true },
                { id: 'a3', text: 'inject_auto_retry_logic', isAi: true },
                { 
                  id: 'a4', 
                  text: 'ai_branch_expansion',
                  isAi: true,
                  children: [
                    { id: 'a4-1', text: 'parse_token_stream', isAi: true },
                    { id: 'a4-2', text: 'render_inline_stems', isAi: true }
                  ]
                }
              ]
            },
          ]
        },
        {
          id: '1-2',
          text: 'physical/prep',
          children: [
            { id: '1-2-1', text: 'finalize_fuel_strategy_for_50_miler' },
            { id: '1-2-2', text: 'diagnose_ficus_tree_soil_ph' },
          ]
        }
      ],
    },
  ]);

  // Raw Scratchpad Notes
  const [notes, setNotes] = useState<NoteEntry[]>([
    { id: 'n1', date: '08.09.26', text: 'Lucky bamboo cuttings rooted successfully. Transfer to hydro.' },
    { id: 'n2', date: '08.02.26', text: 'Supabase instance threw a CORS error on the minimalist blog build.', attachment: 'http://tui.loc/img_773.jpg' },
  ]);

  // Terminal-style date logger
  const [sysLogs, setSysLogs] = useState<{date: string, text: string}[]>([
    { date: '08.10.26', text: 'System initialized. Awaiting manual override.' }
  ]);

  const handleAddScratch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchInput.trim()) return;
    setNotes([{ id: Date.now().toString(), date: '08.10.26', text: scratchInput }, ...notes]);
    setScratchInput('');
  };

  const handleAddSysLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayNoteInput.trim() || selectedDay === null) return;
    if (!markedDays.includes(selectedDay)) setMarkedDays([...markedDays, selectedDay]);
    
    const dateStr = `08.${selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26`;
    setSysLogs([...sysLogs, { date: dateStr, text: dayNoteInput }]);
    setDayNoteInput('');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#111] font-mono selection:bg-[#FF2B2B] selection:text-[#F4F4F0] pb-32 antialiased overflow-x-hidden">
      
      {/* ===================================================================
          1. THE VAULT LOGO 
         =================================================================== */}
      <header className="pt-16 pb-8 flex flex-col items-center justify-center">
        <svg width="220" height="120" viewBox="0 0 200 100" fill="none" className="text-[#111] group">
          <ellipse cx="100" cy="50" rx="95" ry="48" stroke="currentColor" strokeWidth="2.5" />
          <path d="M5 50 Q100 95 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M5 50 Q100 5 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <ellipse cx="100" cy="50" rx="45" ry="48" stroke="currentColor" strokeWidth="1.5" />
          <line x1="100" y1="2" x2="100" y2="98" stroke="currentColor" strokeWidth="2" />
          
          <rect x="55" y="36" width="90" height="28" fill="#F4F4F0" />
          <text x="100" y="56" textAnchor="middle" fill="currentColor" className="font-sans font-black text-2xl tracking-[0.2em] uppercase">VAULT</text>
          
          <circle cx="100" cy="50" r="3" fill="#FF2B2B" className="animate-pulse" />
        </svg>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 space-y-32 mt-12">
        
        {/* ===================================================================
            2. CALENDAR (RAW, JAMMED, ACID WATERMARK)
           =================================================================== */}
        <section className="relative">
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-12">
            August
          </h2>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden mt-16">
            <span className="text-[40vw] md:text-[32rem] font-black text-[#00FFCC] tracking-tighter leading-none mix-blend-multiply opacity-60 select-none">
              AUG
            </span>
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap justify-center gap-0 w-full max-w-3xl mx-auto leading-none">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isMarked = markedDays.includes(day);
                const isPast = day < CURRENT_DAY;
                const isToday = day === CURRENT_DAY;
                
                // Calculate actual weekday for Aug 2026
                const dateObj = new Date(2026, 7, day);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

                return (
                  <div key={day} className="relative flex items-center justify-center w-14 h-20 md:w-20 md:h-24 hover:bg-black/5 cursor-pointer" onClick={() => setSelectedDay(selectedDay === day ? null : day)}>
                    
                    {/* The Near-Black Date Number */}
                    <span className={`font-sans font-black text-4xl md:text-6xl text-[#111] opacity-90 tracking-tighter ${isToday ? 'border-b-[4px] border-[#111] pb-1' : ''}`}>
                      {day < 10 ? `0${day}` : day}
                    </span>
                    
                    {/* Lowercase full day name piercing the middle */}
                    <span className="absolute text-[8px] md:text-[11px] font-bold text-[#111] tracking-widest bg-[#F4F4F0]/80 px-1">
                      {dayName}
                    </span>
                    
                    {/* Past Date: White-out diagonal mark */}
                    {isPast && (
                      <span className="absolute inset-0 w-[120%] h-[3px] bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none shadow-[0px_1px_2px_rgba(0,0,0,0.1)]" />
                    )}

                    {/* Marked Date: Straight Red Line right through the middle */}
                    {isMarked && (
                      <span className="absolute inset-x-0 h-[3px] bg-[#FF2B2B] top-1/2 -translate-y-1/2 pointer-events-none z-20" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Amber Wavy Terminal Input */}
          {selectedDay !== null && (
            <div className="mt-12 bg-[#111] text-[#FFB000] p-6 mx-auto max-w-2xl font-mono text-sm shadow-[0px_0px_20px_rgba(255,176,0,0.1)]">
              {/* Cooked ASCII Wavy Border Top */}
              <div className="overflow-hidden whitespace-nowrap opacity-50 mb-4 select-none">
                {'~'.repeat(150)}
              </div>
              
              <div className="font-bold mb-4 uppercase tracking-widest opacity-80">
                SYS_LOG :: 08.{selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26
              </div>
              
              <div className="space-y-2 mb-6 min-h-[60px]">
                {sysLogs
                  .filter(n => n.date === `08.${selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26`)
                  .map((log, i) => (
                    <div key={i} className="leading-tight break-words">
                      <span className="opacity-50 mr-2">{'>'}</span>{log.text}
                    </div>
                  ))}
              </div>

              <form onSubmit={handleAddSysLog} className="flex items-end gap-3 mt-4">
                <span className="font-bold opacity-80 pb-0.5">$</span>
                <input
                  type="text"
                  value={dayNoteInput}
                  onChange={(e) => setDayNoteInput(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent border-b border-[#FFB000]/30 outline-none text-[#FFB000] placeholder:text-[#FFB000]/30 pb-1 rounded-none font-medium focus:border-[#FFB000]"
                />
              </form>

              {/* Cooked ASCII Wavy Border Bottom */}
              <div className="overflow-hidden whitespace-nowrap opacity-50 mt-6 select-none">
                {'~'.repeat(150)}
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================
            3. TASKS (MASSIVE TREE, UNDERLINED ROOTS)
           =================================================================== */}
        <section>
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-12">
            Tasks
          </h2>
          
          {/* Stripped Down Input */}
          <div className="max-w-xl mx-auto flex items-end gap-3 text-xs md:text-sm font-mono mb-12">
            <span className="text-[#111] font-bold opacity-50 pb-1">08.10.26 //</span>
            <input 
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="add root task..."
              className="flex-1 bg-transparent border-b-2 border-[#111] outline-none text-[#111] placeholder:text-[#111]/30 pb-1 font-bold"
            />
          </div>

          {/* Proper Nested Filth (Bigger Text, No Container) */}
          <div className="text-sm md:text-lg font-mono leading-relaxed overflow-x-auto whitespace-nowrap px-2">
            <RenderTree nodes={tasks} />
          </div>
        </section>

        {/* ===================================================================
            4. SCRATCHPAD (RAW LIST, FILE INPUT, TINY URLS)
           =================================================================== */}
        <section>
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-12">
            Scratchpad
          </h2>

          <form onSubmit={handleAddScratch} className="max-w-2xl mx-auto mb-10">
            <textarea 
              value={scratchInput}
              onChange={(e) => setScratchInput(e.target.value)}
              placeholder="paste raw text, links, or braindumps..."
              className="w-full bg-transparent border-2 border-[#111] p-3 text-sm md:text-base font-mono outline-none focus:bg-white resize-y min-h-[100px]"
            />
            <div className="flex justify-between items-center mt-2">
              <button type="button" className="text-xs font-bold underline hover:text-[#0000FF]">+ ATTACH MEDIA</button>
              <button type="submit" className="bg-[#111] text-[#F4F4F0] px-6 py-2 text-sm font-bold hover:bg-[#0000FF] transition-colors">APPEND</button>
            </div>
          </form>

          <div className="max-w-2xl mx-auto space-y-6">
            {notes.map((note) => (
              <div key={note.id} className="flex flex-col gap-1 text-sm md:text-base font-mono py-2 hover:bg-black/5 px-2 -mx-2 transition-colors">
                <div className="text-[#111] font-bold">{note.date}</div>
                <div className="text-[#111] leading-snug whitespace-pre-wrap">{note.text}</div>
                {note.attachment && (
                  <a href={note.attachment} className="text-[#0000FF] underline hover:bg-[#0000FF] hover:text-white inline-block w-max mt-1 text-xs">
                    [ATTACHMENT] -{">"} {note.attachment}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

// Helper Recursive Component for Clean ASCII Task Rendering
function RenderTree({ nodes, prefix = '' }: { nodes: TaskNode[]; prefix?: string }) {
  return (
    <>
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        const currentConnector = isLast ? '└── ' : '├── ';
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        const isRoot = prefix === ''; // Check if it's a top-level item

        return (
          <div key={node.id}>
            <div className="flex items-center gap-3 py-1 hover:bg-[#111]/5 group cursor-pointer transition-colors">
              <span className="text-[#111]/30 select-none font-normal">{prefix}{currentConnector}</span>
              
              {node.isAi && (
                <span className="bg-[#0000FF] text-[#F4F4F0] text-[10px] md:text-xs px-1.5 font-bold uppercase tracking-widest">
                  AI
                </span>
              )}

              <span className={`text-[#111] font-bold ${isRoot ? 'underline decoration-2 underline-offset-4' : ''}`}>
                {node.text}
              </span>

              {/* Functional 'X' cross-off button */}
              <button className="ml-auto opacity-0 group-hover:opacity-100 text-[#FF2B2B] text-sm md:text-base font-black px-2 hover:bg-[#FF2B2B] hover:text-[#F4F4F0] transition-colors">
                [X]
              </button>
            </div>

            {node.children && node.children.length > 0 && (
              <RenderTree nodes={node.children} prefix={childPrefix} />
            )}
          </div>
        );
      })}
    </>
  );
}