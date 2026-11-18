# vault-agent — Agent Handoff for VAULT

The agent-facing half of VAULT. The web app keeps the board in the browser; this
package gives agents (Claude Code, Claude Desktop, Cursor, scripts) a board they
can read and write on disk, an MCP server to do it through, a CLI for humans, and
a small local HTTP bridge so the web app can stay in sync with that file.

```
agent/
  src/store.ts    the board file: atomic writes, .bak, lock, inbox.json
  src/http.ts     the bridge: GET/PUT /doc, /events, /inbox
  src/token.ts    the bridge token: file, rotation, constant-time check, hand-off links
  src/mcp.ts      MCP server (stdio): vault_* tools, vault:// resources
  src/tools.ts    what the tools do; shared by MCP and the CLI
  src/brief.ts    the markdown brief for one task
  src/report.ts   the report parser
  src/match.ts    forgiving title matching
  src/main.ts     the CLI
  test/           vitest
```

It imports the web app's model from `../src/model` (types, pure ops,
`sanitizeDoc`, import/export) and compiles it in place; nothing is duplicated.

## Install, build, test

From the repo root:

```sh
npm --prefix agent install     # once
npm run agent:build            # tsc → agent/dist, entry agent/dist/cli.js
npm run agent:test             # vitest, agent/test
```

Inside `agent/`, `npm run dev -- <command>` runs the CLI from source with tsx,
and `npm run typecheck` type-checks the tests too.

## The board file

Everything works on one JSON file in the same envelope the web app exports:

```json
{ "app": "vault", "version": 1, "savedAt": 1793578142976, "doc": { "nodes": [], "notes": [], "events": [] } }
```

Which file: `--file <path>`, else the `VAULT_FILE` environment variable, else
`~/.vault/vault.json`. An export from the web app (`vault-*.json`) can be dropped
in as-is, or copied in with `vault-agent import`.

Rules the store keeps:

- every write is atomic (temp file in the same folder, then rename) and goes
  through `sanitizeDoc`, so the file is always a valid board;
- the previous copy is kept as `vault.json.bak` before each write;
- a read-modify-write holds `vault.json.lock`, so the MCP process and the bridge
  cannot interleave updates (a lock older than 10 s is taken over);
- a file that cannot be parsed is never overwritten: it is parked as
  `vault.json.unreadable-<time>` first;
- every change an agent makes appends a trail event whose text starts with
  `agent: `, and stamps the task's `touched` time.

The envelope also carries `rev`, a write counter: every write adds one. The
bridge uses it to refuse stale writes (below).

Next to it, `inbox.json` holds agents' reports for the person to read in the web
app: `{ "inbox": [ { "id": "i3f9a…", "at": 1793578710847, "taskId": 8, "text": "## Report ..." } ] }`.
Each item has a stable `id`; items written before ids existed get one derived
from their time and text.

Also next to it, `bridge-token`: the bridge's secret (see below).

## The bridge (`vault-agent serve`)

```sh
vault-agent serve                                               # http://127.0.0.1:7331
vault-agent serve --origin https://vault-lilac-six.vercel.app   # also let the live site in
vault-agent token                                               # print the token and the app links again
vault-agent token --rotate                                      # make a new token; old links stop working
```

Plain Node `http`, bound to loopback, JSON in and out. On start it prints where
it is, which file, which token file, which origins, the size cap, and one link
per allowed origin:

```
vault-agent bridge on http://127.0.0.1:7331
  file:     C:\Users\you\.vault\vault.json
  token:    C:\Users\you\.vault\bridge-token (new)
  origins:  http://localhost:5173, http://localhost:4173, http://127.0.0.1:5173, http://127.0.0.1:4173
  max body: 5 MiB
  open the app with its token (one of):
    http://localhost:5173/#bridge-token=<43 characters>
    …
```

Open the link for the address you use the app at. The app reads
`#bridge-token=`, keeps the token with its bridge settings and removes it from
the address bar. From then on it sends `Authorization: Bearer <token>` on every
request.

| Route | Token | Does |
| --- | --- | --- |
| `GET /doc` | yes | the board, as the envelope above, with `rev` |
| `PUT /doc` | yes | replace the board; body `{ app, version, savedAt, base, doc }`; `base` is required (below) → `{ ok, savedAt, rev }` |
| `GET /events?since=<ms>` | yes | `{ since, savedAt, events }`, trail events after `since`, newest first |
| `GET /inbox` | yes | `{ inbox: [...] }`, each item with its `id` |
| `POST /inbox` | yes | body `{ text, taskId?, at? }` → `201 { id, item }` |
| `DELETE /inbox/:id` | yes | `{ removed, inbox }`; 404 when there is none; 400 for a bare number |
| `GET /health` | no | `{ app, version, authorized: false }`; with the token also `file, savedAt, rev, nodes, inbox` |
| `OPTIONS *` | no | the CORS preflight, for allowed origins |

