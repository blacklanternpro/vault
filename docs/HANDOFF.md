# VAULT — handoff for the Phase 2 build

Written 18 Nov 2026 at the end of the planning session. Read this, then the plan.

## Where things are

| What | Where |
| --- | --- |
| The plan (source of truth for scope) | Claude Docs: [VAULT — Phase 2 build plan](https://claude.ai/artifact/RG53xfnrCoBXJaKAEqmA73). Sections: The bet · The Wire · Harden (audit findings 1–12) · The look · The surface: tree first · New tricks · Build order (Phases 1–4) · Calls |
| Live app | https://vault-lilac-six.vercel.app (`main` auto-deploys to production) |
| Prototype Jake approved (17 Nov) | Branch `proto/pivot`, page `/proto/` (`src/proto/`): https://vault-git-proto-pivot-jake1987king-1642s-projects.vercel.app/proto/ |
| Branch previews | Every pushed branch gets `vault-git-<branch>-jake1987king-1642s-projects.vercel.app` |
| Vercel | project `prj_5Dd8r2N2ChRJ6rUN1Di9pW6YbKlK`, team `team_6NahCTLDjZmfLULxSuxcyXtR` |

## Decisions already made (don't re-ask)

- **Tree first.** The directory is home; the board is a pivot of it (`v`), each row morphing into its card. Three live lanes (PENDING, R&D, ACTIVE); DONE is a chute feeding a `done today` counter; DUSTED is a hidden `.dusted/` per folder. The drawer docks beside the tree.
- **ACTIVE cap:** 3, as a nudge (shows `4/3` in red, still allows the move).
- **The board moves to Vercel** once the Wire is built (Blob, versioned writes, OAuth login). Local-first stays: the Wire is a switch.
- **"vault it"** is the phrase. Asked writes land; automatic writes go to `inbox/` as proposals. Claude never deletes or renames Jake's work.
- **The old board** stays reachable at `/classic` after Phase 2 until Jake says kill it.
- **Later, after Phase 4:** a PWA with the directory tree only, no board.
- **Still open (Jake's):** folder names for his Claude Projects.
- **Review:** Jake does a feel check on a preview link at the end of each phase. Nothing merges to `main` without his yes.

## Start here: Phase 1

Run in parallel, one git worktree and branch per track, one owner per file:

- **G1** merge, not overwrite (audit 1, 2): versioned writes, stale ones refused, three-way merge, snapshot + "restore mine" before adopting an outside copy.
- **G3** lock the PC bridge (audit 4, 5, 11): token file, Host check, size cap, the live site back to opt-in (`agent/src/config.ts` currently allows it by default), inbox deleted by id.
- **G6** tests that run themselves (audit 12): CI on every push, sync and undo tests, a two-writer case, an accessibility check, a speed harness on a generated 1,000-item board.
- **G4** rewrite the law tree-first: `docs/LANGUAGE.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md` (all describe the old five-lane board and forbid things Jake has since asked for), plus the voice sheet and the action table (every verb × mouse, key, command).
- **W0** the Wire spike, alongside: `mcp-handler` from this Vite repo's `/api`, OAuth round trip from the Claude app, "vault it" from Jake's phone landing a task on a test board.

Done when CI is green on every push and the spike works from the phone.

## Repo map

- `src/model/` — pure, tested, the source of truth. Any change here needs a test.
- `src/shell/` — the current UI. `Studio.tsx` (~1,120 lines) and `index.css` (~4,430 lines) are to be **retired by Phase 2, not refactored**: the new home is built in new files beside them.
- `src/proto/` — the prototype (on `proto/pivot` only). Phase 2 builds the real version of it.
- `agent/` — `vault-agent`: file store (`~/.vault/vault.json`), HTTP bridge on :7331, MCP stdio server, CLI. Own tests.
- `e2e/` — Playwright. `speck/` — archived language, unused.

## Commands

```
npm test            # vitest (126 on proto/pivot)
npm run lint        # oxlint
npm run build       # tsc -b, then vite (builds index.html and, on proto/pivot, proto/index.html)
npm run e2e         # Playwright against a preview on :4174 (86 tests)
npm --prefix agent test   # vault-agent (74)
```

## Gotchas

- Commit as `BAD-FORM <blacklanternpro@users.noreply.github.com>`, with whatever attribution lines the session gives.
- Kill servers with a bracket pattern in a call of their own, e.g. `pkill -f "[v]ite preview"`, or `pkill` matches and kills the calling shell.
- Union-merging `index.css` hunks has broken rules mid-block before; when tracks collide in CSS, rebuild from one side and re-apply the other.
- Until G1 lands, the in-app "Local agent bridge" can lose work (late reconnect adopts an older copy; browser pushes always beat agent writes). Keep it off.
- Two agent reports dismissed at once can remove the wrong one (index-based delete) until G3.
