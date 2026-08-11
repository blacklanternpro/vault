import { useState, type FormEvent } from 'react';
import { useCrdtState } from '../hooks/useCrdtState';
import type { TaskNode, TaskPriority } from '../lib/vault-types';

interface TaskNestProps {
  dateLabel: string;
}

const PRIORITIES: TaskPriority[] = ['P1', 'P2', 'P3', 'URGENT'];

export function TaskNest({ dateLabel }: TaskNestProps) {
  const { tasks, addTask, toggleTask } = useCrdtState();

  const [rootInput, setRootInput] = useState('');
  const [selectedPrio, setSelectedPrio] = useState<TaskPriority>('P1');
  const [activeParentId, setActiveInputId] = useState<string | null>(null);
  const [childInput, setChildInput] = useState('');

  const handleAddRootTask = (e: FormEvent) => {
    e.preventDefault();
    if (!rootInput.trim()) return;
    addTask({
      id: Date.now().toString(),
      text: rootInput.trim(),
      parentId: null,
      priority: selectedPrio,
    });
    setRootInput('');
  };

  const handleAddChild = (parentId: string) => {
    if (!childInput.trim()) {
      setActiveInputId(null);
      return;
    }
    addTask({
      id: Date.now().toString(),
      text: childInput.trim(),
      parentId,
    });
    setChildInput('');
    setActiveInputId(null);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return 0;
  });

  /**
   * Hybrid Nest:
   * - Depth 0: underlined root
   * - Depth 1: dashed left rail + "-"  (NO backslash)
   * - Depth 2+: "\" on its own line, then dashed rail + "-"
   */
  const renderTree = (
    parentId: string | null,
    nodes: TaskNode[],
    depth = 0,
    isParentCompleted = false,
    isParentUrgent = false,
  ) => {
    if (nodes.length === 0 && activeParentId !== parentId) return null;

    return (
      <div
        className={`flex flex-col w-full ${
          depth > 0
            ? 'border-l-[2px] border-dashed ml-3 md:ml-4 pl-3 md:pl-4'
            : ''
        } ${isParentUrgent ? 'border-urgent/40' : 'border-ink/30'}`}
      >
        {nodes.map((node) => {
          const isRoot = depth === 0;
          const isCompleted = isParentCompleted || !!node.completed;
          const isUrgent = isParentUrgent || node.priority === 'URGENT';
          const colorClass = isUrgent ? 'text-urgent' : 'text-ink';
          const strikeClass = isCompleted
            ? 'line-through decoration-[3px] opacity-40'
            : '';

          return (
            <div key={node.id} className="flex flex-col w-full mt-3">
              <div className="flex items-start group w-full pr-2 md:pr-4">
                {!isRoot && (
                  <span
                    className={`mr-3 font-black text-sm md:text-base select-none mt-0.5 ${colorClass}`}
                  >
                    -
                  </span>
                )}
                <div className="flex-1 flex flex-wrap items-start gap-2 min-w-0">
                  <span
                    onClick={() => {
                      setActiveInputId(node.id);
                      setChildInput('');
                    }}
                    className={`cursor-pointer transition-opacity hover:opacity-60 whitespace-normal break-words ${colorClass} ${strikeClass} ${
                      isRoot
                        ? 'font-black uppercase tracking-tighter text-xl md:text-3xl underline decoration-[4px] underline-offset-4'
                        : 'font-medium text-sm md:text-lg'
                    }`}
                  >
                    {node.text}
                  </span>
                  <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(node.id);
                      }}
                      className="text-urgent font-black text-sm md:text-base hover:bg-urgent hover:text-white px-1 leading-none transition-colors"
                    >
                      [X]
                    </button>
                  </div>
                </div>
              </div>

              {(node.children.length > 0 || activeParentId === node.id) && (
                <div className="flex flex-col w-full mt-1">
                  {/* Backslash ONLY when spawning depth 2+ (parent is already L1+) */}
                  {!isRoot && (
                    <span
                      className={`ml-3 md:ml-4 font-black text-lg md:text-xl leading-none select-none mb-1 opacity-50 ${colorClass}`}
                    >
                      \
                    </span>
                  )}
                  {renderTree(
                    node.id,
                    node.children,
                    depth + 1,
                    isCompleted,
                    isUrgent,
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeParentId === parentId && !isParentCompleted && (
          <div className="flex items-end w-full mt-3 group pr-2 md:pr-4">
            {depth > 0 && (
              <span
                className={`mr-3 font-black text-sm md:text-base select-none mt-1 ${
                  isParentUrgent ? 'text-urgent' : 'text-ink'
                }`}
              >
                -
              </span>
            )}
            <input
              autoFocus
              type="text"
              value={childInput}
              onChange={(e) => setChildInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChild(parentId!);
                if (e.key === 'Escape') setActiveInputId(null);
              }}
              onBlur={() => handleAddChild(parentId!)}
              placeholder="APPEND NODE..."
              className={`flex-1 bg-transparent border-b-[2px] outline-none font-bold pb-0.5 rounded-none text-sm md:text-base min-w-0 uppercase caret-cobalt ${
                isParentUrgent
                  ? 'border-urgent text-urgent placeholder:text-urgent/40'
                  : 'border-cobalt text-cobalt placeholder:text-cobalt/40'
              }`}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="w-full font-mono">
      <h2 className="text-center font-sans font-black text-4xl md:text-5xl uppercase underline decoration-[4px] underline-offset-8 mb-10 md:mb-14">
        TASKS
      </h2>

      <div className="w-full mb-12 relative z-0 bg-canvas max-w-4xl mx-auto">
        <div className="text-cobalt text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mb-5 select-none opacity-80">
          {'*'.repeat(160)}
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-5 gap-4">
          <div className="text-cobalt text-xs md:text-sm font-bold uppercase tracking-widest">
            <span>DATE // {dateLabel}</span>
          </div>

          <div className="flex gap-2 text-[10px] md:text-xs font-bold font-mono">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPrio(p)}
                className={`px-2 py-1 border-[2px] tracking-widest uppercase transition-colors ${
                  selectedPrio === p
                    ? p === 'URGENT'
                      ? 'bg-urgent text-white border-urgent'
                      : 'bg-cobalt text-white border-cobalt'
                    : 'border-cobalt/30 text-cobalt/70 hover:border-cobalt hover:text-cobalt'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleAddRootTask}
          className="w-full flex items-end gap-3 text-sm md:text-base text-cobalt"
        >
          <span className="font-bold vault-caret mb-1">{'>'}</span>
          <input
            type="text"
            value={rootInput}
            onChange={(e) => setRootInput(e.target.value)}
            className="flex-1 bg-transparent border-b-[2px] border-cobalt outline-none text-cobalt placeholder:text-cobalt/40 pb-1 font-black uppercase rounded-none min-w-0 caret-cobalt"
            placeholder="DEFINE ROOT TASK..."
          />
          <button
            type="submit"
            className="font-bold hover:bg-cobalt hover:text-canvas px-2 py-1 transition-colors shrink-0"
          >
            [ENTER]
          </button>
        </form>

        <div className="text-cobalt text-[10px] md:text-xs tracking-[0.2em] overflow-hidden whitespace-nowrap mt-6 select-none opacity-80">
          {'*'.repeat(160)}
        </div>
      </div>

      <div className="w-full flex justify-end">
        <div className="w-full md:w-3/4 flex flex-col items-start min-w-0 overflow-x-hidden pr-2 md:pr-8">
          {renderTree(null, sortedTasks)}
        </div>
      </div>
    </section>
  );
}