Every request is checked in this order and refused before the file is touched:
Host (421), Origin (403), token (401), size (413). What each rule is and why:

**The token.** Until Phase 1 any program on the PC, and possibly a hostile web
page, could read or replace the board through the bridge (audit 4). Now every
route needs `Authorization: Bearer <token>`. The token is 32 random bytes
(base64url) in `bridge-token` beside the board file (`~/.vault/bridge-token` by
default), created the first time `serve` or `token` runs, readable only by you
(mode 0600; on Windows the file sits in your user folder, which only you can
read). `--token-file <path>` or `VAULT_TOKEN_FILE` puts it elsewhere. A missing
or wrong token gets `401` with a JSON error that says to run `vault-agent token`
and open the link. The comparison takes the same time whatever was sent.

**Rotation.** `vault-agent token --rotate` writes a new token. A running bridge
notices the file changed and uses the new one at once; the app needs the new
link (run `vault-agent token` to print it). Rotate if a link was pasted
somewhere it should not have been.

**/health stays open.** Without the token it answers only
`{ app, version, authorized: false }`, so the app can tell "the bridge is
running but I don't have the token" apart from "nothing there". Nothing about
the board is shown without the token.

**The Host check.** A web page can point its own domain at 127.0.0.1 (DNS
rebinding) and then talk to the bridge as if it were its own site. Such a
request still carries the page's name in its `Host` header. The bridge only
answers a `Host` of `localhost`, `127.0.0.1` or `[::1]` (or the address given
with `--host`) at the port it is on; anything else gets `421`.

**The live site is opt-in.** `https://vault-lilac-six.vercel.app` used to be
allowed by default (audit 5). Now only the local dev and preview servers are.
To use the bridge from the live site, start it with
`--origin https://vault-lilac-six.vercel.app` (repeatable; `VAULT_ORIGINS`
takes a comma-separated list too). A page from any other origin gets `403`
whose error names the exact `--origin` flag to add, and no CORS headers.
Chrome's Private Network Access preflight (a public https page asking to reach
localhost) is answered only for allowed origins. Requests without an `Origin`
(curl, scripts) skip this check but still need the token.

**The size cap.** A request body may be at most 5 MiB (`--max-body 10mb` to
change). A 1,000-item board with long text on every item and a full trail is
about 0.8 MB, so that is five to six times headroom. A body over the cap gets
`413`: at once when its `Content-Length` says so, otherwise as soon as it
passes the cap; it is never buffered whole. (It was 32 MB.)

**Versioned writes.** The file's `rev` goes up by one on every write, whoever
writes. `PUT /doc` must say which rev its edit was based on, as `base`:

- `base` is the current rev → written, answer `{ ok, savedAt, rev }` with the new rev;
- `base` is any other rev → `409` and the body is the current envelope (with
  its `rev`), so the client can merge and try again with that rev;
- no `base` → `428 Precondition Required`: "send base: the rev your edit was
  based on; GET /doc to read the current rev". The old "newer `savedAt` wins"
  rule let the browser silently overwrite an agent's change made seconds
  earlier (audit 2), so the bridge no longer accepts a write that cannot say
  what it was based on. The bridge is off by default in the app and the live
  site is opt-in, so no old client is writing through it.

`GET /doc` and `GET /health` (with the token) show `rev`. A board file with no
rev yet reads as rev 0.

**Inbox by id.** Reports are removed with `DELETE /inbox/<id>`. Removal by
position (`DELETE /inbox/0`) is gone: two removals at once could take the wrong
item (audit 11). A bare number now gets `400` saying to use the id. `POST
/inbox` answers the new item's `id`. Agents that file reports through MCP
(`vault_report`) or the CLI (`vault-agent report`) write to `inbox.json`
directly; their items get ids the same way.

The bridge does not listen beyond loopback unless you pass `--host`.

### How the web app syncs

With "Local agent bridge" on, the app (`src/model/bridge.ts`, `src/shell/useBridge.ts`):

1. sends `Authorization: Bearer <token>` on every request, the token taken
   from the `#bridge-token=` link;
2. polls `GET /doc` and remembers the `rev` it last saw;
3. on a local change, `PUT /doc` with `base` = that rev;
4. on `409`, merges with the envelope in the response and puts again with its `rev`;
5. shows `GET /inbox` items as a notice per report and `DELETE /inbox/<id>`s
   them once read;
6. optionally reads `GET /events?since=<lastSeen>` for "since last time".

## The MCP server (`vault-agent mcp`)

Stdio transport. Tools (every one returns a short text, the same facts as a
JSON text block, and `structuredContent`):

