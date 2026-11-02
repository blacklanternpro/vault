/*
 * Forgiving name matching, for task titles and subtask lines. Agents quote
 * titles back with a typo, a different case, or only the first few words; the
 * matcher takes those and refuses the rest, naming the nearest thing it saw.
 */

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = new Array<number>(b.length + 1)
  let cur = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[b.length]
}

/** Lower is closer. Exact 0; a typo or two 1–2; a prefix either way 3; a contained phrase 4; nothing 9+. */
export type Rank = { tier: number; value: number }

const MIN_PARTIAL = 3

export function rank(query: string, title: string): Rank {
  const q = normalizeText(query)
  const t = normalizeText(title)
  if (!q || !t) return { tier: 9, value: Number.MAX_SAFE_INTEGER }
  if (q === t) return { tier: 0, value: 0 }
  const full = levenshtein(q, t)
  if (full <= 2) return { tier: 1, value: full }
  if (q.length >= MIN_PARTIAL && t.startsWith(q)) return { tier: 2, value: t.length - q.length }
  if (t.length >= MIN_PARTIAL && q.startsWith(t)) return { tier: 2, value: q.length - t.length }
  if (q.length >= MIN_PARTIAL && t.includes(q)) return { tier: 3, value: t.length - q.length }
  return { tier: 9, value: closeness(q, t) }
}

/** How far off a miss is: the whole title, its opening, or any one word — whichever is nearest. */
function closeness(q: string, t: string): number {
  let best = levenshtein(q, t)
  if (t.length > q.length) best = Math.min(best, levenshtein(q, t.slice(0, q.length)) + 1)
  for (const word of t.split(' ')) best = Math.min(best, levenshtein(q, word) + 1)
  return best
}

export function isHit(r: Rank): boolean {
  return r.tier <= 3
}

export type Found<T> = {
  /** The one item the query means, when it means exactly one. */
  hit?: T
  /** Several items it could equally mean. */
  ambiguous?: T[]
  /** The nearest miss, to name in an error. */
  closest?: T
}

/**
 * The item a query refers to. An exact match wins outright (two identical
 * titles are the same thing to a caller, so the first is taken); anything
 * less wins only when a single item is nearest, else the tie is reported.
 */
export function findBest<T>(query: string, items: readonly T[], titleOf: (item: T) => string): Found<T> {
  let best: { item: T; rank: Rank }[] = []
  let closest: { item: T; rank: Rank } | undefined
  for (const item of items) {
    const r = rank(query, titleOf(item))
    if (!closest || r.tier < closest.rank.tier || (r.tier === closest.rank.tier && r.value < closest.rank.value)) closest = { item, rank: r }
    if (!isHit(r)) continue
    if (!best.length || r.tier < best[0].rank.tier) best = [{ item, rank: r }]
    else if (r.tier === best[0].rank.tier) {
      if (r.value < best[0].rank.value) best = [{ item, rank: r }]
      else if (r.value === best[0].rank.value) best.push({ item, rank: r })
    }
  }
  if (!best.length) return closest ? { closest: closest.item } : {}
  if (best.length === 1 || best[0].rank.tier === 0) return { hit: best[0].item }
  return { ambiguous: best.map((b) => b.item) }
}
