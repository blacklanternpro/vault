/*
 * The report an agent sends back when it stops:
 *
 *   ## Report
 *   - [x] a subtask it finished      → ticked (or added as done when it is new)
 *   - [ ] a subtask it found         → added as an open subtask
 *   Left off: where it stopped       → the task's left-off note
 *
 * Reading is forgiving: the heading is optional (without one the whole text
 * is the report), bullets may be `-`, `*`, `+` or numbered, `[X]` counts as
 * `[x]`, fenced code is skipped, and the last `Left off:` line wins. Anything
 * else is kept as `ignored`, so the caller can say what it did not use.
 */

export type ParsedReport = {
  done: string[]
  todo: string[]
  leftOff?: string
  ignored: string[]
}

const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/
const CHECK = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s*(.*?)\s*$/
const LEFT_OFF = /^\s*(?:[-*+]\s+)?(?:\*\*|__)?\s*left\s*off\s*(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(.*?)\s*$/i
const FENCE = /^\s*(```|~~~)/

/** The slice of lines that is the report: after a "Report" heading up to the next heading, else everything. */
function reportSpan(lines: string[]): [number, number] {
  let fenced = false
  let start = 0
  let found = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (FENCE.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    const h = HEADING.exec(line)
    if (!h) continue
    if (!found) {
      // Exactly "Report" (a colon allowed): "Report back" in a pasted brief is not it.
      if (/^report:?$/i.test(h[1].trim())) {
        found = true
        start = i + 1
      }
    } else return [start, i]
  }
  return [start, lines.length]
}

export function parseReport(text: string): ParsedReport {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: ParsedReport = { done: [], todo: [], ignored: [] }
  const [start, end] = reportSpan(lines)

  let fenced = false
  for (const line of lines.slice(start, end)) {
    if (FENCE.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced || !line.trim()) continue
    const check = CHECK.exec(line)
    if (check) {
      const title = check[2].trim()
      if (!title) continue
      if (check[1] === ' ') out.todo.push(title)
      else out.done.push(title)
      continue
    }
    const left = LEFT_OFF.exec(line)
    if (left) {
      if (left[1]) out.leftOff = left[1]
      continue
    }
    if (HEADING.test(line)) continue
    out.ignored.push(line.trim())
  }
  return out
}
