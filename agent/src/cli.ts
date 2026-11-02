#!/usr/bin/env node
import { main } from './main.js'

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code
  },
  (e: unknown) => {
    process.stderr.write(`vault-agent: ${(e as Error)?.stack ?? String(e)}\n`)
    process.exitCode = 1
  },
)
