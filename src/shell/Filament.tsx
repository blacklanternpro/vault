import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { byId, satellitesOf, type Doc } from '../speck/doc'

export type LiveLeash = {
  id: number
  parentId: number | null
  kind: 'card' | 'nested'
  x: number
  y: number
}

type Cable = { id: number; d: string; taut: boolean }

type Props = {
  doc: Doc
  projectId: number | null
  hostRef: RefObject<HTMLElement | null>
  liveRef: RefObject<LiveLeash | null>
  dragging: boolean
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function cablePath(x1: number, y1: number, x2: number, y2: number, sag: number): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1
  const nx = -dy / dist
  const ny = dx / dist
  const down = ny >= 0 ? 1 : -1
  const cx = mx + nx * sag * 0.15 * down
  const cy = my + sag
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

type Frozen = { id: number; sag: number }

export function Filament({ doc, projectId, hostRef, liveRef, dragging }: Props) {
  const [cables, setCables] = useState<Cable[]>([])
  const lastLive = useRef<Frozen | null>(null)
  const frozen = useRef<Frozen | null>(null)
  const wasDrag = useRef(false)
  const settleT = useRef(1)
  const rafRef = useRef(0)

  const measure = useCallback(() => {
    const host = hostRef.current
    if (!host) {
      setCables([])
      return
    }
    const box = host.getBoundingClientRect()
    const live = liveRef.current

    const jackOf = (id: number): { x: number; y: number } | null => {
      if (live && live.id === id) {
        return { x: live.x - box.left, y: live.y - box.top }
      }
      const el = host.querySelector(`[data-jack="${id}"]`)
      if (!(el instanceof HTMLElement)) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
    }

    const pairs: { id: number; parent: number }[] = satellitesOf(doc, projectId)
      .filter((sat) => sat.parent != null)
      .map((sat) => ({ id: sat.id, parent: sat.parent as number }))

    if (live?.kind === 'nested' && live.parentId != null) {
      const node = byId(doc, live.id)
      if (!node?.loose && !pairs.some((p) => p.id === live.id)) {
        pairs.push({ id: live.id, parent: live.parentId })
      }
    }

    const next: Cable[] = []
    for (const pair of pairs) {
      const from = jackOf(pair.parent)
      const to = jackOf(pair.id)
      if (!from || !to) continue
      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      const restSag = Math.max(8, Math.min(42, dist * 0.18))
      const minSag = Math.max(8, restSag * 0.28)
      const liveOn = Boolean(live && (live.id === pair.id || live.id === pair.parent))
      const tension = liveOn ? clamp((dist - 40) / 280, 0, 1) : 0
      let sag = minSag + (restSag - minSag) * (1 - tension)
      if (liveOn) lastLive.current = { id: pair.id, sag }
      if (!liveOn && frozen.current?.id === pair.id) {
        sag = frozen.current.sag + (restSag - frozen.current.sag) * settleT.current
      }
      next.push({
        id: pair.id,
        d: cablePath(from.x, from.y, to.x, to.y, sag),
        taut: tension > 0.55,
      })
    }
    setCables(next)
  }, [doc, hostRef, liveRef, projectId])

  const measureRef = useRef(measure)
  measureRef.current = measure

  useEffect(() => {
    if (dragging) {
      wasDrag.current = true
      frozen.current = null
      settleT.current = 1
      const loop = () => {
        measureRef.current()
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(rafRef.current)
    }
    if (!wasDrag.current) return
    wasDrag.current = false
    frozen.current = lastLive.current
    settleT.current = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 220)
      settleT.current = 1 - (1 - t) ** 3
      measureRef.current()
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else frozen.current = null
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dragging])

  useLayoutEffect(() => {
    measure()
    const host = hostRef.current
    if (!host) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(host)
    host.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      host.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [hostRef, measure])

  if (!cables.length && !dragging) return null

  return (
    <svg className="filaments" aria-hidden="true">
      {cables.map((cable) => (
        <g key={cable.id}>
          <path className="leash-jacket" d={cable.d} />
          <path className={`leash-core${cable.taut ? ' is-taut' : ''}`} d={cable.d} />
        </g>
      ))}
    </svg>
  )
}
