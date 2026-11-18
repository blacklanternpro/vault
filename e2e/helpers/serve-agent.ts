/*
 * Runs vault-agent's real HTTP bridge (agent/src/http.ts startBridge, the
 * same code `vault-agent serve` runs) for e2e, in its own process under tsx:
 *
 *   tsx e2e/helpers/serve-agent.ts <file> <port> <token> <origin>...
 *
 * Programmatic rather than through the CLI so the test owns the token: it is
 * passed to startBridge always. A bridge that requires one (G3) checks it; one
 * that does not yet ignores the extra property. Prints `ready <url>` once
 * listening, and closes on SIGTERM/SIGINT.
 */
import { startBridge } from '../../agent/src/http.ts'
import { FileStore } from '../../agent/src/store.ts'

const [file, portArg, token, ...origins] = process.argv.slice(2)
if (!file || !portArg || !token) {
  process.stderr.write('usage: serve-agent <file> <port> <token> <origin>...\n')
  process.exit(2)
}

const store = new FileStore(file)
const options = { store, port: Number(portArg), host: '127.0.0.1', origins, token, log: (line: string) => process.stderr.write(`${line}\n`) }
const bridge = await startBridge(options as Parameters<typeof startBridge>[0])
process.stdout.write(`ready ${bridge.url}\n`)

const stop = () => {
  bridge.close().then(
    () => process.exit(0),
    () => process.exit(1),
  )
}
process.once('SIGTERM', stop)
process.once('SIGINT', stop)
