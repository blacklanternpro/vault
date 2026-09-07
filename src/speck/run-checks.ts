import { runSpeckChecks } from './check'

const fails = runSpeckChecks()
if (fails.length) {
  throw new Error(`SPECK\n${fails.join('\n')}`)
}
