export type DumpProject = {
  kind: 'project'
  title: string
  children: string[]
}

export type DumpTasks = {
  kind: 'tasks'
  titles: string[]
}

export type DumpAmbiguous = {
  kind: 'ambiguous'
  guess: DumpProject | DumpTasks
  raw: string
}

export type DumpParse = DumpProject | DumpTasks | DumpAmbiguous

const PROJECT_CUE = /(?:^|\b)(?:new\b[\s\w]*\bproject|create\s+project)\b/i

function splitComma(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

function splitKids(clause: string): string[] {
  let s = clause.trim()
  s = s.replace(/^need\s+to\s+/i, '')
  return s
    .split(/\s+and\s+/i)
    .map((x) => x.replace(/^need\s+to\s+/i, '').trim())
    .filter(Boolean)
}

export function parseDump(line: string): DumpParse {
  const raw = line.trim()
  if (!raw) return { kind: 'tasks', titles: [] }
  const clauses = splitComma(raw)
  const cueAt = clauses.findIndex((c) => PROJECT_CUE.test(c))
  if (cueAt >= 0) {
    const after = clauses.slice(cueAt + 1).map((c) => c.trim()).filter(Boolean)
    const title = after[0] ?? ''
    const children = after.slice(1).flatMap(splitKids)
    if (!title) {
      return {
        kind: 'ambiguous',
        guess: { kind: 'project', title: 'untitled', children },
        raw,
      }
    }
    return { kind: 'project', title, children }
  }
  return { kind: 'tasks', titles: clauses.flatMap(splitKids) }
}

export function formatDumpGuess(parse: DumpParse): string {
  const g = parse.kind === 'ambiguous' ? parse.guess : parse
  if (g.kind === 'project') {
    const kids = g.children.map((c) => `· ${c}`).join(' ')
    return `? ${g.title}${kids ? ` ${kids}` : ''}`
  }
  return `? ${g.titles.join(' · ')}`
}
