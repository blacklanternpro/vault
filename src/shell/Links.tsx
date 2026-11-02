import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { linkKind } from '../model/brief'
import { hostOf, isSafeUrl } from '../model/doc'
import type { Link, Node } from '../model/types'
import { Cross, Plus } from './Glyph'
import { KindMark, LinkMark } from './HandoffGlyph'

type LinksProps = {
  node: Node
  /** A URL just pasted elsewhere in the drawer, offered here until it is taken or waved off. */
  offer: string | null
  onOffer: (url: string | null) => void
  onChange: (links: Link[]) => void
}

/** `github.com/x` is a URL someone could not be bothered to prefix. */
function asUrl(raw: string): string {
  const text = raw.trim()
  if (!text) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text
  return /^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(text) ? `https://${text}` : text
}

/**
 * The drawer's LINKS: a chip per link, each marked by what it points at and
 * opening in its own tab; a ledger row that writes a new one as two fields.
 */
export function LinksSection({ node, offer, onOffer, onChange }: LinksProps) {
  const links = node.links ?? []
  const [adding, setAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [bad, setBad] = useState(false)

  function reset() {
    setAdding(false)
    setUrl('')
    setLabel('')
    setBad(false)
  }

  function add(e: FormEvent) {
    e.preventDefault()
    const clean = asUrl(url)
    if (!isSafeUrl(clean)) {
      setBad(true)
      return
    }
    onChange([...links, { label: label.trim(), url: clean }])
    reset()
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      reset()
    }
  }

  return (
    <>
      <h2 className="drawer-label">
        Links
        {links.length ? <span className="drawer-label-count">{links.length}</span> : null}
      </h2>
      <ul className="links" data-testid="links">
        {links.map((l, i) => {
          const kind = linkKind(l.url)
          return (
            <li key={`${l.url}-${i}`} className="link" data-kind={kind}>
              <a className="link-chip" href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}>
                <KindMark kind={kind} className="link-mark" />
                <span className="link-label">{l.label || hostOf(l.url)}</span>
              </a>
              <button
                type="button"
                className="link-remove"
                aria-label={`Remove link ${l.label || hostOf(l.url)}`}
                onClick={() => onChange(links.filter((_, j) => j !== i))}
              >
                <Cross />
              </button>
            </li>
          )
        })}
        {offer ? (
          <li className="link-offer" data-testid="link-offer">
            <LinkMark className="link-mark" />
            <span className="link-offer-text">Pasted {hostOf(offer)}</span>
            <button
              type="button"
              className="link-offer-add"
              onClick={() => {
                onChange([...links, { label: '', url: offer }])
                onOffer(null)
              }}
            >
              Add as link
            </button>
            <button type="button" className="link-remove is-shown" aria-label="Not a link" onClick={() => onOffer(null)}>
              <Cross />
            </button>
          </li>
        ) : null}
        <li className="link is-add">
          {adding ? (
            <form className="link-form" data-testid="link-form" onSubmit={add}>
              <input
                className={`link-input${bad ? ' is-bad' : ''}`}
                type="text"
                inputMode="url"
                autoFocus
                value={url}
                placeholder="https://"
                aria-label="Link URL"
                aria-invalid={bad || undefined}
                data-testid="link-url"
                onChange={(e) => {
                  setUrl(e.target.value)
                  setBad(false)
                }}
                onKeyDown={onKey}
              />
              <input
                className="link-input"
                type="text"
                value={label}
                placeholder="Label (optional)"
                aria-label="Link label"
                data-testid="link-label"
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={onKey}
              />
              <div className="link-form-row">
                <button type="submit" className="link-form-add" data-testid="link-save">
                  Add
                </button>
                <button type="button" className="link-form-cancel" onClick={reset}>
                  Cancel
                </button>
                {bad ? <span className="link-form-bad">Needs an http(s) address</span> : null}
              </div>
            </form>
          ) : (
            <button type="button" className="subtask-add" data-testid={`add-link-${node.id}`} onClick={() => setAdding(true)}>
              <Plus className="subtask-add-glyph" />
              Add link
            </button>
          )}
        </li>
      </ul>
    </>
  )
}
