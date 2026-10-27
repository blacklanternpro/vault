## 7. SPECK — the machine tongue

SPECK is a real domain-specific language. It is not a metaphor. It is not a design-token rename.

It is **not** a general-purpose language (no Python-from-scratch, no LLVM, no stdlib). Cousins: PostScript, Forth, Logo, teletext, 3270.

HTML/CSS/React nouns are boxes, cards, flow. SPECK nouns are the field.

The runtime lives in `src/speck`. It lexes, parses, compiles a display list, paints pixels, and interprets dock lines + hits. The live program is the source string.

### Feature dream rule

A new feature must be **sayable in SPECK**. If you cannot write it as source, it does not belong. Help Jake say it, or refuse the feature.

### 7.1 Source

Line-oriented. Indent (2 spaces) groups a body. Words are Forth-like. Case-insensitive opcodes; payloads keep their case. Comments: `//` or Forth `\` to end of line.

```
INV
GRAIN 0.14
SCAN 0.1
PIPE vault
  COL backlog
  COL active
  COL staging
  COL done
NEST
  NODE 1 "ops" status none
    NODE 10 "lab" status none
      NODE 11 "scout_ridge_a" status none URGENT
    NODE 20 "net" status none
      NODE 102 "telemetry ui" status active
        BODY "spec leftover"
    NODE 104 "ingress routing" status backlog
DUMP
  NOTE 09.07.26 "ridge"
PLACE PIPE 24 48
PLACE NEST 24 540
PLACE DUMP 560 540
PLACE SEAL 900 48
PLACE SKULL 900 280
PLACE CAL 560 48
GLYPH 16 16 56 "VAULT"
```

**Tokens**

| Form | Example | Meaning |
| --- | --- | --- |
| word | `PIPE` `TASK` `SHOVEL` | opcode |
| string | `"ridge"` | payload |
| tape date | `09.07.26` | `MM.DD.YY` on DUMP notes |
| number | `104` `24` | id, PLACE, GLYPH size |

Empty storage loads the seed program. `CLEAR` restores seed.

### 7.2 Nouns (source)

These name the field. They compile to paint ops. Do not add a noun unless the field grew a new organ.

| Noun | Says |
| --- | --- |
| `PIPE` | split-page binder (a *view* of the graph) |
| `COL` | `backlog` `active` `staging` `done` |
| `NEST` | tree lens of the same graph |
| `NODE` | a graph node: `id`, title, `status`, indent = parent |
| `BODY` | optional body on the current node |
| `DUMP` | scratch tape |
| `NOTE` | a dump line |
| `PLACE` | organ origin `x y` |
| `GLYPH` | free field ink `x y px "text"` |
| `DOCK` | the operator (always compiled) plus a read-only legend rail |
| `INV` | paper ground. Off restores black field |
| `GRAIN` | film salt amount |
| `SCAN` | scanline amount |
| `SEAL` | wireframe globe organ |
| `SKULL` | pixel skull organ |
| `CAL` | month digits in a window. Not home |

Dead as field chrome: `TASK` `STEM` `CLIP` as live nouns. Legacy `TASK` / `STEM` lines still parse into `NODE`s. Typed at the dock they are dumps if they are not commands.

`SEE` echoes source. `WORDS` echoes the live opcode list. `CLEAR` restores seed. `SHOVEL` advances a node (or lifts `none` onto `backlog`). `FOCUS` filters PIPE to a nest subtree. Dump lines create projects and child tasks. Legend HIT toggles `GRAIN` / `SCAN` / `INV`.

### 7.3 Opcodes / IR

The painter executes a **stateless display list**. Source `INK` is baked into each op at compile. Live public ops:

`FILL` `GLYPH` `LINE` `CHIP` `STRIKE` `STEM` `GRAIN` `SCAN` `INV` `OVAL`

| Op | Paints |
| --- | --- |
| `GLYPH` | Type (Helvetica work, Oswald plaques). |
| `CHIP` | power-red fill, white text. Selection invert. Radius 0. Same row height. |
| `LINE` | ledger hairline. Spine. Organ edge. Tick ruler. |
| `STRIKE` | power-red mid-line on done / `[X]`. |
| `STEM` | ascii tree prefix + label. |
| `FILL` | paper sheet or black plate. Dither salt (1×1). |
| `GRAIN` | film salt. Deterministic. |
| `SCAN` | IMP scanlines on black fills / PIPE meter. |
| `INV` | marker; compile uses paper ground. |
| `OVAL` | power-red ellipse around the live CHIP. |

Overlap is legal. Expanded rows **reflow** — they do not cover later ink.

Do not advertise `CLIP`.

### 7.4 Events

Pointer and keys are SPECK. The host does not own behavior; it forwards.

```
HIT NODE 102
HIT ADD 20
HIT SHOVEL 102
HIT FIELD
SHOVEL
FOCUS
TYPE …
COMMIT
CLEAR
SEE
WORDS
```

HIT a binder node to expand it in place and edit. HIT empty field / Esc to collapse. HIT a CAL day to list DUMP notes for that date. Never three forms. Never CTX chips in a header.

### 7.5 Dock operator

The Prompt Dock is the **operator**. One line. Titles are typed in the field editor.

- If the line **parses as a command** (`SEE`, `WORDS`, `CLEAR`, `HIT`, `COMMIT`, `SHOVEL`, `FOCUS`, `MOVE`, `STRIKE`): execute it.
- Else it is a **dump**. Cue `new … project` / `create project` → project node; next clause is the title (do not auto-abbreviate); remaining clauses (commas / `need to` / `and`) → child tasks at `backlog`. Bare dumps → tasks under the focused project, or inbox. Ambiguous parse echoes `?` plus the guessed tree; empty Enter confirms.
- Empty commit is a no-op unless a pending dump is waiting.

Examples: `SEE` · `WORDS` · `SHOVEL` · `FOCUS` · `new website project, site redesign of homepage, need to assess aesthetic, create repo`

### 7.6 Runtime contract

1. **The program is source.** `localStorage` key `speck-os-v1`. Ignore `speck-month-v1`.
2. **The field is compiled** from source + session → display list → pixels. Session: selected node, nest/pipe expand, nest focus, field slot, collapsed organs, dock buffer, echo, pending dump, calDay. Redraw on dirty + caret interval. No hot RAF. One material overlay (WebGL or 2D fallback) for grain+scan together.
3. **Paint pixels.** Canvas (later Skia). Not DOM flow. The host keeps a native `<input>` over the dock glyph line **and** over the active cell. Envelope, not aesthetic.
4. **Hit test the display list.** Highest-z box wins. Expanded rows occupy their own hits. Organs above empty field.
5. **Commits mutate source.** `SHOVEL` rewrites a node status. Dump inserts nodes. Field editor rewrites title/body. `CLEAR` restores seed. Legend HIT rewrites `INV`/`GRAIN`/`SCAN`. No worker. No CRDT. No JSON sidecar.
6. **No CLIP, overlay dossier, DateBlocks cards, cobalt theme, or month-as-OS home** on this instance. Grain, scan, INV, oval, seal, skull, and CAL are live letters.

Packaging (when asked): SPECK runtime in a boring envelope (Tauri / WebView). Desktop. Seal as icon only. No browser chrome. The envelope is not the aesthetic.

### 7.7 What SPECK is not

- Not CSS.
- Not a React component tree with cute names.
- Not a general-purpose language.
- Not a reason to add a settings app.
- Not a second palette, a HUD, a card system, or a Tailwind binder.

---