| Tool | Arguments | Does |
| --- | --- | --- |
| `vault_list_tasks` | `project?`, `status?`, `tonight?` | cards as a compact table plus rows |
| `vault_get_task` | `id` or `title` | the task's markdown brief (below) plus a JSON summary |
| `vault_tick` | `id`, `subtask` | marks an open subtask done (title match: case-insensitive, Levenshtein ≤ 2, or prefix; or its id) |
| `vault_add_subtask` | `id`, `title`, `done?` | adds a line; refuses an exact duplicate |
| `vault_set_status` | `id`, `status` | `pending`, `rnd`, `active`, `done`, `dusted` |
| `vault_set_next` | `id`, `next` | the one next action; `""` clears |
| `vault_left_off` | `id`, `text` | where work stopped; `""` clears |
| `vault_add_link` | `id`, `url`, `label?` | http(s) only; label defaults to the host |
| `vault_report` | `id`, `report` | parses a markdown report and applies it in one write; files it in the inbox |
| `vault_create_task` | `project`, `title`, `status?`, `next?`, `due?` | a new card; `due` is `YYYY-MM-DD` |
| `vault_search` | `q` | projects, tasks and subtasks whose title or goal contains `q` |

`id` is a number (`5`), a string (`"5"`, `"#5"`), or a title. Titles are matched
forgivingly: exact, a typo or two, a prefix, or a phrase only one title contains.
A miss is an error that names the nearest thing:
`No task matches 'navv'; closest: NAV RESTRUCTURE (#8)`. A tie is an error that
lists the candidates and asks for the id.

Resources: `vault://tasks` (the table) and `vault://task/{id}` (the brief; one
resource is listed per card).

### Claude Code

```sh
claude mcp add vault -- node /absolute/path/to/vault/agent/dist/cli.js mcp
# with a board file somewhere else:
claude mcp add vault -e VAULT_FILE=/path/to/vault.json -- node /absolute/path/to/vault/agent/dist/cli.js mcp
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "vault": {
      "command": "node",
      "args": ["/absolute/path/to/vault/agent/dist/cli.js", "mcp"],
      "env": { "VAULT_FILE": "/Users/you/.vault/vault.json" }
    }
  }
}
```

On Windows use the full path with backslashes escaped
(`"C:\\Users\\you\\vault\\agent\\dist\\cli.js"`) and, if `node` is not on the
PATH that Claude Desktop sees, the full path to `node.exe` as `command`.

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "vault": {
      "command": "node",
      "args": ["/absolute/path/to/vault/agent/dist/cli.js", "mcp"],
      "env": { "VAULT_FILE": "/Users/you/.vault/vault.json" }
    }
  }
}
```

## The CLI

```
vault-agent mcp                         MCP server over stdio
vault-agent serve [--port 7331] [--origin URL]... [--max-body 5mb] [--token-file PATH]
vault-agent token [--rotate] [--origin URL]... [--json]
vault-agent ls [project] [--status lane] [--tonight] [--json]
vault-agent brief <id|title>            one task as a markdown brief
vault-agent report <id> < report.md     apply a report
vault-agent tick <id> "<subtask>"
vault-agent import <vault-export.json>  copy an export (or an old SPECK save) into the board file
vault-agent export > out.json           print the board file as an export envelope
```

`--file <path>` works on every command; `VAULT_FILE` does the same.
`--token-file` / `VAULT_TOKEN_FILE` and `--origin` / `VAULT_ORIGINS` work on
`serve` and `token`. Paths may start with `~`; Windows paths work as they are. Exit codes:
0 ok, 1 a clear refusal (printed to stderr), 2 usage.

## The brief

`vault_get_task`, `vault-agent brief` and the web app's **Copy as brief** all
produce this. Sections appear in this order; `## Goal`, `## Links`,
`## Where I left off` and `## Recent trail` are left out when empty, the rest
are always present.

```markdown
# SITE REDESIGN
Task #2 · Project: homepage · Status: ACTIVE · Due: 2026-11-05 (in 3 days) · Urgent · Tonight

## Goal
Redesign the homepage to better communicate the value prop and improve conversion.

## Next action
Create wireframes

## Subtasks
- [x] Review current homepage analytics
- [ ] Create wireframes
  - [ ] Mobile layout
- [ ] Design high-fidelity mockups

## Links
- [repo](https://github.com/blacklanternpro/vault)

## Where I left off
Hero section half drawn

## Recent trail
- 2026-11-01 23:59 · moved · moved to ACTIVE
- 2026-11-01 23:55 · ticked · Define new information hierarchy

## Done when
Every subtask above is ticked and the next action is done. 3 of 4 are still open.

## Report back
When you stop, reply with a report in this shape (titles as written above; new lines for work you found):

    ## Report
    - [x] a subtask you finished
    - [ ] a new subtask you found
    Left off: where you stopped, in one line

Send it with the `vault_report` MCP tool (id 2), or `vault-agent report 2 < report.md`, or paste it into this task in VAULT.
```

