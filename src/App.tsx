import React, { useState } from 'react';

// --- DATA TYPES ---
interface TaskNode {
  id: string;
  text: string;
  isAi?: boolean;
  children: TaskNode[];
}

interface NoteEntry {
  id: string;
  date: string;
  text: string;
  attachment?: string;
}

export default function App() {
  // --- CALENDAR & LOGGER STATE ---
  const [selectedDay, setSelectedDay] = useState<number | null>(10);
  const [markedDays, setMarkedDays] = useState<number[]>([2, 9, 14, 28]);
  const [dayNoteInput, setDayNoteInput] = useState('');
  const [sysLogs, setSysLogs] = useState<{date: string, text: string}[]>([
    { date: '08.10.26', text: 'CALENDAR DENSITY PUSHED TO MAXIMUM.' },
    { date: '08.10.26', text: 'ZERO LAYOUT SHIFT ACROSS VIEWPORTS.' }
  ]);

  const CURRENT_DAY = 10; // August 10, 2026

  // --- SCRATCHPAD STATE ---
  const [scratchInput, setScratchInput] = useState('');
  const [notes, setNotes] = useState<NoteEntry[]>([
    { id: 'n1', date: '08.10.26', text: 'Wildcat Resources (WC8) drill results dropping. Keep an eye on pre-open.' },
    { id: 'n2', date: '08.09.26', text: 'Lucky bamboo cuttings rooted successfully. Need to structural wall-mount the new planter array.', attachment: 'http://vlt.link/img_773.jpg' },
  ]);

  // --- TASK ENGINE STATE ---
  const [tasks, setTasks] = useState<TaskNode[]>([
    {
      id: '1',
      text: 'PREP_FERAL_PIG_ULTRA_GEAR',
      children: [
        { id: '1-1', text: 'calculate_carb_and_hydration_ratios', children: [] },
        { id: '1-2', text: 'map_aid_station_drops', children: [] },
      ],
    },
    {
      id: '2',
      text: 'COMMODORE_RIM_FABRICATION',
      children: [
        { id: '2-1', text: 'structurally_mount_makita_backing_pad', children: [] },
      ],
    },
  ]);
  
  const [rootInput, setRootInput] = useState('');
  const [activeParentId, setActiveInputId] = useState<string | null>(null);
  const [childInput, setChildInput] = useState('');

  // --- HANDLERS ---
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

  // Task Handlers
  const handleAddRoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootInput.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: rootInput, children: [] }]);
    setRootInput('');
  };

  const addChildToTree = (nodes: TaskNode[], parentId: string, newText: string): TaskNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...node.children, { id: Date.now().toString(), text: newText, children: [] }]
        };
      }
      if (node.children.length > 0) {
        return { ...node, children: addChildToTree(node.children, parentId, newText) };
      }
      return node;
    });
  };

  const handleAddChild = (parentId: string) => {
    if (!childInput.trim()) {
      setActiveInputId(null);
      return;
    }
    setTasks(addChildToTree(tasks, parentId, childInput));
    setChildInput('');
    setActiveInputId(null);
  };

  // --- RECURSIVE TASK RENDERER ---
  const renderTree = (nodes: TaskNode[], depth = 0) => {
    return (
      <div className="flex flex-col items-start w-full">
        {nodes.map((node) => {
          const isRoot = depth === 0;
          const isAddingToThis = activeParentId === node.id;

          return (
            <div key={node.id} className="flex flex-col items-start w-full mt-1">
              
              <div 
                className="flex items-start group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInputId(node.id);
                  setChildInput('');
                }}
              >
                {!isRoot && (
                  <span className="text-[#111]/30 font-black text-lg md:text-xl mr-3 leading-none select-none">
                    \
                  </span>
                )}
                <span className={`text-[#111] leading-tight transition-colors hover:text-[#0000FF] ${
                  isRoot 
                    ? 'font-black uppercase tracking-tighter text-xl md:text-3xl underline decoration-[3px] underline-offset-4' 
                    : 'font-medium text-base md:text-xl'
                }`}>
                  {node.text}
                </span>
              </div>

              <div className="ml-6 md:ml-10 flex flex-col items-start">
                {node.children.length > 0 && renderTree(node.children, depth + 1)}

                {isAddingToThis && (
                  <div className="flex items-end mt-1 animate-pulse">
                    <span className="text-[#0000FF] font-black text-lg md:text-xl mr-3 leading-none select-none">
                      \
                    </span>
                    <input
                      autoFocus
                      type="text"
                      value={childInput}
                      onChange={(e) => setChildInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddChild(node.id);
                        if (e.key === 'Escape') setActiveInputId(null);
                      }}
                      onBlur={() => handleAddChild(node.id)}
                      placeholder="extend branch..."
                      className="bg-transparent border-b-[2px] border-[#0000FF] text-[#0000FF] outline-none font-bold placeholder:text-[#0000FF]/40 text-base md:text-lg pb-0.5 rounded-none"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#111] font-mono selection:bg-[#0000FF] selection:text-[#F4F4F0] pb-32 antialiased overflow-x-hidden">
      
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
            2. CALENDAR (RAW, JAMMED, ACID WATERMARK) & VCR LOGGER
           =================================================================== */}
        <section className="relative w-full flex flex-col items-center mt-12 mb-20">
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-12">
            August
          </h2>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden mt-16">
            <span className="text-[40vw] md:text-[32rem] font-black text-[#00FFCC] tracking-tighter leading-none mix-blend-multiply opacity-60 select-none">
              AUG
            </span>
          </div>

          <div className="relative z-10 w-full max-w-3xl">
            <div className="grid grid-cols-7 gap-0 w-full leading-none text-center">
              <div className="py-2 md:py-4"></div>
              <div className="py-2 md:py-4"></div>
              <div className="py-2 md:py-4"></div>
              <div className="py-2 md:py-4"></div>
              <div className="py-2 md:py-4"></div>
              
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isMarked = markedDays.includes(day);
                const isPast = day < CURRENT_DAY;
                const isToday = day === CURRENT_DAY;
                
                const dateObj = new Date(2026, 7, day);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

                return (
                  <div key={day} className="relative flex items-center justify-center w-full aspect-square hover:bg-black/5 cursor-pointer" onClick={() => setSelectedDay(selectedDay === day ? null : day)}>
                    <span className={`font-sans font-light text-5xl md:text-8xl tracking-tighter transition-colors ${isPast ? 'text-gray-300' : 'text-[#111]'} ${isToday ? 'border-b-[4px] md:border-b-[6px] border-[#111] pb-1 md:pb-2' : ''}`}>
                      {day < 10 ? `0${day}` : day}
                    </span>
                    
                    <span className={`absolute text-[10px] md:text-[14px] font-black text-[#0000FF] tracking-widest z-10 mix-blend-hard-light ${isPast ? 'opacity-40' : 'opacity-100'}`}>
                      {dayName}
                    </span>
                    
                    {isMarked && (
                      <span className="absolute inset-x-0 h-[3px] md:h-[4px] bg-[#FF2B2B] top-1/2 -translate-y-1/2 pointer-events-none z-20 mix-blend-multiply" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* VCR / RECEIPT TERMINAL */}
          {selectedDay !== null && (
            <div className="mt-8 md:mt-16 w-full max-w-3xl mx-auto font-mono relative z-10 bg-[#F4F4F0]">
              <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-6 select-none opacity-80">
                {'*'.repeat(150)}
              </div>
              
              <div className="flex justify-between items-end mb-8 text-[#0000FF] text-xs md:text-sm font-bold uppercase tracking-widest">
                <span>DATE // 08.{selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26</span>
                <span className="opacity-60">RECORDS: {sysLogs.filter(n => n.date === `08.${selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26`).length}</span>
              </div>

              <div className="space-y-3 mb-10 min-h-[40px]">
                {sysLogs
                  .filter(n => n.date === `08.${selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26`)
                  .map((log, i) => (
                    <div key={i} className="flex gap-4 items-start text-xs md:text-sm text-[#111]">
                      <span className="text-[#0000FF] shrink-0 font-bold">[{i + 1 < 10 ? `0${i+1}` : i+1}]</span>
                      <span className="uppercase leading-snug">{log.text}</span>
                    </div>
                  ))}
                
                {sysLogs.filter(n => n.date === `08.${selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26`).length === 0 && (
                  <div className="text-xs md:text-sm text-[#111]/30 uppercase tracking-widest">
                    NO_DATA_FOUND_FOR_CURRENT_CYCLE
                  </div>
                )}
              </div>

              <form onSubmit={handleAddSysLog} className="flex items-end gap-3 text-[#0000FF] text-xs md:text-sm">
                <span className="font-bold animate-pulse mb-1">{'>'}</span>
                <input
                  type="text"
                  value={dayNoteInput}
                  onChange={(e) => setDayNoteInput(e.target.value)}
                  placeholder="APPEND RECORD..."
                  className="flex-1 bg-transparent border-b-[2px] border-[#0000FF] outline-none text-[#0000FF] placeholder:text-[#0000FF]/40 pb-1 rounded-none uppercase font-bold"
                />
                <button type="submit" className="font-bold hover:bg-[#0000FF] hover:text-[#F4F4F0] px-3 py-1 transition-colors tracking-widest">[ENTER]</button>
              </form>

              <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mt-8 select-none opacity-80">
                {'*'.repeat(150)}
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================
            3. TASKS (FLUID DIAGONAL NESTING)
           =================================================================== */}
        <section className="w-full font-mono">
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-16">
            TASKS
          </h2>

          <div className="w-full flex justify-end mb-12">
            <form onSubmit={handleAddRoot} className="w-full md:w-3/4 flex items-end gap-3 text-sm md:text-base pr-4 md:pr-8">
              <span className="text-[#111] font-bold opacity-50 pb-1">08.10.26 //</span>
              <input 
                type="text" 
                value={rootInput} 
                onChange={(e) => setRootInput(e.target.value)} 
                className="flex-1 bg-transparent border-b-[2px] border-[#111] outline-none text-[#111] placeholder:text-[#111]/30 pb-1 font-bold uppercase rounded-none" 
                placeholder="ADD ROOT TASK..." 
              />
            </form>
          </div>

          <div className="w-full flex justify-end pr-4 md:pr-8 overflow-visible">
            <div className="w-fit flex flex-col items-start min-w-[50%]">
              {renderTree(tasks)}
            </div>
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