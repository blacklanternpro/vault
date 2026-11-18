import type { AuthInfo } from '@modelcontextprotocol/server'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { readAccess, SCOPE, type Keys } from './auth.js'
import type { BoardStore } from './board.js'
import { MCP_PATH, originOf, resourceOf } from './oauth.js'
import { INSTRUCTIONS, registerTools } from './server.js'

/*
 * /api/mcp: mcp-handler's Web-standard handler behind withMcpAuth. A request
 * without a valid access token (signature, kind, issuer, audience = this
 * resource, expiry) never reaches the MCP server: it gets a 401 whose
 * WWW-Authenticate points at the protected-resource metadata.
 */

export function createWireHandler(opts: { keys: Keys; store: BoardStore; clock?: () => number }): (req: Request) => Promise<Response> {
  const mcp = createMcpHandler(
    (server) => {
      registerTools(server, opts.store, opts.clock)
    },
    { serverInfo: { name: 'vault-wire-spike', version: '0.0.1' }, instructions: INSTRUCTIONS },
  )

  const verify = async (req: Request, bearer?: string): Promise<AuthInfo | undefined> => {
    if (!bearer) return undefined
    const origin = originOf(req)
    try {
      const claims = await readAccess(opts.keys, bearer, origin, resourceOf(origin))
      return { token: bearer, clientId: claims.cid, scopes: claims.scope.split(' ').filter(Boolean), expiresAt: claims.exp, resource: new URL(resourceOf(origin)) }
    } catch {
      return undefined
    }
  }

  return async (req: Request) => {
    const origin = originOf(req)
    const guarded = withMcpAuth(mcp, verify, {
      required: true,
      requiredScopes: [SCOPE],
      resourceUrl: origin,
      resourceMetadataPath: `/.well-known/oauth-protected-resource${MCP_PATH}`,
    })
    return guarded(req)
  }
}
