import { projectOf } from '../model/doc'
import type { Doc, Node } from '../model/types'
import { DueChip } from './DueChip'
import { Cross } from './Glyph'
import { Pennant } from './NightGlyph'
import { TONIGHT_MAX } from './trail'

type TonightProps = {
  doc: Doc
  /** The cards on the shelf, in document order. At most TONIGHT_MAX. */
  cards: Node[]
  now: Date
  openId: number | null
  /** The rest of the board is dimmed behind the shelf. */
  focus: boolean
  /** A card is in the air: the shelf shows it can be dropped here. */
  dragging: boolean
  onOpen: (id: number) => void
  onRemove: (id: number) => void
  onToggleFocus: () => void
}

/**
 * The shelf: a strip above the lanes holding the three cards tonight is for.
 * A card gets here by `t`, by the drawer's pennant, or by being dropped on it,
 * and stays a card in its lane — the shelf is a reading of the board, not a
 * sixth lane. While it holds anything, the other cards dim, so the board says
 * what tonight is for without saying anything else.
 */
export function Tonight({ doc, cards, now, openId, focus, dragging, onOpen, onRemove, onToggleFocus }: TonightProps) {
  return (
    <section
      className={`tonight${cards.length ? '' : ' is-empty'}${dragging ? ' is-target' : ''}`}
      data-testid="tonight"
      data-drop="tonight"
      aria-label="Tonight"
    >
      <h2 className="tonight-name">
        <Pennant className="tonight-glyph" />
        Tonight
        <span className="tonight-count" data-testid="tonight-count">
          {cards.length}/{TONIGHT_MAX}
        </span>
      </h2>
      {cards.length ? (
        <ul className="tonight-shelf">
          {cards.map((node) => {
            const project = projectOf(doc, node.id)
            return (
              <li key={node.id} className={`tonight-card${openId === node.id ? ' is-open' : ''}`} data-shelf-id={node.id} data-testid={`tonight-card-${node.id}`}>
                <button type="button" className="tonight-open" title={node.leftOff ? `left off: ${node.leftOff}` : undefined} onClick={() => onOpen(node.id)}>
                  <span className="tonight-title">{node.title.trim() || '_'}</span>
                  {project && project.id !== node.id ? <span className="tonight-folder">{project.title.trim() || '_'}</span> : null}
                  {node.due ? <DueChip due={node.due} now={now} /> : null}
                  {node.leftOff ? <span className="tonight-leftoff">left off: {node.leftOff}</span> : null}
                </button>
                <button
                  type="button"
                  className="tonight-drop"
                  aria-label={`Take ${node.title.trim() || 'task'} off tonight's shelf`}
                  title="Off the shelf (t)"
                  data-testid={`tonight-remove-${node.id}`}
                  onClick={() => onRemove(node.id)}
                >
                  <Cross />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="tonight-empty">_ t on a card, or drop one here</p>
      )}
      {cards.length ? (
        <button type="button" className="tonight-focus" data-testid="tonight-focus" aria-pressed={focus} onClick={onToggleFocus}>
          {focus ? 'show all' : 'focus'}
        </button>
      ) : null}
    </section>
  )
}
