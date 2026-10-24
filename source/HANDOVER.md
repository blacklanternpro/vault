# BEDSIT — handover brief (24 Oct 2026, v5 in progress)

Read this first, then `src/`. This bundle holds the full source. The public vault repo only holds the minified build.

## START HERE — the next job

**Build the v5 plan.** It lives in a Claude Docs doc: https://claude.ai/artifact/A4mQ6PNGcfnCMCFcSNsw2Z. Read the doc before writing code; it has the detail for each workstream.

| Order | Workstream | One line | Status |
| --- | --- | --- | --- |
| 1 | Sit down and watch TV | Generalise `SEAT` (p8a) into a seat system: couch + desk, remote control, captions while seated | **Shipped as v5.1** |
| 2 | Ad channel | Move Happy Happy Play Place off the PC onto TV CH 7 "ADS ALL NIGHT" (see below) | **Shipped as v5.2** |
| 3 | EXECUTIONER v2 | Walk around, no game over, glass security door, control room, NEXT SUBJECT button | **Shipped as v5.3** |
| 4 | People and gore fidelity pass | One continuous bending mesh per person, real faces and expressions, clothing, layered gore | Next |
| 5 | Mobile controls | Touch layout for every tool, both seats and the game; phone quality tier | |

**Jake locked the decisions on 24 Oct 2026** (section 6 of the doc):
1. **F** = in-game use at the desk (buttons, door lock, clipboards); **E** = stand up.
2. **Extra ads:** Gary's Property Group, QUIKCASH and SWILL.
   - Gary is the cliché greasy real estate agent: slicked hair, shiny suit, gold chain, too-white teeth, finger guns, a convertible, "Inspections every Thursday!".
   - SWILL is "SWILL… it's ADDICTIVE": a man drinking faster and faster until he's slumped blind drunk in a sea of empties.
3. **Ad channel resolution:** 854×480 widescreen 480p on desktop, 640×360 on the phone tier.
4. **Six ragdoll bodies** at once, then the oldest freezes.
5. **One continuous bending skin per person,** but ONLY if dismemberment, open torsos and good layers of gore all survive it. Prototype that first; fall back to separate parts with rounded joint caps if not.
6. **Make the Vercel link public:** turn off Vercel Authentication on the production deployment. Do it with the mobile release unless Jake asks sooner.
7. **Ads stay on CH 7 only** (no ad breaks in other channels).
8. **Back up the whole game to the vault repo:** done on 24 Oct, see `source/` in the repo. Keep it in sync: every release commits the updated `source/` along with `game.min.mjs`.

**Gore is the softest guardrail.** Jake: "don't skimp on the gore". Push the detail.

**The ad channel content:**
- Three different HHPP ads: "Soft Landing" (the current one reworked to 16:9), "Biscuit's Birthday" and "Knit One, Love One".
- TOOT TOOT JUNCTION, a 45 s miniature railway park ad. Dark comedy: creepy painted-face engines (original designs, nothing like Thomas) take control from the dads driving them and vanish into the TUNNEL OF TOMORROW, a netherworld of evil trains. The kid comes back wearing dad's hat. Fast legal disclaimer at the end. No harm shown to kids.
- Gary's Property Group, QUIKCASH and SWILL ads, plus a station ident.
- Beat-by-beat scripts are in the doc. When moving HHPP off the PC, delete the `ad` state from EXECUTIONER (p8c). The `drawHound`, `drawCarer`, `drawCouch` and `drawLogo` drawing code moves into a shared ad engine.

**Ship each workstream on its own,** the same three ways as always (below).

## What it is
BEDSIT is a single-file, first-person demolition sandbox that runs in the browser. It is a 6.5 × 8.5 m studio bedsit with a bathroom, galley kitchen, two skylights and one door. Everything is demolishable, and the feel is Half-Life 2 / Source.

- **Stack:** Three.js r160, cannon-es 0.20 and three-mesh-bvh 0.9.16, loaded through an importmap from unpkg.
- **Assets:** textures are procedural canvas and audio is procedural Web Audio. The FAL-generated `hammer.glb` and `saw.glb` are the only binary assets.
- **Tools:**
  1. claw hammer
  2. wrecking bar
  3. Sawzall
  4. hands
  5. texta