Precisely:

- Line 1: `# ` + the title, as stored.
- Line 2, parts joined by ` · `: `Task #<id>`; `Project: <name>` (the root the
  task hangs under); `Status: <LANE>` in upper case (`PENDING`, `R&D`, `ACTIVE`,
  `DONE`, `DUSTED`); `Due: YYYY-MM-DD (today | tomorrow | in N days | N days overdue)`
  when set; `Urgent` when flagged; `Tonight` when on the shelf;
  `Loose from: <parent title> (#id)` for a subtask pulled onto the board.
- `## Goal`: the body, trimmed. Omitted when empty.
- `## Next action`: the next action, or `(not set — pick the first open subtask)`.
- `## Subtasks`: one line per subtask in tree order, `- [x] ` when done and
  `- [ ] ` otherwise, nested lines indented two spaces per level. `(none yet)`
  when there are none. Loose subtasks are cards of their own and are not listed.
- `## Links`: `- [label](url)` per link. Omitted when empty.
- `## Where I left off`: the left-off note. Omitted when empty.
- `## Recent trail`: the task's last 8 trail events, newest first, as
  `- YYYY-MM-DD HH:mm · <kind> · <text>` in local time. Omitted when empty.
- `## Done when`: one sentence built from the data (how many subtasks are open,
  whether there is a next action).
- `## Report back`: the instruction above, with the task id filled in. The
  template is in a fenced code block so a pasted brief never reads as a report.

## The report

What `vault_report`, `vault-agent report` and the web app's **Paste report** read:

```markdown
## Report
- [x] Create wireframes
- [x] Wrote the hero copy
- [ ] Check contrast on the CTA
Left off: halfway through the pricing section
```

- `- [x] title`: the open subtask whose title matches (same forgiving match as
  `vault_tick`) is ticked. When none matches and none of the ticked ones does
  either, the line is **added as a done subtask** — work the agent did that was
  not on the list. A line that matches an already ticked subtask is skipped.
- `- [ ] title`: added as an open subtask, unless a subtask with a matching title
  already exists (skipped).
- `Left off: ...`: becomes the task's left-off note (the last such line wins).
- The `## Report` heading is optional; with it, only the lines up to the next
  heading are read. Bullets may be `-`, `*`, `+` or `1.`; `[X]` counts as `[x]`;
  fenced code is skipped; `**Left off:**` is fine. Other lines are reported
  as skipped, not applied.

Applying a report is one write: ticks, additions and the note, each with its
own `agent: ` trail event, then one `report` event
(`agent: report: ticked 2, added 1, left off noted`). The raw report text is
also appended to `inbox.json` with the task id, so the web app can show it. The
result lists what was ticked, added and skipped (with reasons).

## Worked example

1. The person (or the chief agent) copies a brief, in the web app or with
   `vault-agent brief 2`, and hands it to a project agent.

2. The agent works from it. As it goes:

   ```
   vault_tick       { "id": 2, "subtask": "create wireframes" }
   vault_add_link   { "id": 2, "url": "https://github.com/blacklanternpro/vault/pull/41", "label": "PR #41" }
   ```

3. When it stops, one call:

   ```
   vault_report {
     "id": 2,
     "report": "## Report\n- [x] Design high-fidelity mockups\n- [x] Wrote the hero copy\n- [ ] Check contrast on the CTA\nLeft off: pricing table half done"
   }
   ```

   Answer:

   ```
   Report applied to SITE REDESIGN (#2): ticked 1, added 2, skipped 0, left off noted. 4/6 done. Delivered to the VAULT inbox (#0).
     ticked:  Design high-fidelity mockups (#6)
     added:   Wrote the hero copy (#23) [done]
     added:   Check contrast on the CTA (#24)
     left off: pricing table half done
   ```

4. The web app, with the bridge on, picks up the new board on its next poll and
   shows the report from the inbox. Without the bridge, `vault-agent export`
   and the app's Import do the same by hand.

## Notes

- The bridge and the MCP server are separate processes sharing one file; the
  lock file keeps their writes from interleaving. The MCP server and the CLI
  read the file directly and need no token; the token guards only the HTTP
  bridge. Run `vault-agent serve` once
  (for example in a terminal you leave open) and let each MCP client start its
  own `vault-agent mcp`.
- The MCP server writes only the protocol to stdout; its one log line goes to
  stderr.
- `vault-agent import` also reads an old SPECK text save, through the model's
  own `importText`.
