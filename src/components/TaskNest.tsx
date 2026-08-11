import { useCrdtState } from '../hooks/useCrdtState'
import type { TaskNode, TaskPriority } from '../lib/vault-types'

type TaskNestProps = {
  activeParentId: string | null
  onSelectParent: (id: string | null) => void
}

function ink(priority: TaskPriority | undefined, active: boolean): string {
  if (active) return 'text-canvas'
  if (priority === 'URGENT') return 'text-urgent'
  return 'text-ink'
}

function NestNode({
  node,
  depth,
  isLast,
  prefix,
  activeParentId,
  onSelectParent,
  onToggle,
}: {
  node: TaskNode
  depth: number
  isLast: boolean
  prefix: string
  activeParentId: string | null
  onSelectParent: (id: string | null) => void
  onToggle: (id: string) => void
}) {
  const isActive = activeParentId === node.id
  const done = Boolean(node.completed)
  const branch = depth === 0 ? '' : isLast ? '└── ' : '├── '
  const childPrefix = depth === 0 ? '' : `${prefix}${isLast ? '    ' : '│   '}`

  return (
    <div className="min-w-0">
      <div
        className={`flex min-w-0 items-start gap-1 leading-[1.15] ${
          isActive ? 'bg-cobalt text-canvas' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectParent(isActive ? null : node.id)}
          className={`min-w-0 flex-1 whitespace-normal break-words text-left font-mono text-[11px] sm:text-[12px] ${ink(
            node.priority,
            isActive,
          )} ${done ? 'line-through opacity-50' : ''} ${
            depth === 0 ? 'font-bold uppercase tracking-[0.04em]' : ''
          }`}
        >
          <span className={isActive ? 'text-canvas/55' : 'text-ink/35'}>
            {prefix}
            {branch}
          </span>
          {node.text}
        </button>
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] ${
            isActive
              ? 'text-canvas/75 hover:text-canvas'
              : 'text-ink/35 hover:text-urgent'
          }`}
          aria-label={done ? 'Restore task' : 'Strike task'}
        >
          [X]
        </button>
      </div>

      {node.children.map((child, index) => (
        <NestNode
          key={child.id}
          node={child}
          depth={depth + 1}
          isLast={index === node.children.length - 1}
          prefix={childPrefix}
          activeParentId={activeParentId}
          onSelectParent={onSelectParent}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

export function NestPriorityRow({
  value,
  onChange,
}: {
  value: TaskPriority
  onChange: (p: TaskPriority) => void
}) {
  const options: TaskPriority[] = ['P2', 'URGENT']
  return (
    <div className="flex items-center gap-1">
      {options.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`px-1 font-mono text-[9px] font-bold tracking-widest uppercase ${
            value === p
              ? p === 'URGENT'
                ? 'bg-urgent text-canvas'
                : 'bg-cobalt text-canvas'
              : p === 'URGENT'
                ? 'text-urgent'
                : 'text-cobalt'
          }`}
        >
          {p === 'URGENT' ? '!' : '·'}
          {p}
        </button>
      ))}
    </div>
  )
}

export function TaskNest({ activeParentId, onSelectParent }: TaskNestProps) {
  const { tasks, toggleTask } = useCrdtState()

  return (
    <div className="min-w-0 space-y-0 font-mono">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-ink/40">
        tree://vault
      </div>
      {tasks.length === 0 ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/35">
          empty/
        </p>
      ) : (
        tasks.map((task, index) => (
          <NestNode
            key={task.id}
            node={task}
            depth={0}
            isLast={index === tasks.length - 1}
            prefix=""
            activeParentId={activeParentId}
            onSelectParent={onSelectParent}
            onToggle={toggleTask}
          />
        ))
      )}
    </div>
  )
}
