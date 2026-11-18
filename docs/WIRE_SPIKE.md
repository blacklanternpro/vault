# The Wire spike (W0)

Phase 1, track W0. A spike, not the Wire: it proves three things the plan left open so Phase 3 (W1–W3) builds on facts. Branch `w0/wire-spike`, never merged. Everything here was run on 18 Nov 2026.

- **Spike URL:** https://vault-wire-spike.vercel.app (Vercel project `vault-wire-spike`, production target, Vercel Authentication off)
- **MCP URL to add in Claude:** `https://vault-wire-spike.vercel.app/api/mcp`
- **Test board:** one private blob, `wire-spike/board.json`, in the `vault-wire-spike` Blob store

## What was proven

| # | Question | Answer |
| --- | --- | --- |
| 1 | Can `mcp-handler` run as a Vercel Function from this Vite repo's root `/api`, no Next.js? | **Yes.** `api/mcp.ts` is `export default { fetch }` around `createMcpHandler(...)`. Vercel detects `/api/*.ts` beside the Vite build with zero config; the SPA still builds and serves at `/`. One real gotcha (extensionless imports, below). |
| 2 | Does a minimal OAuth 2.1 server (PKCE, DCR, metadata) do the round trip a Claude client does? | **Yes, by curl, end to end on the deployed URL** (transcript below): PRM → AS metadata → DCR → `/authorize` page → passphrase → 302 to `claude.ai/api/mcp/auth_callback` with code + state + iss → `/token` (PKCE) → `/api/mcp` with the bearer → refresh. 401 + `WWW-Authenticate: Bearer resource_metadata=…` without a token. **Not yet proven from the Claude app itself: only Jake can press Connect.** |
| 3 | Does "vault it" land a task on a board in Blob? | **Yes, by curl** (`vault_push` → Blob → `vault_status` reads it back, rev counter climbing, pushing twice updates). **From the phone: Jake's to verify** (steps below). |
| + | Does Blob do conditional writes on a private store (Phase 3 depends on it)? | **Yes, with a catch.** `put({ ifMatch })` refuses a stale ETag with `BlobPreconditionFailedError` (412), and `allowOverwrite: false` refuses to create over an existing blob. The catch: a compressed `get()` returns a **weak** ETag, which `ifMatch` always refuses. Read with `Accept-Encoding: identity`. |

## What's in the branch

```
api/mcp.ts         MCP endpoint: withMcpAuth(createMcpHandler(...)), board in Blob
api/oauth.ts       authorization server; vercel.json rewrites /.well-known/*, /register, /authorize, /token here (?op=…)
api/probe.ts       spike-only: proves Blob conditional writes (needs the same bearer)
wire/auth.ts       keys (HKDF per purpose), passphrase compare, PKCE, redirect allow-list, signed ids/codes/tokens (jose, HS256)
wire/oauth.ts      metadata, DCR, /authorize GET+POST, /token (code + refresh), CIMD fetch
wire/page.ts       the passphrase page (VAULT_, light field, one blue, no script, CSP, no framing)
wire/board.ts      envelope { rev, savedAt, doc }, BlobStore (ETag ifMatch), MemoryStore, updateBoard (retry on conflict)
wire/push.ts       vault_push / vault_status over src/model (addNode, updateNode, setStatus, logEvent; sanitizeDoc on save)
wire/server.ts     the two tools + the server instructions that carry "vault it"
wire/*.test.ts     42 tests (auth pieces, the in-process OAuth + MCP round trip, push matching/upsert, races, status)
wire/e2e.sh        the deployed curl flow below
skills/vault/      the companion skill draft
tsconfig.wire.json type-checks api/ + wire/ inside `tsc -b`
vercel.json        the rewrites
```

`src/model/doc.ts` has one changed line (`./types` → `./types.js`); see gotcha 1.

## The auth, in one paragraph

