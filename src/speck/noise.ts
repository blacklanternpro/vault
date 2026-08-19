/**
 * Seeded chaos. Every wobble in the slip comes from here.
 * Pure and deterministic: the same node must jitter identically on every frame,
 * or the paper turns into a lava lamp.
 */

export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable signed offset in [-amp, amp] for a seed and a slot index. */
export function jitter(seed: number, slot: number, amp: number): number {
  const r = rng((seed ^ Math.imul(slot + 1, 2654435761)) >>> 0)
  return (r() * 2 - 1) * amp
}