- **Other keys:** F = kick. E = use / drop. L = flashlight. P = performance mode.
- **The desk PC:** power it on, then E on the 21" monitor sits you down to play EXECUTIONER.
- **The couch (v5.1):** E on the couch sits you facing the TV. Wheel/arrows/1-9 change channel, 0 power, V volume, M mute, T sleep timer (off/30/60/90), E stands. The remote lives on the couch arm.

Owner: Jake (BAD FORM). He directs; Claude builds. He tests on a 4060 laptop through the Vercel link, and wants to try an iPhone 17 Pro later; that's the mobile workstream.

## Standing rules from Jake
- **Full quality by default.** Never strip down the build for weak GPUs; P is the fallback.
- **Ship every workstream three ways:**
  - the Vercel link
  - the artifact page `https://claude.ai/artifact/DytGBQdZUodMQxNiateJqt` (publish `/home/claude/bedsit/index.html` with `url` set to it)
  - `index_1.html` sent to him as a file
- **Git:** push only to branch `bedsit-sandbox` on `blacklanternpro/vault`. The repo is **public** (jsDelivr needs it). Per Jake's decision 8 it holds the minified build at the root AND the full source in `source/` (parts, `build.py`, shell, tests, this `HANDOVER.md`). Update both on every release.
- **Commit messages** end with the attribution lines the system gives the new session (Co-Authored-By plus Claude-Session).
- **Older docs:** the v4 plan doc is `https://claude.ai/artifact/2b7ad40c-7ac9-4c4e-a8eb-5d644f266e75` (history only). The v5 plan doc is above.
- **Tone:** he likes concise updates, dry humour in the game's text, and the "my pick" style for decisions.

## Rebuild the workspace
From this zip, or straight from the vault (`git clone -b bedsit-sandbox https://github.com/blacklanternpro/vault /home/claude/vault`, whose `source/src` and `source/test` are the same files as `src/` and `test/` here; the GLBs sit at the repo root):
```bash
mkdir -p /tmp/build2/{serve,deploy/site} /home/claude/bedsit
cp -r src/* /tmp/build2/ && cp test/* /tmp/build2/       # or: cp -r /home/claude/vault/source/src/* /home/claude/vault/source/test/* /home/claude/vault/*.glb /tmp/build2/
cd /tmp/build2 && npm install            # three, cannon-es, three-mesh-bvh, jsdom, canvas, terser
cp -r node_modules/three node_modules/cannon-es node_modules/three-mesh-bvh serve/   # local importmap targets
git clone -b bedsit-sandbox https://github.com/blacklanternpro/vault /home/claude/vault
python3 build.py
```

`build.py` concatenates `p1 p2 p3 p4 p5 p5b p8a p8b p8c p8d p8e p8f p6 p7` into `all.mjs`. All of them share **one module scope**. It writes three outputs:

| Output | What it is |
| --- | --- |
| `/home/claude/bedsit/index.html` and `index_1.html` | Standalone build, GLBs base64-embedded |
| `serve/index.html` | Local importmap version, for headless testing on `python3 -m http.server 8765 -d serve` |
| `deploy/game.src.mjs` | CDN build; GLBs load from `./hammer.glb` and `./saw.glb` beside it |

## Deploy pipeline
1. Minify, then check it parses:
   ```bash
   npx terser deploy/game.src.mjs --module --compress passes=2 --mangle -o deploy/game.min.mjs
   node --check deploy/game.min.mjs
   ```
