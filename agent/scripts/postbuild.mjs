#!/usr/bin/env node
/*
 * Runs after `tsc`. Two jobs:
 *   1. The web app's model is written for a bundler (`import x from './doc'`,
 *      no extension). Node's ESM loader needs `./doc.js`, so every relative
 *      import in the emitted JS gets its extension filled in.
 *   2. tsc emits the CLI at dist/agent/src/cli.js (the emit root is the repo
 *      root, so the model can be compiled in place). dist/cli.js is the entry
 *      people configure, so write a one-line shim there.
 */
import { chmodSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', 'dist')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.js')) out.push(full)
  }
  return out
}

const SPECIFIER = /((?:^|[\s;])(?:import|export)\b[^'"]*?\bfrom\s*|(?:^|[\s;])import\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+)\2/gm

function withExtension(fromFile, spec) {
  if (/\.(m?js|cjs|json|node)$/.test(spec)) return spec
  const base = resolve(dirname(fromFile), spec)
  if (existsSync(base + '.js')) return spec + '.js'
  if (existsSync(join(base, 'index.js'))) return spec.replace(/\/$/, '') + '/index.js'
  return spec
}

let touched = 0
for (const file of walk(dist)) {
  const src = readFileSync(file, 'utf8')
  const out = src.replace(SPECIFIER, (all, lead, quote, spec) => {
    const fixed = withExtension(file, spec)
    return fixed === spec ? all : `${lead}${quote}${fixed}${quote}`
  })
  if (out !== src) {
    writeFileSync(file, out)
    touched += 1
  }
}

const entry = join(dist, 'cli.js')
writeFileSync(entry, "#!/usr/bin/env node\nimport './agent/src/cli.js'\n")
for (const f of [entry, join(dist, 'agent', 'src', 'cli.js')]) {
  try {
    chmodSync(f, 0o755)
  } catch {
    /* Windows has no executable bit; `node dist/cli.js` works regardless. */
  }
}
console.log(`postbuild: fixed imports in ${touched} file(s), wrote ${entry}`)
