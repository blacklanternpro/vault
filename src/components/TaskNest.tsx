import { useCrdtState } from '../hooks/useCrdtState'
import type { TaskNode, TaskPriority } from '../lib/vault-types'

type TaskNestProps = {
  activeParentId: string | null
  onSelectParent: (id: string | null) => void
}

function priorityClass(priority: TaskPriority | undefined, active: boolean): string {
  if (active) return 'text-canvas'
  if (priority === 'URGENT') return 'text-urgent'
  return 'text-ink'
}

function NestNode({
  node,
  depth,
  activeParentId,
  onSelectParent,
  onToggle,
}: {
  node: TaskNode
  depth: number
  activeParentId: string | null
  onSelectParent: (id: string | null) => void
  onToggle: (id: string) => void
}) {
  const isRoot = depth === 0
  const isLevel1 = depth === 1
  const isDeep = depth >= 2
  const isActive = activeParentId === node.id
  const done = Boolean(node.completed)

  const textWeight = isRoot ? 'font-bold uppercase tracking-[0.06em]' : 'font-normal'
  const textDecoration = [
    isRoot ? 'underline decoration-2 underline-offset-4' : '',
    done ? 'line-through opacity-55' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="min-w-0">
      {isDeep && (
        <div
          className="select-none pl-1 font-mono text-[12px] leading-none text-ink/45"
          aria-hidden
        >
          \
        </div>
      )}

      <div className={isLevel1 || isDeep ? 'border-l-2 border-dashed border-ink/55 pl-3' : ''}>
        <div
          className={`group flex min-w-0 items-start gap-2 py-1 ${
            isActive ? 'bg-cobalt text-canvas' : ''
          }`}
        >
          {!isRoot && (
            <span
              className={`mt-[2px] shrink-0 font-mono text-[13px] ${
                isActive ? 'text-canvas' : 'text-ink/50'
              }`}
            >
              -
            </span>
          )}
          <button
            type="button"
            onClick={() => onSelectParent(isActive ? null : node.id)}
            className={`min-w-0 flex-1 text-left whitespace-normal break-words text-[13px] leading-snug sm:text-[14px] ${priorityClass(
              node.priority,
              isActive,
            )} ${textWeight} ${textDecoration}`}
          >
            {node.text}
          </button>
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] ${
              isActive
                ? 'text-canvas/80 hover:text-canvas'
                : 'text-ink/40 hover:text-urgent'
            }`}
            aria-label={done ? 'Restore task' : 'Strike task'}
          >
            [X]
          </button>
        </div>

        {node.children.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {node.children.map((child) => (
              <NestNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeParentId={activeParentId}
                onSelectParent={onSelectParent}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
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
  const options: TaskPriority[] = ['P1', 'P2', 'P3', 'URGENT']
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`border border-cobalt px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase ${
            value === p
              ? p === 'URGENT'
                ? 'bg-urgent text-canvas border-urgent'
                : 'bg-cobalt text-canvas'
              : p === 'URGENT'
                ? 'text-urgent hover:bg-urgent hover:text-canvas'
                : 'text-cobalt hover:bg-cobalt hover:text-canvas'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

export function TaskNest({ activeParentId, onSelectParent }: TaskNestProps) {
  const { tasks, toggleTask } = useCrdtState()

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/35">
          EMPTY_NEST
        </p>
      ) : (
        tasks.map((task) => (
          <NestNode
            key={task.id}
            node={task}
            depth={0}
            activeParentId={activeParentId}
            onSelectParent={onSelectParent}
            onToggle={toggleTask}
          />
        ))
      )}
    </div>
  )
}