2. Copy `game.min.mjs` into `/home/claude/vault`, and refresh `source/` (`p*.js`, `build.py`, `package.json`, `shell/`, tests, `HANDOVER.md`). Then commit and push `bedsit-sandbox`.
3. Check jsDelivr serves the new file: `https://cdn.jsdelivr.net/gh/blacklanternpro/vault@<sha>/game.min.mjs`. `cmp` it against `deploy/game.min.mjs`.
4. Build the shell: `shell/head.html`, then `<script type="module">await import('<jsdelivr url>');document.getElementById('load').style.display='none';</script></body></html>`. `src/shell/vercel-shell.html` is the current live one. If controls change, update the overlay table in `head.html`.
5. Deploy with `mcp__Vercel__create_deployment`:

   | Setting | Value |
   | --- | --- |
   | teamId | `team_6NahCTLDjZmfLULxSuxcyXtR` |
   | project | `prj_0ZeaY7okR3LEguH3Lzzb5u1FSLEA` (`bedsit-sandbox`) |
   | requestBody.name | `bedsit-sandbox` |
   | target | `production` |
   | projectSettings.framework | `null` |
   | files | `[{file:"index.html",encoding:"utf-8",data:<shell>}]` |
   | forceNew | `1` |
   | skipAutoDetectionConfirmation | `1` |

   The alias `bedsit-sandbox-jake1987king-1642s-projects.vercel.app` sits behind Vercel auth. Verify with `mcp__Vercel__web_fetch_vercel_url`; on a 403 team scope, run `authorize_team_access`.
6. Publish the artifact and send `index_1.html`.

**Current live build:** the jsDelivr URL in `src/shell/vercel-shell.html` is pinned to the live game commit; `git log` on `bedsit-sandbox` shows the release commits.

