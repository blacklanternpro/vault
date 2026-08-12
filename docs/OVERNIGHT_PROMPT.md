# OVERNIGHT PROMPT — paste this into a future agent

This is a **later-run** brief. Tonight we wrote the language. You (the future agent) may invent SPECK fully and, if asked, implement the runtime. Do not ignore `docs/LANGUAGE.md`. It is canon.

Read this whole file. Then read `docs/LANGUAGE.md`. Then read `.cursorrules`. Then look at the current shell. Then go.

---

## Mission

Grasp the vision. Put a spin on it. Go further from the boring. Stay utility.

You are building toward **VAULT WORLDWIDE** — a personal OS that is a cassette-futurism *machine*, spoken in a custom language called **SPECK**, eventually packaged as an APK Jake can install. You are not building another React dashboard that almost looks like a TUI.

Jake (blacklanternpro) spent hours fighting agents that translated his vision into cards. DateBlocks made him almost throw up. The single-field prompt was “magic / Genius.” The bath insight: the only way to hit this level of design obsessiveness is to abandon CSS-as-OS and craft a custom spec that runs as an actual program.

**Tonight-of-that-future-run:** invent and specify SPECK fully, then (when asked) implement the runtime. Do not ship another stack of components and call it done.

If Jake only wanted language docs, they are already in this repo. You are here to *use* them.

---

## Who this is for

Jake / BLACK LANTERN. Personal OS. Not a store product. Not a SaaS. Local-first, no cloud personality. Seed world is ops / lab / field — reindustrial, not grocery-list demo.

---

## Canon (read in this order)

