import { envKeys, envPassphrase } from '../wire/env.js'
import { handleOAuth } from '../wire/oauth.js'

/*
 * The authorization server. vercel.json rewrites /.well-known/oauth-*,
 * /register, /authorize and /token here with ?op=…
 */
export default {
  async fetch(req: Request): Promise<Response> {
    const op = new URL(req.url).searchParams.get('op')
    return handleOAuth(req, op, { keys: envKeys(), passphrase: envPassphrase() })
  },
}
