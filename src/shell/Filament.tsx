import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'
import { satellitesOf, type Doc } from '../speck/doc'

type Line = { id: number; x1: number; y1: number; x2: number; y2: number }

type Props = {
  doc: Doc
  projectId: number | null
  hostRef: RefObject<HTMLElement | null>
}

export function Filament({ doc, projectId, hostRef }: Props) {
  const [lines, setLines] = useState<Line[]>([])

  const measure = useCallback(() => {
    const host = hostRef.current
    if (!host) {
      setLines([])
      return
    }
    const box = host.getBoundingClientRect()
    const next: Line[] = []
    for (const sat of satellitesOf(doc, projectId)) {
      if (sat.parent == null) continue
      const from = host.querySelector(`[data-jack="${sat.parent}"]`)
      const to = host.querySelector(`[data-jack="${sat.id}"]`)
      if (!(from instanceof HTMLElement) || !(to instanceof HTMLElement)) continue
      const a = from.getBoundingClientRect()
      const b = to.getBoundingClientRect()
      next.push({
        id: sat.id,
        x1: a.left + a.width / 2 - box.left,
        y1: a.top + a.height / 2 - box.top,
        x2: b.left + b.width / 2 - box.left,
        y2: b.top + b.height / 2 - box.top,
      })
    }
    setLines(next)
  }, [doc, hostRef, projectId])

  useLayoutEffect(() => {
    measure()
    const host = hostRef.current
    if (!host) return
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    host.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      host.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [hostRef, measure])

  if (!lines.length) return null

  return (
    <svg className="filaments" aria-hidden="true">
      {lines.map((line) => (
        <g key={line.id}>
          <line className="filament-glow" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          <line className="filament" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
        </g>
      ))}
    </svg>
  )
}