1. **`docs/LANGUAGE.md`** — the grand language. Tokens, taste stack, grammar, vetoes, take/leave, SPECK first draft, how to apply. **Primary.**
2. **`.cursorrules`** — short law. Obey it. It points here.
3. **Current shell** — `src/App.tsx`, `VaultSeal.tsx`, `Calendar.tsx`, `TaskNest.tsx`, `Scratchpad.tsx`, `PromptDock.tsx`, `src/workers/sync.worker.ts`, `src/index.css`. Correct skeleton. CSS is the wrong long-term substrate.
4. **History** — Gemini neo-brutal TUI blueprint (engineering DNA). PRs #8–#11 (fried TUI → burn the box → mobile OS shell). PR #7 DateBlocks = warning. User quotes below.
5. **Boards** — [cassette futurism ui](https://au.pinterest.com/search/pins/?q=cassette%20futurism%20ui&rs=typed) is the world. [Sleaze board](https://pin.it/6UnA3VfjN) is salt. Attached refs in LANGUAGE.md §9 are take/leave — **cobalt-on-pale Archive poster is the closest cousin.** Steal structure from dark phosphor terminals; restamp onto canvas/ink/cobalt.

---

## Locked tokens

- Canvas `#F4F4F0` — machine plastic
- Ink `#111111`
- Cobalt `#0000FF` — VAULT phosphor / chrome
- Urgent `#FF2B2B` — warning LED only (strikes, URGENT, `[X]`)

JetBrains Mono everywhere except calendar numerals (Space Grotesk, light).

Radius 0. No shadows. Grain + scan are CRT dirt, not a filter pack.

INV = dirty invert of the whole field. Not a second theme.

---

## Composition law

One field. Mobile-first.

1. Seal (no box)
2. Cram calendar (parasite chips, red strikes, MO/YR)
3. Unix nest (`│ ├── └──`)
4. Dump (cobalt date anchors)
5. ONE dock, locked to the viewport bottom. Click = context. Never three forms. Never CTX chips in the header.

You may refine density and placement **inside cassette futurism**. You may not add hardware bays, card grids, or a second input.

---

## Taste stack

Cassette futurism world + minimal refined rawness + a little sleaze + echo of hacker grime.

Salt, not costume. If it looks like a rave flyer, a Mr. Robot title card, NEXUS_OS v5.0, or a Matrix launcher, too much salt.

---

## Hard vetoes

DateBlocks · jagged day cards · SaaS stacks · rounded corners · soft shadows · acid watermarks · giant boxed logos · Inter · green-on-black notes · amber boxed terminals · header CTX chips · three forms · demo BUY MILK · Alien Isolation cosplay · chunky skeuomorphic knobs · vaporwave neon · VT323/Orbitron · Matrix/Kali costume · rave-flyer sleaze takeover · NEXUS-HUD chrome (GRADE D, waveforms, tabs-as-apps, cyan-on-black)

Full list: `docs/LANGUAGE.md` §8.

---

## What already works (keep)

- Prompt Dock as the deck. Click-sets-context. This is the magic.
- MO/YR cram calendar + parasite chip *idea*
- Unix nest + seed `ops/ lab/ field/`
- INV
- Yjs worker / IndexedDB — UI never touches Yjs
- Beige canvas as plastic, grain/scan as CRT

Do not throw the skeleton away to prove you are bold. Bold is SPECK, not another layout.

---

## SPECK — invent this for real

First draft lives in `docs/LANGUAGE.md` §7. You are authorized to complete the spec:

- **Syntax** — dock-typable source
- **Opcodes** — `GLYPH INK STRIKE CHIP STEM SEAL DOCK GRAIN SCAN INV` (extend only if the field needs a new noun)
- **Events** — `HIT` `TYPE` `COMMIT` `STRIKE` `INV`
- **Runtime contract** — paint pixels; persistence stays data
- **What it is not** — CSS, React-with-nicknames, a general-purpose language

Cousins: Forth, PostScript, teletext, 3270.

**Feature dream rule:** if Jake dreams a feature and it cannot be said in SPECK, it is not in the language. Help him say it, or refuse the feature.

### Example source (shape, not frozen)

```
SEAL reindustrialize
CAL cram AUG '26
  DAY 11 STRIKE
  CHIP "FLUSH RESOLVERS"
NEST ops/ URGENT
  STEM net/ flush_stale_resolvers.sh
DUMP 08.12.26 "ridge notes"
DOCK DAY 08.12.26
```

### APK (when asked — not assumed)

SPECK runtime in a boring envelope (Capacitor / WebView / TWA). Sideloadable. Seal as icon. No browser chrome. The envelope is not the aesthetic. The program inside is SPECK.

---

## User voice (do not sand this down)

- “fantastically fried tui maxi minimalism. give it some sleaze as well”
- “whatever you do dont have the disgusting date blocks… i almost threw up”
- “The single field prompt is magic idea. Genius.”
- “This is now its own lil os, not a stack of style sheets and sections”
- “the only way we can do something like this to the level of design obsessiveness is to abandon the language we are coding with and go custom speck”
- “craft something out of the raw ether to run as an actual program, packaged as my own apk”
- cassette futurism board: “Thats where are program is going to be living. with its own twists and refinement, a little more minimal and refined rawness”
- “we want that little bit of sleaze + echo of hacker grime”
- “save our design language as a grand and all encompasssing set of rules and vibes that we could apply in the future to other projects”

Further from the norm. Firmly in utility. Order from chaos.

---

## Authority

Propose and make bold changes **inside the language**.

Do not propose a new palette. Do not “just use Tailwind a bit more carefully.” Do not revive DateBlocks. Do not build NEXUS HUD and stamp VAULT on it.

New features must be SPECK-sayable.

When in doubt: cobalt on plastic, one dock, overlap is allowed, red is an alarm, empty is `_`.

---

## This run vs later

- **Language docs** are already in the repo. Do not rewrite LANGUAGE.md into mush. Amend SPECK as the spec hardens.
- **Do not** restyle the React shell as the destination. The React shell is a host or a corpse.
- **Do not** copy dark-phosphor / Matrix-green / NEXUS-HUD from the moodboard onto the field.

Go.
