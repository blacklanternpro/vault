import React, { useState } from 'react';

// --- DATA TYPES ---
interface TaskNode {
  id: string;
  text: string;
  isAi?: boolean;
  priority?: 'P1' | 'P2' | 'P3' | 'URGENT';
  completed?: boolean;
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
  const [rootInput, setRootInput] = useState('');
  const [selectedPrio, setSelectedPrio] = useState<'P1'|'P2'|'P3'|'URGENT'>('P1');
  const [activeParentId, setActiveInputId] = useState<string | null>(null);
  const [childInput, setChildInput] = useState('');

  const [tasks, setTasks] = useState<TaskNode[]>([
    {
      id: '1',
      text: 'SYSTEM_OUTAGE_RESOLUTION',
      priority: 'URGENT',
      children: [
        { id: '1-1', text: 'bypass_crdt_firewall', children: [] },
      ],
    },
    {
      id: '2',
      text: 'PREP_FERAL_PIG_ULTRA_GEAR',
      priority: 'P1',
      children: [
        { id: '2-1', text: 'calculate_carb_and_hydration_ratios', children: [] },
        { id: '2-2', text: 'map_aid_station_drops', children: [] },
      ],
    },
    {
      id: '3',
      text: 'COMMODORE_RIM_FABRICATION',
      priority: 'P2',
      completed: true,
      children: [
        { id: '3-1', text: 'structurally_mount_makita_backing_pad', children: [] },
      ],
    },
  ]);

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

