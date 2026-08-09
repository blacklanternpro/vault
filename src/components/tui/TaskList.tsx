import { TASK_ITEMS, type TaskStatus } from '../../data/tui';

const STATUS_CLASS: Record<TaskStatus, string> = {
  DONE: 'text-ink/40 line-through',
  IN_PROGRESS: 'text-cobalt',
  PENDING: 'text-ink/60',
  QUEUED: 'text-ink/60',
};

const MARK_CLASS: Record<string, string> = {
  X: 'text-cobalt',
  '~': 'text-cobalt animate-pulse',
  ' ': 'text-ink/25',
};

export function TaskList() {
  return (
    <ul>
      {TASK_ITEMS.map((task) => (
        <li
          key={task.id}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-grid-line py-2.5"
        >
          <span className="flex items-baseline gap-3 text-[11px] sm:text-xs">
            <span className={`font-bold ${MARK_CLASS[task.mark]}`}>
              [{task.mark}]
            </span>
            <span className="text-ink/40">{task.id}</span>
            <span
              className={`uppercase tracking-tight ${
                task.status === 'DONE' ? 'text-ink/40 line-through' : 'text-ink'
              }`}
            >
              {task.label}
            </span>
          </span>

          <span className="flex items-center gap-4 text-[9px] uppercase tracking-tighter text-ink/50 sm:text-[10px]">
            <span>PRIORITY::{task.priority}</span>
            <span className={STATUS_CLASS[task.status]}>
              STATUS::{task.status}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
