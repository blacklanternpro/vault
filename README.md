# vault

**VAULT** (`VAULT_`) — BAD FORM's ledger: one person's work as a directory that Jake and every Claude write to. The tree is home, with `ls -l` columns; the board is a pivot of the same rows (`v`) — three live lanes, a DONE chute, `.dusted/` per folder. Every action has a mouse path, a key and a command. Local-first; the Wire (Vercel Blob + a remote MCP connector, "vault it") is an optional switch.

**Status:** Phase 1 (hardening, CI, this law, the Wire spike). The tree-first home is built in Phase 2; until then the live app is the old five-lane board, which moves to `/classic` afterwards. Live: https://vault-lilac-six.vercel.app.

## Run it

```
npm install
npm run dev        # http://localhost:5173
```

## Test it

```
npm test                   # model and shell tests (vitest)
npm run lint               # oxlint
npm run build              # tsc -b, then vite build
npm run e2e                # browser tests on :4174 (first time: npx playwright install chromium)
npm --prefix agent test    # vault-agent
```

## Where the law lives

- [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — the design language (canon); short form in [`.cursorrules`](.cursorrules)
- [`PRODUCT.md`](PRODUCT.md) — what VAULT is, the Wire, the trust rules, phases
- [`DESIGN.md`](DESIGN.md) — tokens and measured values
- [`docs/VOICE.md`](docs/VOICE.md) — every string
- [`docs/ACTIONS.md`](docs/ACTIONS.md) — every action × mouse × key × command
- [`AGENTS.md`](AGENTS.md) — rules for agents working here
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — where things are now

## Code

```
src/model/   the graph: pure operations, store, shell grammar, brief, report, bridge client — with tests
src/shell/   the retiring five-lane board (to /classic in Phase 2)
agent/       vault-agent: file store, HTTP bridge on :7331, MCP stdio server, CLI
e2e/         Playwright browser tests
speck/       the archived SPECK language (unused)
```

## Your data

Saved as JSON in this browser's `localStorage` (`vault:doc`) on every change, with a snapshot every 10 minutes (last 30). **Export to a file is the real backup** — clearing browser data clears `localStorage`. An unreadable save is set aside, never overwritten. Nothing leaves the browser unless you switch on the local bridge (vault-agent) or, from Phase 3, the Wire.
