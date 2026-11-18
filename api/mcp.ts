import { BlobStore } from '../wire/board.js'
import { envKeys } from '../wire/env.js'
import { createWireHandler } from '../wire/mcp.js'

/* The MCP endpoint Claude connects to: https://<host>/api/mcp */

let handler: ((req: Request) => Promise<Response>) | null = null

export default {
  async fetch(req: Request): Promise<Response> {
    handler ??= createWireHandler({ keys: envKeys(), store: new BlobStore() })
    return handler(req)
  },
}
