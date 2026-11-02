import { daysUntil } from '../model/doc'
import { dueLabel, dueTone } from './time'

/**
 * The date on a card's meta line. It warms as the day comes: quiet past a week
 * out, ink inside three days, the accent on the day, the flag red once it has
 * gone by. One word or one short date; never a pill with a colour of its own.
 */
export function DueChip({ due, now, className = '' }: { due: string; now: Date; className?: string }) {
  const days = daysUntil(due, now)
  const tone = dueTone(days)
  return (
    <span className={`due-chip is-${tone}${className ? ` ${className}` : ''}`} data-testid="due-chip" data-tone={tone} title={`Due ${due}`}>
      {dueLabel(due, now)}
    </span>
  )
}
