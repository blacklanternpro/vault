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
  const [sysLogs, setSysLogs] = useState<{id: string, date: string, text: string}[]>([
    { id: 'l1', date: '08.10.26', text: 'CALENDAR DENSITY PUSHED TO MAXIMUM.' },
    { id: 'l2', date: '08.10.26', text: 'ZERO LAYOUT SHIFT ACROSS VIEWPORTS.' }
  ]);

  const CURRENT_DAY = 10; // August 10, 2026

  const getFullDateString = (day: number) => `08.${day < 10 ? `0${day}` : day}.26`;

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

    setSysLogs([...sysLogs, { id: Date.now().toString(), date: getFullDateString(selectedDay), text: dayNoteInput }]);
    setDayNoteInput('');
  };

  const handleDeleteSysLog = (e: React.MouseEvent, logId: string) => {
    e.stopPropagation();
    setSysLogs(sysLogs.filter((log) => log.id !== logId));
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
const renderTree = (parentId: string | null, nodes: TaskNode[], depth = 0, isParentCompleted = false, isParentUrgent = false) => {
  // If no nodes exist and we aren't actively adding to this specific parent, render nothing
  if (nodes.length === 0 && activeParentId !== parentId) return null;

  return (
    <div className={`flex flex-col w-full ${depth > 0 ? 'ml-4 md:ml-8' : ''}`}>
      
      {/* Depth > 1: The standalone Diagonal Hash bridging parent to children */}
      {depth > 1 && (
        <div className={`mb-1 ml-2 text-lg md:text-xl font-black select-none leading-none ${isParentUrgent ? 'text-[#FF2B2B]' : 'text-[#111]'}`}>
          \
        </div>
      )}

      {/* Children Group Container (Vertical Dashed Line) */}
      <div className={`flex flex-col w-full ${depth > 0 ? `border-l-[2px] border-dashed pl-3 md:pl-4 ${isParentUrgent ? 'border-[#FF2B2B]' : 'border-[#111]'}` : ''}`}>
        
        {nodes.map((node) => {
          const isRoot = depth === 0;
          const isCompleted = isParentCompleted || node.completed;
          const isUrgent = isParentUrgent || node.priority === 'URGENT';
          
          const colorClass = isUrgent ? 'text-[#FF2B2B]' : 'text-[#111]';
          const strikeClass = isCompleted ? 'line-through decoration-[3px] opacity-40' : '';

          return (
            <div key={node.id} className="flex flex-col w-full mt-3">
              
              {/* Task Row */}
              <div className="flex items-start group w-full pr-2 md:pr-4">
                
                {/* Inline Dash for Level 1+ Children */}
                {!isRoot && (
                  <span className={`mr-3 font-black text-sm md:text-base select-none mt-0.5 ${colorClass}`}>
                    -
                  </span>
                )}

                {/* Task Text & Badges (Flex-1 and min-w-0 forces wrapping on mobile instead of cutting off) */}
                <div className="flex-1 flex flex-wrap items-start gap-2 min-w-0">
                  <span 
                    onClick={() => { setActiveInputId(node.id); setChildInput(''); }}
                    className={`cursor-pointer transition-opacity hover:opacity-60 whitespace-normal break-words ${colorClass} ${strikeClass} ${
                      isRoot ? 'font-black uppercase tracking-tighter text-xl md:text-3xl underline decoration-[4px] underline-offset-4' : 'font-medium text-sm md:text-lg'
                    }`}
                  >
                    {node.text}
                  </span>

                  {node.isAi && (
                    <span className={`text-[#F4F4F0] text-[10px] px-1.5 font-bold uppercase tracking-widest shrink-0 mt-1 ${isUrgent ? 'bg-[#FF2B2B]' : 'bg-[#111]'}`}>
                      AI
                    </span>
                  )}
                  
                  {/* Hover Actions ([TXT AI] and [X]) */}
                  <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    {isRoot && !isCompleted && (
                      <button onClick={(e) => { e.stopPropagation(); triggerAiCascade(node.id); }} className={`font-black text-[10px] md:text-xs border px-1 transition-colors ${isUrgent ? 'text-[#FF2B2B] border-[#FF2B2B] hover:bg-[#FF2B2B] hover:text-[#F4F4F0]' : 'text-[#0000FF] border-[#0000FF] hover:bg-[#0000FF] hover:text-[#F4F4F0]'}`}>
                        [TXT AI]
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setTasks(toggleTaskCompletion(tasks, node.id)); }} className="text-[#FF2B2B] font-black text-sm md:text-base hover:bg-[#FF2B2B] hover:text-white px-1 leading-none transition-colors">
                      [X]
                    </button>
                  </div>
                </div>
              </div>

              {/* Recursive Children Call */}
              {(node.children.length > 0 || activeParentId === node.id) && 
                renderTree(node.id, node.children, depth + 1, isCompleted, isUrgent)
              }
              
            </div>
          );
        })}

        {/* Inline Input for New Child appending to THIS level */}
        {activeParentId === parentId && !isParentCompleted && (
          <div className="flex items-end w-full mt-3 group pr-2 md:pr-4">
            {depth > 0 && (
              <span className={`mr-3 font-black text-sm md:text-base select-none mt-1 ${isParentUrgent ? 'text-[#FF2B2B]' : 'text-[#111]'}`}>
                -
              </span>
            )}
            <input
              autoFocus
              type="text"
              value={childInput}
              onChange={(e) => setChildInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddChild(parentId!); if (e.key === 'Escape') setActiveInputId(null); }}
              onBlur={() => handleAddChild(parentId!)}
              placeholder="APPEND NODE..."
              className={`flex-1 bg-transparent border-b-[2px] outline-none font-bold pb-0.5 rounded-none uppercase text-sm md:text-base min-w-0 ${
                isParentUrgent ? 'border-[#FF2B2B] text-[#FF2B2B] placeholder:text-[#FF2B2B]/40' : 'border-[#0000FF] text-[#0000FF] placeholder:text-[#0000FF]/40'
              }`}
            />
          </div>
        )}
      </div>
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
            2. CALENDAR (TRUE CRAM BLOCK, INLINE TYPOGRAPHIC LOGS)
           =================================================================== */}
        <section className="relative w-full flex flex-col items-center mt-12 mb-8">
          
          {/* We wrap the watermark and grid in the exact same container so the watermark NEVER shifts */}
          <div className="relative z-10 w-full max-w-4xl flex justify-center">
            
            {/* Locked Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <span className="text-[45vw] md:text-[38rem] font-black text-[#00FFCC] tracking-tighter leading-none mix-blend-multiply opacity-60 select-none">
                AUG
              </span>
            </div>

            <div className="grid grid-cols-7 gap-0 w-full leading-none text-center relative z-10">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dateStr = getFullDateString(day);
                const dayLogs = sysLogs.filter(n => n.date === dateStr);
                const isMarked = dayLogs.length > 0 || markedDays.includes(day);
                const isPast = day < CURRENT_DAY;
                const isToday = day === CURRENT_DAY;
                const isSelected = selectedDay === day;
                
                const dateObj = new Date(2026, 7, day);
                const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

                return (
                  <div 
                    key={day} 
                    className="relative flex items-center justify-center w-full aspect-[4/3] hover:bg-black/5 cursor-pointer z-10" 
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  >
                    
                    {/* The Raw Number */}
                    <span className={`font-sans font-light text-5xl md:text-8xl tracking-tighter transition-colors ${
                      isSelected ? 'text-[#0000FF] font-medium' : isPast ? 'text-gray-300' : 'text-[#111]'
                    } ${isToday ? 'border-b-[4px] md:border-b-[6px] border-[#111] pb-1 md:pb-2' : ''}`}>
                      {day}
                    </span>
                    
                    {/* Day Name Block (White BG, Blue Text) */}
                    <span className={`absolute text-[10px] md:text-[14px] font-black text-[#0000FF] tracking-widest z-10 bg-white px-1 leading-none top-1/2 -translate-y-1/2 ${
                      isPast ? 'opacity-40' : 'opacity-100'
                    }`}>
                      {dayAbbr}
                    </span>
                    
                    {/* Marked Date Red Line (Top Z-Index) */}
                    {isMarked && (
                      <span className="absolute inset-x-0 h-[3px] md:h-[4px] bg-[#FF2B2B] top-1/2 -translate-y-1/2 pointer-events-none z-20" />
                    )}

                    {/* SLEEK, INLINE DIARY ENTRIES (Matching the Day Name Block) */}
                    {isSelected && dayLogs.length > 0 && (
                      <div className="absolute top-[55%] md:top-[60%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-[1px] md:gap-[2px] z-50 w-max pointer-events-auto">
                        {dayLogs.map((log) => (
                          <div key={log.id} className="bg-white text-[#0000FF] px-1 md:px-1.5 py-0.5 text-[10px] md:text-[14px] font-black uppercase tracking-widest flex items-center gap-2 leading-none">
                            <span>{log.text}</span>
                            <button 
                              onClick={(e) => handleDeleteSysLog(e, log.id)} 
                              className="text-[#0000FF] hover:text-[#FF2B2B] transition-colors"
                            >
                              [X]
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMPACT VCR INPUT FIELD (Margins crushed, metadata stripped) */}
          {selectedDay !== null && (
            <div className="mt-4 mb-2 w-full max-w-3xl mx-auto font-mono relative z-0 bg-[#F4F4F0]">
              
              <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-3 select-none opacity-80">
                {'*'.repeat(150)}
              </div>
              
              <div className="flex justify-between items-end mb-3 text-[#0000FF] text-xs md:text-sm font-bold uppercase tracking-widest">
                <span>DATE // {getFullDateString(selectedDay)}</span>
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
                <button type="submit" className="font-bold hover:bg-[#0000FF] hover:text-[#F4F4F0] px-3 py-1 transition-colors tracking-widest">
                  [ENTER]
                </button>
              </form>

              <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mt-4 select-none opacity-80">
                {'*'.repeat(150)}
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================
            3. TASKS (VCR TERMINAL INPUT, HYBRID ASCII NEST, URGENT RED)
           =================================================================== */}
        <section className="w-full font-mono mt-12">
          <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-16">
            TASKS
          </h2>

          {/* VCR Terminal Root Input */}
          <div className="w-full mb-16 relative z-0 bg-[#F4F4F0] max-w-4xl mx-auto">
            <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-6 select-none opacity-80">
              {'*'.repeat(150)}
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
              <div className="text-[#0000FF] text-xs md:text-sm font-bold uppercase tracking-widest">
                <span>DATE // {CURRENT_DAY < 10 ? `0${CURRENT_DAY}` : CURRENT_DAY}.08.26</span>
              </div>
              
              {/* Terminal Priority Selection */}
              <div className="flex gap-2 text-[10px] md:text-xs font-bold font-mono">
                {['P1', 'P2', 'P3', 'URGENT'].map(p => (
                  <button 
                    key={p} onClick={() => setSelectedPrio(p as any)} 
                    className={`px-2 py-1 border-[2px] tracking-widest uppercase transition-colors ${
                      selectedPrio === p ? (p === 'URGENT' ? 'bg-[#FF2B2B] text-white border-[#FF2B2B]' : 'bg-[#0000FF] text-white border-[#0000FF]') : 'border-[#0000FF]/30 text-[#0000FF]/70 hover:border-[#0000FF] hover:text-[#0000FF]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddRootTask} className="w-full flex items-end gap-3 text-sm md:text-base text-[#0000FF]">
              <span className="font-bold animate-pulse mb-1">{'>'}</span>
              <input 
                type="text" 
                value={rootInput} 
                onChange={(e) => setRootInput(e.target.value)} 
                className="flex-1 bg-transparent border-b-[2px] border-[#0000FF] outline-none text-[#0000FF] placeholder:text-[#0000FF]/40 pb-1 font-black uppercase rounded-none min-w-0" 
                placeholder="DEFINE ROOT TASK..." 
              />
              <button type="submit" className="font-bold hover:bg-[#0000FF] hover:text-[#F4F4F0] px-2 py-1 transition-colors shrink-0">
                [ENTER]
              </button>
            </form>

            <div className="text-[#0000FF] text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mt-8 select-none opacity-80">
              {'*'.repeat(150)}
            </div>
          </div>

          {/* The ASCII Nest rendering call */}
          <div className="w-full flex justify-end">
            <div className="w-full md:w-3/4 flex flex-col items-start min-w-[50%] overflow-x-hidden pr-4 md:pr-8">
              {/* Note the new `null` parameter passed into renderTree! */}
              {renderTree(null, sortedTasks)}
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