import { Studio } from './shell/Studio'
import { runSpeckChecks } from './speck/check'

if (import.meta.env.DEV) {
  const fails = runSpeckChecks()
  if (fails.length) console.error('SPECK', fails)
}

export default function App() {
  return <Studio />
}