## Source map
| File | Contents |
| --- | --- |
| p1 | Boot, Drawable (dirty-rect canvas textures, `flushDrawables` max 3/frame), SoundEngine `S` (procedural SFX, loops, drones), Particles |
| p2 | Renderer, camera (fov 78), physics world, ents (`mkEnt/boxEnt`), `onCollide`, `floorPuddle` |
| p3 | Walls / studs / faces / batts / wiring / RCD (`tripBreaker`), pipes |
| p4 | `compoundEnt`, joints (`breakJoint`, `checkJoints`), `shatterEnt`, support / collapse |
| p5 | Apartment build: kitchen, living (sofa + TV wall), `buildDesk` (calls `buildCRT` and `buildTower`; chair at mx, dz+0.8), bed, bathroom, nook (armchair), doors, floor |
| p5b | Appliances: dents, E-use system, kin doors, power cords, fridge, TV (`TV`, `TVS` 320×180), PC tower (`PC`, `crtDraw` desktop at 512×384), kitchen fittings, microwave, kettle, toaster, `updateAppliances` |
| **p8a** | `MON` + `buildCRT` (21" FD monitor, screen ShaderMaterial mixing desktop canvas and `EX.rt`), `crtImplode`, `updateMonitor`, **the seat system**: `SEAT` (state: `active`, `at` = 'desk'/'couch', `def`, look offsets `ly/lp`), `SEATS.desk` (a seat is data: `can/keep/target/view/hint/onSit/onStand/look/down/up/wheel/key`), `sitDown(kind)`, `standUp`, `seatTarget`, `updateSeat`, `seatHold`. p7's input handlers route to `SEAT.def.*` while seated; p8c uses `SEAT.at==='desk'` |
| **p8b** | EXECUTIONER world: `EX` state object and render target (640×480), cell and observation room build (`exBuild`), paintable surfaces (`exSurf/splatAt/holeAt`), particles (`EXP`), gun viewmodel, human rigs (`mkHuman`, `poseKneel/poseStand`, `exAnimate/exPlace`), ragdolls (`exRagdoll`, ConeTwist joints, cuff P2P), gore (`exSever`, `exBurstHead`, `exOpenTorso`, `exWound`, bleeds, pools) |
| **p8c** | `EXA` (game audio through a speaker-sim bus; voice formant synth for screams and babble; sting; jingle), `EXT` (manifest audio hook), `VO` (speech synthesis), round reset, `exFire/exTrace/exHitPart/exKill`, scientist and prisoner brains, `exScript` (PA lines), endings, state machine `exGo` (boot → title → intro → play → endC/endD → boot; the `ad` state was removed in v5.2), HUD canvas, 2D screens, `renderExecutioner`, `rrect`, `wrapText` |
| **p8d** | v5.1 TV: `TVH` (854×480 program canvas, `tvhInit(w,h)` for the phone tier), `CHANNELS` (only 7 has content; others draw snow on `TVS`), `tvChannel`, `TVB` broadcast clock (always runs = live TV), **`TVREEL`** reel engine (`tvReelAdd({id,dur,draw(x,W,H,t),cues:[{t,fn}]})`; cues fire only while tuned in, so tuning in mid-ad skips past cues; split music beds into per-bar cues), `TVA` (TV speaker bus, inherits EXA's synth via `Object.create(EXA)`, stereo-panned from the TV's spot; `TVA.out()` = the current segment's track, killed by `tvCut()` on channel change/off), `tvSay` captions (`TVCAP`, DOM `#cap`, couch only) + speech (`VO.speak(text,'tv'/'tvm')`) or mumble when standing, OSD (banner/volume/mute/sleep), `TVL` room light (PointLight sampled from the picture), **`COUCH` + `SEATS.couch`** (can't-sit lines, look ±70°, fov 58), the remote (`buildRemote`, `remotePop` on a >3 m/s hit spits the door + two AAs, `remoteRefit`, `remoteCmd`, camera-held viewmodel), the TV's own CH ▲ button (E on the right third of the set). `TV_IDENT` (owl test card, 8 s), `tvTestCard`, `tvDrawOwl`, `tvText`, `tvHoot`. `tvReelDraw` scales a virtual 854×480 frame to the canvas, so segments always draw at 854×480. Couch extras: hold RMB = squint (fov 58→32), LMB = channel up. Recordings hook `TVT` (`audio/tv/manifest.json`, keys = segment ids: `ident hhpp1 gary toot bump quik hhpp2 swill hhpp3`; a recording replaces that ad's `snd` cues and speech, captions stay) |
| **p8e** | v5.2 ad engine + CH 7 reel: HHPP characters moved from p8c (`drawHound`, `drawLogo`, `drawCarer`, `drawCouch`), kit (`sst`, `adFine`, `adBurst`, `adSparkle`, `adGrade`…), music (`beatGrid`, `songCues` = one cue per bar, `IN` instruments, `sing`), `drawToon` (front-on cartoon person with poses, hair, hats, Gary's shine/chain/teeth, cans, needles), `drawEngine` (original ride-on engine with a painted porcelain face panel), and the ads: `AD_HHPP1` Soft Landing 30 s, `AD_HHPP2` Biscuit's Birthday 30 s, `AD_HHPP3` Knit One, Love One 30 s, `AD_TOOT` 45 s, `AD_GARY` 20 s, `AD_QUIK` 20 s, `AD_SWILL` 20 s, `AD_BUMP` 6 s. Reel (223 s): ident · hhpp1 · gary · toot · bump · quik · hhpp2 · swill · ident · hhpp3 · bump |
| **p8f** | v5.3 EXECUTIONER v2: `exBuildV2` (door opening in the right pier x 2.2–3.0 with jambs, wired-glass leaf `EX.doorLeaf` hinged at x 2.95 swinging to −1.5 rad into the control room, handle/lock/keypad, intake hatch in the left wall z 1.3–2.3 with a dark corridor, kneel marks painted on the floor and its pristine copy, console `NEXT SUBJECT` button under `EX.coverG`, cell-lights rocker, green glow light), `exV2Reset` (per-session state), subjects (`exSubjectLook` variety: build 0.85/1/1.25, skin, shaved/buzz/balding/pony, beard/moustache/stubble, teardrop/neck/knuckle tattoos, number; `TEMPER` defiant/pleading/praying/silent/laughing; `CHARGES`; `exSpawnSubject`, `exSubjectWalk`; `MARKS` = 3 painted + 3 fallback), walking (`exMove`, `exSolids` 2D boxes + circles, player r 0.22, eased 1.4 m/s, head bob, footsteps), `exV2Hit` (door glass cracks/stops bullets, handle 2 hits → `exBlowHandle`, keypad, button, cover), `exUseTarget`/`EX.use` (F), `exSubjectDone` (TEST COMPLETE banner), `exAlarm` (10 s klaxon + red strobe, game continues), `exEnterControl` (scientists cower + `BEG` lines), `exRagCap` (6 live ragdolls, oldest freezes: bodies removed, meshes stay; gibs capped at 48), pause menu (`exMenuToggle/Move/Pick`), `exDrawHUDv2` (prompt, banner, clipboard notes, menu). The old `endC`/`endD` states are unreachable now |
| p6 | Input state, player physics, `updateCamera`, `castRay` |
| p7 | Tools, `damageProp`, `crackScreen`, `bindInput` (seat routing: mousemove → `EX.look`, mousedown → `EX.trigger` / `EX.ads`, wheel → lean, R → `EX.reload`), `updateTools` (seat early-exit, E stands), main `loop` (`seatHold` instead of player physics while seated; `updateSeat` after `updateCamera`; viewmodel skipped while seated; `renderExecutioner()` after the main render), `window.__DEMO` exports (EX, SEAT, MON, EXA, sitDown, standUp, exStart, exGo, exFire, exReset, …) |

### Key EXECUTIONER facts (v2 shipped in v5.3; see p8f below)
- **Cell:**
  - Cell spans x −3..3, z −2.5..4.5, ceiling 3.0. The player camera sits at (0, 1.62, 3.3), facing −z.
  - The window wall is at z −2.5. The window opening is x ±2.2, y 1.05–2.45, with glass at z −2.68. The piers are 0.8 m wide at x ±2.6.
  - The prisoner kneels at (0, 0, 0.25).
- **Observation room:**
  - It spans z −2.85..−6.2. The console sits at z −3.08, 0.9 m high, with three monitors.
  - The locked door is in the back wall at x 2.25.
  - Scientists stand at z about −3.5 (Voss −1.35, Hale 0.05, Ames 1.4). Their panic targets are hide (−0.92, −3.42), door (1.92, −5.72) and hands-up (0.7, −5.85).
- **Ragdolls:** humans become ragdolls in `EX.world`, a separate cannon world. Static env boxes go in via `exStaticBox`. Ragdoll parts are collision group 2, mask 1, so parts don't collide with each other.
- **Raycasts:** call `EX.scene.updateMatrixWorld()` before raycasting. `exTrace` does this; there was a bug before it did.
- **Speech:** the PA uses `speechSynthesis` only when seated or within 3 m.

## Tests
Run from `/tmp/build2`; they read `all.mjs`. Each harness runs in jsdom + node-canvas with a mocked renderer.

| Harness | Covers |
| --- | --- |
| `harness.mjs`, `harness2.mjs`, `harness3.mjs` | Core demolition regressions |
| `harness5.mjs` | Appliance features |
| `harness6.mjs` | Every assembly survives a wake; cords stay plugged |
| `harness12.mjs` | Cords stay plugged for 10 s |
| `tvperf.mjs` | Per-segment CPU draw cost of the reel (node-canvas is ~3× slower than a browser) |
| `harness_ex2.mjs` | v5.3 EXECUTIONER v2: walking + collision, F on the locked handle, door glass stops bullets, handle shot twice opens the door, walking into the control room (scientists cower), cover + NEXT SUBJECT, intake walk to a free mark, lights, clipboard notes, completion banner, alarm without game over, ragdoll cap, menu new session, quit + relaunch. `pw_ex2.py` takes the matching browser shots (`ONLY=hatch` for one) |
| `harness_tv.mjs` | v5.1 couch + TV: sit via E, look clamp, full-rate redraw, channels/volume/mute/sleep, reel captions, room light, power, TV CH button, remote pop + refit, can't-sit lines, desk still works, tipped couch. `tvart.mjs <t…>` dumps CH 7 frames at those reel times to `tvart.png` (needs `game_test_tv.mjs`, written by `harness_tv.mjs`); `sofawake.mjs` checks the sofa wakes without cushions jumping |
| `harness_ex.mjs` | Full EXECUTIONER flow. Its renderer mock adds `setRenderTarget/getRenderTarget/getClearColor/getClearAlpha/setClearColor`; its step adds `updateSeat` and `renderExecutioner` |

**Headless Chromium:**
- Use Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (the path moved; `ls /opt/pw-browsers` if it moves again) with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- It is **very slow**, roughly 1–3 s per frame. Drive states directly (`D.exGo('ad'); EX.st=13`; force `D.PC.t=5` to skip the boot) instead of waiting for real time. `pw_ex.py` shows the pattern.
- `pw_tv.py` captures the couch, CH 7, OSD, a sweep through every reel segment (watch for `tv cue` warnings) and room-light shots; `pw_tv2.py` is the quick couch + squint check. `node tvart.mjs out.png <reel seconds…>` renders reel frames headless (no browser).
- `pw9.py` captures appliance shots and `pw_min.py` smoke-tests the minified shell; serve `deploy/site` on port 8766 for that.

## Locked decisions (still in force)
1. **Audio:** procedural Web Audio plus captions first. Optional `fetch()` hooks for FAL mp3s dropped into the Vercel directory; no base64 audio in `index.html`. EXECUTIONER's hook is `audio/executioner/manifest.json`; the TV hook will be `audio/tv/manifest.json`.
2. **Gas explosion (Phase 4):** unlit burners, or a sawn copper gas pipe, plus any spark makes a fireball. Sparks include:
   - a cut wire arc
   - the saw on metal
   - a light switch
   - metal arcing in the microwave

   The blast wave blows drywall chunks off the studs and shatters glass. `SPARK_HOOKS`/`onSpark` already exist.
3. **Bond meter (Phase 5):** `BOND: $1,840`, itemised deductions going negative, and an INSPECTION THURSDAY notice at $0.
4. **Desk monitor:** done, now a 21" G500-class FD flat-screen. Jake asked for a big, heavy, great screen, so the game renders at 640×480 (this replaced the old 256×192 guardrail).

## Guardrails
1. **No `three-bvh-csg` in the frame loop.** Build things as multi-part compound assemblies.
2. **Dentable meshes stay out of StaticBatch** (`noBatch: true`).
3. **Screens redraw only while visible:**
   - The TV is 24 fps at 320×180 normally; the v5 ad channel is 854×480 (640×360 on phones).
   - EXECUTIONER is 640×480: every frame while seated, 24 fps when only visible.
4. **Content line:**
   - Gore is the softest guardrail: lean into detail and layers (Soldier of Fortune / Manhunt lineage, multi-layered, never cheap shock).
   - The railway ad is dark comedy with no harm shown to kids.
   - All brands are invented: MERIDIAN, Compliance Interactive, Toot Toot Junction, Windoze. No real logos, and no famous cartoon trains.

## Remaining phases after v5
- **Phase 2 rest:** thrash metal, news (corporate bonuses) and homely sitcom channels. They slot into the v5 channel system: add `CHANNELS[n]={name,reel:true}` plus a reel per channel (today `TVREEL` is CH 7's; generalise to one reel per channel).
- **Phase 4:** gas stove and explosion.
- **Phase 5:** vibe pack (bond meter, answering machine, neon SWILL sign, 2 a.m. lighting toggle, guitar and amp, swing-anything, clutter, ambience, ceiling fan).

## Gotchas learned the hard way
- **The sofa's backrest was on the TV side until v5.1** (frame back part at local z +0.325 while the cushions sat as if facing west). v5.1 moved it to −0.325 and resized the cushions so nothing overlaps; a wake no longer kicks them off.
- **Shared module scope:**
  - Duplicate top-level names are a SyntaxError (`_m4`, `_vx` already clashed; p8b uses `_hvx`/`_hm4`).
  - Duplicate `function` declarations also break; replace a function, never redeclare it.
  - After every build, run `node --check all.mjs`.
- **Sleeping cannon bodies** report garbage constraint multipliers. Skip force checks on sleeping bodies.
- **Thin rods** need fattened colliders and mass.
- **Headless aiming:** after setting yaw/pitch, wait frames before raycasting. Camera shake moves the aim between hits.
- **Screen glass:** glass with `screenHit` routes through `crackScreen` before the generic glass branch, in `damageProp` and the kick.
- **node-canvas** has no `Path2D` and may lack `roundRect`. Use the `rrect` helper and plain path functions.
- **Don't `pkill -f <script name>`:** it can kill your own shell. Kill by PID.
- **Speech:** `speechSynthesis` isn't routable through Web Audio, so it is not positional. Keep it to seated or near-device use.
