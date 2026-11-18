import { readAccess } from '../wire/auth.js'
import { envKeys } from '../wire/env.js'
import { originOf, resourceOf } from '../wire/oauth.js'
import { probeBlob } from '../wire/probe.js'

/* Spike-only: proves Blob conditional writes. Needs the same bearer as /api/mcp. */
export default {
  async fetch(req: Request): Promise<Response> {
    const bearer = /^Bearer (.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]
    const origin = originOf(req)
    try {
      if (!bearer) throw new Error('no token')
      await readAccess(envKeys(), bearer, origin, resourceOf(origin))
    } catch {
      return new Response('{"error":"invalid_token"}', { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    if (req.method !== 'POST') return new Response('POST', { status: 405 })
    const result = await probeBlob(process.env.BLOB_READ_WRITE_TOKEN ?? '')
    return new Response(JSON.stringify(result, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  },
}