  // --- TASK LOGIC ---
  const handleAddRootTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootInput.trim()) return;
    setTasks([...tasks, { 
      id: Date.now().toString(), 
      text: rootInput, 
      priority: selectedPrio,
      children: [] 
    }]);
    setRootInput('');
  };

  const toggleTaskCompletion = (nodes: TaskNode[], targetId: string): TaskNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) return { ...node, completed: !node.completed };
      if (node.children.length > 0) return { ...node, children: toggleTaskCompletion(node.children, targetId) };
      return node;
    });
  };

  const triggerAiCascade = (parentId: string) => {
    const appendAi = (nodes: TaskNode[]): TaskNode[] => {
      return nodes.map(n => {
        if (n.id === parentId) {
          const aiChildren: TaskNode[] = [
            { id: Date.now() + '_ai1', text: 'analyze_root_parameters', isAi: true, children: [] },
            { id: Date.now() + '_ai2', text: 'deploy_agentic_loop', isAi: true, children: [] }
          ];
          return { ...n, children: [...n.children, ...aiChildren] };
        }
        if (n.children.length > 0) return { ...n, children: appendAi(n.children) };
        return n;
      });
    };
    setTasks(appendAi(tasks));
  };

  const handleAddChild = (parentId: string) => {
    if (!childInput.trim()) {
      setActiveInputId(null);
      return;
    }
    const addChild = (nodes: TaskNode[]): TaskNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...node.children, { id: Date.now().toString(), text: childInput, children: [] }] };
        }
        if (node.children.length > 0) return { ...node, children: addChild(node.children) };
        return node;
      });
    };
    setTasks(addChild(tasks));
    setChildInput('');
    setActiveInputId(null);
  };

  // Sort Tasks: URGENT goes straight to the top
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return 0;
  });

  // --- RECURSIVE HYBRID TASK RENDERER ---
  const renderTree = (nodes: TaskNode[], depth = 0, isParentCompleted = false, isParentUrgent = false) => {
    return (
      <div className="flex flex-col items-start w-full gap-2">
        {nodes.map((node) => {
          const isRoot = depth === 0;
          const isAddingToThis = activeParentId === node.id;
          
          // Inherit traits from parents
          const isCompleted = isParentCompleted || node.completed;
          const isUrgent = isParentUrgent || node.priority === 'URGENT';
          
          // Aesthetic logic
          const colorClass = isUrgent ? 'text-[#FF2B2B]' : 'text-[#111]';
          const strikeClass = isCompleted ? 'line-through decoration-[3px] opacity-40' : '';

          return (
            <div key={node.id} className="flex flex-col items-start w-full">
              
              <div className="flex items-center group w-full relative">
                
                {/* The "20% in" Diagonal Hash Connector */}
                {!isRoot && (
                  <span className="ml-6 md:ml-12 mr-3 text-[#111]/30 font-black text-lg select-none">
                    \
                  </span>
                )}
                
                {/* Task Text */}
                <span 
                  onClick={() => { setActiveInputId(node.id); setChildInput(''); }}
                  className={`cursor-pointer transition-opacity hover:opacity-60 ${colorClass} ${strikeClass} ${
                    isRoot ? 'font-black uppercase tracking-tighter text-xl md:text-3xl underline decoration-[4px] underline-offset-4' : 'font-medium text-base md:text-xl'
                  }`}
                >
                  {node.text}
                </span>

                {/* Badges & Buttons */}
                <div className="flex items-center gap-3 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {node.isAi && (
                    <span className="bg-[#111] text-[#F4F4F0] text-[10px] px-1.5 font-bold uppercase tracking-widest">
                      AI_GEN
                    </span>
                  )}
                  {isRoot && !isCompleted && (
                    <button 
                      onClick={() => triggerAiCascade(node.id)}
                      className="text-[#0000FF] font-black text-xs md:text-sm border border-[#0000FF] px-2 hover:bg-[#0000FF] hover:text-white"
                    >
                      [TXT AI]
                    </button>
                  )}
                  <button 
                    onClick={() => setTasks(toggleTaskCompletion(tasks, node.id))}
                    className="text-[#FF2B2B] font-black text-sm md:text-base px-1 hover:bg-[#FF2B2B] hover:text-white"
                  >
                    [X]
                  </button>
                </div>
              </div>

              {/* Children Container (Dashed Vertical Line) */}
              {(node.children.length > 0 || isAddingToThis) && (
                <div className={`flex flex-col items-start w-full ${isRoot ? 'ml-4' : 'ml-[4.5rem] md:ml-[6rem]'} border-l-2 border-dashed ${isUrgent ? 'border-[#FF2B2B]/40' : 'border-[#111]/30'} mt-2 mb-2 py-1`}>
                  
                  {node.children.length > 0 && renderTree(node.children, depth + 1, isCompleted, isUrgent)}

                  {/* Inline Child Input */}
                  {isAddingToThis && !isCompleted && (
                    <div className="flex items-end mt-2 animate-pulse w-full max-w-md">
                      <span className="ml-6 md:ml-12 mr-3 text-[#0000FF] font-black text-lg select-none">
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
                        placeholder="append child..."
                        className="flex-1 bg-transparent border-b-[2px] border-[#0000FF] text-[#0000FF] outline-none font-bold placeholder:text-[#0000FF]/40 text-base pb-0.5 rounded-none uppercase"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#111] font-mono selection:bg-[#FF2B2B] selection:text-[#F4F4F0] pb-32 antialiased overflow-x-hidden">
      
      {/* ===================================================================
          1. THE VAULT LOGO 
         =================================================================== */}
      <header className="pt-24 pb-12 flex flex-col items-center justify-center">
        <svg width="240" height="120" viewBox="0 0 200 100" fill="none" className="text-[#111]">
          <ellipse cx="100" cy="50" rx="95" ry="48" stroke="currentColor" strokeWidth="2.5" />
          <path d="M5 50 Q100 85 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M5 50 Q100 15 195 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <ellipse cx="100" cy="50" rx="45" ry="48" stroke="currentColor" strokeWidth="1.5" />
          <line x1="100" y1="2" x2="100" y2="98" stroke="currentColor" strokeWidth="2" />
          
          <rect x="40" y="30" width="120" height="40" fill="#F4F4F0" />
          <text x="100" y="58" textAnchor="middle" fill="currentColor" className="font-sans font-black text-4xl tracking-[0.1em] uppercase">VAULT</text>
        </svg>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 space-y-32">
        
        {/* ===================================================================
            2. CALENDAR (JAMMED, GHOSTED PAST, RED DROPDOWN)
           =================================================================== */}
        <section className="relative w-full flex flex-col items-center mt-12">
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <span className="text-[45vw] md:text-[38rem] font-black text-[#00FFCC] tracking-tighter leading-none mix-blend-multiply opacity-60 select-none mt-12">
              AUG
            </span>
          </div>

          <div className="relative z-10 w-full max-w-3xl">
            <div className="grid grid-cols-7 gap-0 w-full leading-none text-center">
              
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dateStr = `08.${day < 10 ? `0${day}` : day}.26`;
                const dayLogs = sysLogs.filter(n => n.date === dateStr);
                const isMarked = dayLogs.length > 0 || markedDays.includes(day);
                const isPast = day < CURRENT_DAY;
                const isToday = day === CURRENT_DAY;
                const isSelected = selectedDay === day;
                
                const dateObj = new Date(2026, 7, day);
                const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const alignRight = (day - 1) % 7 >= 4;

                return (
                  <div 
                    key={day} 
                    className="relative flex items-center justify-center w-full aspect-square hover:bg-black/5 cursor-pointer z-10" 
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  >
                    <span className={`font-sans font-light text-5xl md:text-8xl tracking-tighter transition-colors ${
                      isPast ? 'text-gray-300' : 'text-[#111]'
                    } ${isToday ? 'border-b-[4px] md:border-b-[6px] border-[#111] pb-1 md:pb-2' : ''}`}>
                      {day}
                    </span>
                    
                    <span className={`absolute text-[10px] md:text-[14px] font-black text-[#0000FF] tracking-widest z-10 bg-[#F4F4F0] px-1 py-0.5 leading-none ${
                      isPast ? 'opacity-40' : 'opacity-100'
                    }`}>
                      {dayAbbr}
                    </span>
                    
                    {isPast && (
                      <span className="absolute inset-0 w-[120%] h-[3px] bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none z-0" />
                    )}

                    {isMarked && (
                      <span className="absolute inset-x-0 h-[3px] md:h-[4px] bg-[#FF2B2B] top-1/2 -translate-y-1/2 pointer-events-none z-20" />
                    )}

                    {/* RED INLINE DROPDOWN */}
                    {isSelected && dayLogs.length > 0 && (
                      <div className={`absolute top-full mt-1 bg-[#FF2B2B] text-white p-3 z-50 min-w-[200px] w-max max-w-[300px] text-left shadow-[4px_4px_0px_#111] ${
                        alignRight ? 'right-0' : 'left-0'
                      }`}>
                        <div className="text-[10px] uppercase font-bold tracking-widest border-b border-white/30 pb-1 mb-2">
                          LOGS // {dateStr}
                        </div>
                        <div className="space-y-2">
                          {dayLogs.map((log, idx) => (
                            <div key={idx} className="text-xs md:text-sm leading-tight uppercase font-medium">
                              {log.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* VCR / RECEIPT TERMINAL */}
          {selectedDay !== null && (
            <div className="mt-8 md:mt-12 w-full max-w-3xl mx-auto font-mono relative z-0 bg-[#F4F4F0]">
              <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-6 select-none opacity-80">
                {'*'.repeat(150)}
              </div>
              
              <div className="flex justify-between items-end mb-6 text-[#0000FF] text-xs md:text-sm font-bold uppercase tracking-widest">
                <span>DATE // 08.{selectedDay < 10 ? `0${selectedDay}` : selectedDay}.26</span>
                <span className="opacity-60">TARGET ENGAGED</span>
              </div>

              <form onSubmit={handleAddSysLog} className="flex items-end gap-3 text-[#0000FF] text-xs md:text-sm">
                <span className="font-bold animate-pulse mb-1">{'>'}</span>
                <input
                  type="text"
                  value={dayNoteInput}
                  onChange={(e) => setDayNoteInput(e.target.value)}
                  placeholder="APPEND RECORD TO SELECTED DATE..."
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
            3. TASKS (HYBRID ASCII NEST, URGENT RED, AI BUTTONS)
           =================================================================== */}
        <section className="w-full font-mono">
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-16">
            TASKS
          </h2>

          <div className="w-full flex justify-end mb-16">
            <div className="w-full md:w-3/4 flex flex-col gap-6 md:pr-8">
              
              {/* Terminal Priority Selection */}
              <div className="flex gap-4 text-xs font-bold font-mono">
                {['P1', 'P2', 'P3', 'URGENT'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setSelectedPrio(p as any)} 
                    className={`px-3 py-1 border-[2px] tracking-widest uppercase transition-colors ${
                      selectedPrio === p 
                        ? (p === 'URGENT' ? 'bg-[#FF2B2B] text-white border-[#FF2B2B]' : 'bg-[#111] text-[#F4F4F0] border-[#111]')
                        : 'border-[#111]/30 text-[#111]/50 hover:border-[#111] hover:text-[#111]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Terminal Root Input */}
              <form onSubmit={handleAddRootTask} className="w-full flex items-end gap-3 text-sm md:text-base">
                <span className="text-[#111] font-bold pb-1 animate-pulse">{'>'}</span>
                <input 
                  type="text" 
                  value={rootInput} 
                  onChange={(e) => setRootInput(e.target.value)} 
                  className="flex-1 bg-transparent border-b-[2px] border-[#111] outline-none text-[#111] placeholder:text-[#111]/30 pb-1 font-black uppercase rounded-none" 
                  placeholder="DEFINE ROOT TASK..." 
                />
                <button type="submit" className="text-[#111] font-black px-2 hover:bg-[#111] hover:text-white transition-colors pb-1">
                  [ENTER]
                </button>
              </form>
            </div>
          </div>

          <div className="w-full flex justify-end pr-4 md:pr-8 overflow-visible">
            <div className="w-fit flex flex-col items-start min-w-[50%]">
              {renderTree(sortedTasks)}
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