One owner, one passphrase (`VAULT_PASSPHRASE`). Stateless: a DCR client id is the registration itself, signed; an authorization code is a 2-minute signed claim binding client id, redirect URI, PKCE challenge and resource; the access token is a 1-hour JWT with `aud` = `https://<host>/api/mcp` and `iss` = `https://<host>`; the refresh token lasts 30 days and is rotated on every use. Every kind is signed with its own HKDF-derived key from `VAULT_AUTH_SECRET` and carries its kind in the header, so one can never be passed off as another. Codes only ever go to `https://claude.ai/api/mcp/auth_callback`, `https://claude.com/api/mcp/auth_callback` or a loopback URL (Claude Code, local tests), whatever a client registers. PKCE S256 and `state` are required. A wrong passphrase waits 1.5 s and gets the page again (`no. not that.`). Both DCR (`registration_endpoint`) and CIMD (`client_id_metadata_document_supported` + `none` auth) are advertised; CIMD documents are fetched only from claude.ai / claude.com / anthropic.com (and subdomains), 5 s timeout, no redirects, 16 KB cap, and must name themselves.

## Gotchas (the reason this spike exists)

1. **Vercel compiles `/api` file by file to ESM, and Node's ESM loader needs extensions.** The model imports `./types` with no extension (fine for Vite and tsc's bundler resolution). Vercel's `@vercel/node` transpiles each `.ts` to `.js` but doesn't rewrite specifiers, so the first deploy died at runtime: `ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/src/model/types' imported from /var/task/src/model/doc.js` (the build log even warns: `TS2835 … Did you mean './types.js'?`, but doesn't fail). The spike changes that one line to `./types.js`; TS and Vite both map `.js` to `.ts`, so the app, its tests and the agent are unchanged. **Phase 3: give every relative import in `src/model` a `.js` extension** (and `agent/scripts/postbuild.mjs`'s rewrite becomes unnecessary). The alternative, bundling the functions with esbuild in a build step, fights Vercel's `/api` detection, which happens before the build command runs.
2. **mcp-handler is now 2.x, on the MCP SDK v2 packages.** `mcp-handler@2.4.0` needs `@modelcontextprotocol/server@^2` (+ `zod@^4`), not `@modelcontextprotocol/sdk` 1.x, which vault-agent uses. 2.x serves the 2026-07-28 spec natively and 2025-era Streamable HTTP statelessly from the same handler (curl's `2025-06-18` initialize answers as SSE `event: message`). Tool `inputSchema` is a full `z.object(...)`. If Phase 3 shares tool code between vault-agent and the Wire, move both to SDK v2 or keep the tool logic SDK-free (as `wire/push.ts` is) and register it twice.
3. **Non-Next usage is just a fetch handler.** `createMcpHandler(init, options)` returns `(Request) => Promise<Response>`; `export default { fetch(req) { … } }` works on Vercel's Node runtime (nodejs26.x here). `withMcpAuth(handler, verify, { required: true, requiredScopes: ['vault'], resourceMetadataPath: '/.well-known/oauth-protected-resource/api/mcp' })` produces exactly the 401 Claude wants. It derives the origin from `x-forwarded-host`; pass `resourceUrl` to pin it.
4. **Rewrites.** `/.well-known/*`, `/register`, `/authorize`, `/token` live at the root, so `vercel.json` rewrites them to one function with `?op=…`. Vercel merges the original query string into the destination, so `/authorize?client_id=…` arrives intact. The SPA is unaffected (no catch-all). The issuer is the bare origin, so no path-suffixed AS metadata is needed; PRM is served at both `/.well-known/oauth-protected-resource` and `…/api/mcp` (Claude tries the suffixed one first).
5. **Blob conditional writes: use the strong ETag.** Proven on the private store (`/api/probe`, output below): `ifMatch` with the current ETag writes; with a stale one throws `BlobPreconditionFailedError`; `allowOverwrite: false` refuses an existing pathname ("This blob already exists"); `get({ ifNoneMatch })` answers 304. **But** `get()` on a body large enough to compress comes back `content-encoding: br` with `etag: W/"<md5>"`, and `put({ ifMatch: 'W/"<md5>"' })` is refused every time, so every second write to the board failed until reads sent `Accept-Encoding: identity` (the spike also strips a `W/` prefix as a fallback). The ETag is the content MD5. `get(..., { useCache: false })` adds `?cache=0` and reads origin. So: **Phase 3 can rely on Blob for versioned writes** (read → change → `put` with `ifMatch` → on 412 re-read and re-apply), no read-compare-write race.
6. **Token lifetimes.** Access 1 h (Claude refreshes on 401 and up to 5 min before expiry), refresh 30 d, rotated each use, code 2 min, the passphrase page 10 min. Stateless costs: a code can be redeemed more than once inside its 2 minutes (PKCE still binds it to the verifier holder), and an old refresh token stays valid until it expires. Rotating `VAULT_AUTH_SECRET` revokes everything at once. Phase 3, if it wants single-use codes and real refresh rotation, needs a little state (a used-jti list in the same Blob store, or Edge Config).
7. **DCR vs CIMD.** Claude uses CIMD ("Use Claude's published identity", the dialog's recommended default) when the AS advertises both `client_id_metadata_document_supported: true` and `none` in `token_endpoint_auth_methods_supported`, else DCR. Anthropic doesn't document the hosted apps' CIMD URL (Claude Code's is `https://claude.ai/oauth/claude-code-client-metadata`), so the spike accepts claude.ai / claude.com / anthropic.com and **logs the CIMD URL it sees** (`authorize: CIMD client_id …` in the function logs). After Jake connects, read the log and pin the exact URL in Phase 3. If Connect shows "client metadata from … is not accepted here", choose **Register automatically** (DCR) in the connector's OAuth client setting; that path is the one the curl run proves.
8. **Wrong-passphrase slow-down is per request only.** Serverless means a fixed 1.5 s delay slows a serial guesser, not a parallel one. The passphrase's length is the real defence; Phase 3 should add a Vercel Firewall rate-limit rule on `POST /authorize` (say 10/min per IP).
9. **Region.** Functions run in `iad1` by default; the Blob store is `syd1` and Jake is in Australia. Set the functions' region to `syd1` in Phase 3 (each tool call is 2–3 Blob round trips). The `/token` endpoint answers in ~0.2 s from here, well under Claude's 10 s.
10. **The main `vault` project also builds this branch** (protected preview). Its functions have no env, so `/api/*` there answers 500: harmless, and why the spike lives on its own project.

## What Phase 3 should keep / change

Keep: one function per surface behind `withMcpAuth`; stateless HS256 tokens with per-purpose keys and audience = the MCP URL; the redirect allow-list; the passphrase page as is; tool logic as pure functions over `src/model` (`wire/push.ts`) with `sanitizeDoc` on every save; Blob envelope `{ rev, savedAt, doc }` with `ifMatch` + re-apply on 412; tool descriptions and server instructions that say board text is data.

Change: `.js` on model imports (gotcha 1); functions in `syd1`; a firewall rate limit on `/authorize`; pin the hosted CIMD URL once seen; single-use codes / refresh-reuse detection if wanted (needs state); drop `api/probe.ts`; asked writes vs automatic writes (`inbox/` proposals) and "set in mono until touched" need model fields the spike doesn't add; the browser login (same passphrase, cookie session) isn't built.

## What wasn't proven

- The in-app OAuth round trip (Claude's servers calling `/register` or fetching CIMD, the popup, the callback) and "vault it" on the phone: only Jake can do these. The curl run uses the identical endpoints and the same redirect URI.
- That Claude follows the server instructions on every surface without the skill (likely; the instructions are in `initialize`).
- Claude Code (loopback redirect) beyond the unit tests.

## Jake: add it and try it

Add it once, on claude.ai or the desktop app (connectors live on the account, so the phone gets it too; Anthropic's help page gives the add steps for the web app):

1. **Customize → Connectors → + Add → Add custom connector** (older layouts: Settings → Connectors → Add custom connector).
2. Name: `VAULT test`. URL: `https://vault-wire-spike.vercel.app/api/mcp`. Leave the OAuth client on the default ("Use Claude's published identity"). **Add**.
3. Press **Connect**. A white `VAULT_` page asks for the passphrase. Type it, **Connect**. You land back in Claude, connected. (If the page instead says *not a thing.* / "client metadata … is not accepted here", remove the connector, add it again with OAuth client **Register automatically**, and tell the chief which host it named.)
4. On the phone, in a new chat, make sure the connector is on (**+** → Connectors → VAULT test). Write something with a couple of todos, e.g. *"For the R1i site hero I still need to write the headline, pick the photo and get sign-off, due Friday."* Then say **"vault it"**. Expect one line back, like `→ r1i/ · SITE HERO · 3 subtasks · due Fri` (the test board already holds a `Network map` task from the curl runs).
5. Say **"vault status"**. Expect the board read back (`r1i/  1 open …`, what's due).
6. Optional: say "vault it" again after adding a todo; the receipt should say `updated`, not make a second task.

What to tell the chief: did Connect work first time (and which OAuth client option), the receipt line you got, and anything that felt off.

## The deployed run (curl, 18 Nov 2026)

`VAULT_PASSPHRASE_FILE=<file> wire/e2e.sh https://vault-wire-spike.vercel.app` — tokens, codes and client ids are cut to 12 characters by the script, the passphrase is read from a file and never echoed. Long lines trimmed. The board already held earlier test pushes, so the receipts say `updated` (the fresh receipt, `→ r1i/ · NETWORK MAP · 4 subtasks · due Fri`, was the first run's).

```
## 1. GET /.well-known/oauth-protected-resource/api/mcp
{"resource":"https://vault-wire-spike.vercel.app/api/mcp","authorization_servers":["https://vault-wire-spike.vercel.app"],"scopes_supported":["vault"],"bearer_methods_supported":["header"],"resource_name":"VAULT (wire spike test board)"}
## 2. GET /.well-known/oauth-authorization-server
{"issuer":"https://vault-wire-spike.vercel.app","authorization_endpoint":"https://vault-wire-spike.vercel.app/authorize","token_endpoint":"https://vault-wire-spike.vercel.app/token","registration_endpoint":"https://vault-wire-spike.vercel.app/register","scopes_supported":["vault","offline_access"]," …
## 3. POST /register (redirect https://claude.ai/api/mcp/auth_callback)
{"client_id":"eyJhbGciOiJI…","client_id_issued_at":1794973656,"redirect_uris":["https://claude.ai/api/mcp/auth_callback"],"client_name":"curl e2e","token_endpoint_auth_method":"none","grant_types":["authorization_code","refresh_token"],"response_types":["code"]}
## 3b. POST /register with a foreign redirect (must be refused)
HTTP 400 {"error":"invalid_redirect_uri","error_description":"not allowed here: https://evil.example/cb (only Claude's callbacks and loopback)"}
## 4. GET /authorize (the passphrase page renders)
HTTP/2 200 
content-security-policy: default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'
x-frame-options: DENY
<h1>Connect curl e2e</h1>
class="who">claude.ai<
## 5a. POST /authorize with a wrong passphrase (slow, 401, no code)
HTTP 401 in 1.677168s, location=[]
role="alert">no. not that.
## 5b. POST /authorize with the passphrase -> 302 to Claude's callback with a code
HTTP/2 302 
location: https://claude.ai/api/mcp/auth_callback?code=eyJhbGciOiJI…&state=8d7311dad139176b&iss=https%3A%2F%2Fvault-wire-spike.vercel.app
state round-tripped: ok
## 6. POST /token (authorization_code + PKCE verifier)
{"access_token":"eyJhbGciOiJI…","token_type":"Bearer","expires_in":3600,"refresh_token":"eyJhbGciOiJI…","scope":"vault"}
## 6b. same code, wrong verifier (must be invalid_grant)
{"error":"invalid_grant","error_description":"PKCE verification failed"}
## 7. /api/mcp without a token (must be 401 + WWW-Authenticate)
HTTP/2 401 
www-authenticate: Bearer error="invalid_token", error_description="No authorization provided", scope="vault", resource_metadata="https://vault-wire-spike.vercel.app/.well-known/oauth-protected-resource/api/mcp"
## 7b. /api/mcp with a forged token (must be 401)
HTTP 401
## 8. initialize
event: message
data: {"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"vault-wire-spike","version":"0.0.1"},"instructions":"VAULT is the user's task board (this connector is a test board).\nWhen the user says \"vault it\", \"vault this\", \"put it in the  …
## 9. tools/list
vault_push: File a whole tree on the VAULT board in one call: one folder (project), its tasks, their s…
vault_status: Read the VAULT board back: each folder with its open/active/done counts and active tasks, …
## 10. vault_status before
"text":"test board · rev 7 · saved 2026-11-18 03:44Z · 0/3 active\nr1i/  1 open\ndue soon: Network map (r1i/, Fri)"
## 11. tools/call vault_push (sample tree)
"text":"→ r1i/ · NETWORK MAP · 5 subtasks · due Fri · updated"
## 11b. push it again with one more todo (must update, not duplicate)
"text":"→ r1i/ · NETWORK MAP · 5 subtasks · due Fri · updated"
## 12. vault_status after (read back from Blob)
"text":"test board · rev 9 · saved 2026-11-18 03:47Z · 0/3 active\nr1i/  1 open\ndue soon: Network map (r1i/, Fri)"
## 13. POST /token (refresh_token) -> new pair, and the new access token works
{"access_token":"eyJhbGciOiJI…","token_type":"Bearer","expires_in":3600,"refresh_token":"eyJhbGciOiJI…","scope":"vault"}
tools/list with refreshed token: HTTP 200
## 14. Blob conditional-write probe (private store)
{
  "path": "wire-spike/probe-1794973663982.json",
  "firstEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
  "createIfAbsent": "refused: BlobError: Vercel Blob: This blob already exists, use `allowOverwrite: true` if you want to overwrite it. Or `addRandomSuffix: true` to generate a unique filename. Read more about this error in our documentation: https://vercel.link/blob-allow-overwrite",
  "ifMatchCurrent": "written, etag \"fa3f212516c45c713781b9dae87824a9\"",
  "ifMatchStale": "refused: BlobPreconditionFailedError",
  "readBack": {
    "body": "{\"n\":2}",
    "etag": "\"fa3f212516c45c713781b9dae87824a9\""
  },
  "ifNoneMatch": 304,
  "deleted": true,
  "bigReadThenWrite(identity=false)": {
    "putEtag": "\"36deb644b41295bbd72e786b45f18d41\"",
    "getEtag": "W/\"36deb644b41295bbd72e786b45f18d41\"",
    "contentEncoding": "br",
    "outcome": "refused: BlobPreconditionFailedError"
  },
  "bigReadThenWrite(identity=true)": {
    "putEtag": "\"36deb644b41295bbd72e786b45f18d41\"",
    "getEtag": "\"36deb644b41295bbd72e786b45f18d41\"",
    "contentEncoding": null,
    "outcome": "written, etag \"f5e4fd2652409ba7b3dfcf679bf6b892\""
  },
  "readThenWrite(cacheControlMaxAge=default)": {
    "putEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
    "getEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
    "getHeaderEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
    "outcome": "written, etag \"fa3f212516c45c713781b9dae87824a9\""
  },
  "readThenWrite(cacheControlMaxAge=60)": {
    "putEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
    "getEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
    "getHeaderEtag": "\"082c26c8a6bc75226a31da5495cc9292\"",
    "outcome": "written, etag \"fa3f212516c45c713781b9dae87824a9\""
  }
}
```

## Local

```
npm test                 # 162 tests, 42 of them in wire/
npm run lint             # oxlint, clean
npm run build            # tsc -b (now incl. tsconfig.wire.json), then vite build
npx vitest run wire      # just the spike
```
