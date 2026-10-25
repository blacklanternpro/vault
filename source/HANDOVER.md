# BEDSIT — handover brief (25 Oct 2026, v6.2: the basement, B1, on `?villa`)

Read this first, then `src/`. This bundle holds the full source. The public vault repo only holds the minified build.

## START HERE — the next job (v6: the villa)

**The bedsit is being replaced by a house.** Jake: "We are quickly outgrowing our boots here in the bedsit… Our base. Our home of destruction." The v6 plan is a Claude Docs doc: https://claude.ai/artifact/SZXbwtYLu7GA6BX5h5JpuA. Read it before writing code. Phase 4 (gas stove) and Phase 5 (vibe pack) are parked and fold into villa workstreams 3 and 7; the optimisation pass comes after move-in.

**4/23 Banksia Court:** a 3-bed, 2-bath (ensuite off the master) brick-veneer villa, built 1987, cheap early-2000s refit; slab with carpet, vinyl and tiles; single garage, no car; fenced yard; rented through Gary's Property Group; about 154 m². All ten plan decisions are locked in the doc.

| WS | Scope | Status |
| --- | --- | --- |
| 0 | Plan as data, empty walkable shell, lazy wall insides, perf gate | **Shipped as v6.0 on `?villa`**; waiting on Jake's 4060 fps |
| 0.1 | Jake's v6.0 notes: slits at wall junctions; manholes into the roof (hall + garage), hinged covers, climb up | **Shipped as v6.1** |
| 0.2–0.4 | The basement (plan doc: https://claude.ai/artifact/CpySC2QWBRcoYqFcgHQjDS, all picks approved): B1 dig it, B2 fill it, B3 make it creepy | **B1 shipped as v6.2**; B2 next |
| 1 | Shell: doors, skirting, cornice, floor finishes, windows that open | next |
| 2 | Services: wiring, switches, plumbing, gas, hot water | |
| 3 | Kitchen, dining, laundry + Phase 4 gas stove | |
| 4 | Bathrooms | |
| 5 | Living + office: move the couch/TV and desk/PC/EXECUTIONER | |
| 6 | Bedrooms, garage, outside | |
| 7 | Lived-in pass + Phase 5 vibe pack | |
| 8 | Move in (villa becomes the default, bedsit retired), then the optimisation pass | |

**Perf gate (per workstream):** 60 fps on Jake's RTX 4060, ≤300 draw calls, ≤900 active bodies. Swiftshader frame times mean nothing; use calls/tris/bodies from `pw_villa.py` and Jake's real number.

**The villa lives behind a flag until move-in:** `?villa` (or `window.__VILLA=true`). Without it the game is the bedsit, unchanged. See the p9v row and "The villa" section.

### v5 (done, kept for reference)

**v5 is done** (all five workstreams shipped on 24 Oct 2026), and **v5.6 added the rest of Phase 2: the TV channels** (CH 2 news, CH 5 sitcom, CH 9 metal; see the source map). Jake's order from here: finish the whole upgrade scope first (Phase 4 gas stove, then Phase 5 vibe pack, see "Remaining phases"), **then** an optimisation and polish pass. The v5 plan lives in a Claude Docs doc: https://claude.ai/artifact/A4mQ6PNGcfnCMCFcSNsw2Z. Read the doc before writing code; it has the detail for each workstream.

| Order | Workstream | One line | Status |
| --- | --- | --- | --- |
| 1 | Sit down and watch TV | Generalise `SEAT` (p8a) into a seat system: couch + desk, remote control, captions while seated | **Shipped as v5.1** |
| 2 | Ad channel | Move Happy Happy Play Place off the PC onto TV CH 7 "ADS ALL NIGHT" (see below) | **Shipped as v5.2** |
| 3 | EXECUTIONER v2 | Walk around, no game over, glass security door, control room, NEXT SUBJECT button | **Shipped as v5.3** |
| 4 | People and gore fidelity pass | One continuous bending mesh per person, real faces and expressions, clothing, layered gore | **Shipped as v5.4** |
| 5 | Mobile controls | Touch layout for every tool, both seats and the game; phone quality tier | **Shipped as v5.5**; Vercel link made public |

**Jake locked the decisions on 24 Oct 2026** (section 6 of the doc):
1. **F** = in-game use at the desk (buttons, door lock, clipboards); **E** = stand up.
2. **Extra ads:** Gary's Property Group, QUIKCASH and SWILL.
   - Gary is the cliché greasy real estate agent: slicked hair, shiny suit, gold chain, too-white teeth, finger guns, a convertible, "Inspections every Thursday!".
   - SWILL is "SWILL… it's ADDICTIVE": a man drinking faster and faster until he's slumped blind drunk in a sea of empties.
3. **Ad channel resolution:** 854×480 widescreen 480p on desktop, 640×360 on the phone tier.
4. **Six ragdoll bodies** at once, then the oldest freezes.
5. **One continuous bending skin per person,** but ONLY if dismemberment, open torsos and good layers of gore all survive it. Prototype that first; fall back to separate parts with rounded joint caps if not.
6. **Make the Vercel link public:** done with v5.5 (Vercel Authentication turned off for production).
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

`build.py` concatenates `p1 p2 p3 p4 p5 p5b p8a p8b p8c p8d p8e p8h p8i p8j p8f p8g p9m p9v p9b p6 p7` into `all.mjs`. All of them share **one module scope**. It writes three outputs:

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
| **p8d** | v5.1 TV: `TVH` (854×480 program canvas, `tvhInit(w,h)` for the phone tier), `CHANNELS` (`{name,reel}` per channel: 2 news, 5 sitcom, 7 ads, 9 metal; the rest draw snow on `TVS`), `tvChannel`, `TVB` broadcast clock (always runs = live TV), reel engine: every channel owns a reel (`mkReel()`; `TVREEL` is CH 7's), all on the one broadcast clock so every channel is live; `tvReel()` = the tuned channel's reel; `tvReelAdd({id,dur,draw(x,W,H,t),cues:[{t,fn}]},reel)`; cues fire only while tuned in, so tuning in mid-ad skips past cues; split music beds into per-bar cues), `TVA` (TV speaker bus, inherits EXA's synth via `Object.create(EXA)`, stereo-panned from the TV's spot; `TVA.out()` = the current segment's track, killed by `tvCut()` on channel change/off), `tvSay` captions (`TVCAP`, DOM `#cap`, couch only) + speech (`VO.speak(text,'tv'/'tvm')`) or mumble when standing, OSD (banner/volume/mute/sleep), `TVL` room light (PointLight sampled from the picture), **`COUCH` + `SEATS.couch`** (can't-sit lines, look ±70°, fov 58), the remote (`buildRemote`, `remotePop` on a >3 m/s hit spits the door + two AAs, `remoteRefit`, `remoteCmd`, camera-held viewmodel), the TV's own CH ▲ button (E on the right third of the set). `TV_IDENT` (owl test card, 8 s), `tvTestCard`, `tvDrawOwl`, `tvText`, `tvHoot`. `tvReelDraw` scales a virtual 854×480 frame to the canvas, so segments always draw at 854×480. Couch extras: hold RMB = squint (fov 58→32), LMB = channel up. Recordings hook `TVT` (`audio/tv/manifest.json`, keys = segment ids: CH 7 `ident hhpp1 gary toot bump quik hhpp2 swill hhpp3`, CH 2 `nw_open nw_lead nw_field nw_int nw_vox nw_mkt nw_close`, CH 5 `gh_theme gh_act1 gh_act2 gh_tag gh_promo`, CH 9 `nbb_open nbb_song1 nbb_talk nbb_song2 nbb_end`; a recording replaces that ad's `snd` cues and speech, captions stay) |
| **p8e** | v5.2 ad engine + CH 7 reel: HHPP characters moved from p8c (`drawHound`, `drawLogo`, `drawCarer`, `drawCouch`), kit (`sst`, `adFine`, `adBurst`, `adSparkle`, `adGrade`…), music (`beatGrid`, `songCues` = one cue per bar, `IN` instruments, `sing`), `drawToon` (front-on cartoon person with poses, hair, hats, Gary's shine/chain/teeth, cans, needles), `drawEngine` (original ride-on engine with a painted porcelain face panel), and the ads: `AD_HHPP1` Soft Landing 30 s, `AD_HHPP2` Biscuit's Birthday 30 s, `AD_HHPP3` Knit One, Love One 30 s, `AD_TOOT` 45 s, `AD_GARY` 20 s, `AD_QUIK` 20 s, `AD_SWILL` 20 s, `AD_BUMP` 6 s. Reel (223 s): ident · hhpp1 · gary · toot · bump · quik · hhpp2 · swill · ident · hhpp3 · bump |
| **p8h** | v5.6 CH 9 METAL OVERNIGHT: NO BOND BACK live at the Rathole (123.6 s: ident, "Inspection Thursday", banter, "Skirting Board Massacre", guitar smash + end card). One stage in world units (1000×560) shot through `nbbCam` (shots `NBB_SHOT`: wide, singer, guitar, bass, drums, fretboard, low; plus `nbbCrowdPOV`), cutting on bar lines. Songs are data (`nbbSong(id,bpm,plan,riff,vox,shots)`): riffs are 16-char strings (lower case palm-muted, upper case open power chord, `-` hold, `.` rest), `nbbPlayBar` sequences guitars/bass/drums/growls per bar, `nbbState` derives headbangs, strobes, pyro and the crowd surfer from the same timing. Sound: per-track distortion amps (`nbbAmp`: gtr/lead/vox), `nbbGtr`, `nbbLead`, `nbbGrowl`/`nbbGang`, `nbbCrowd`/`nbbCheer`/`nbbBoo`. `nbbH(n)` is a shared hash (p8i uses it too) |
| **p8i** | v5.6 CH 2 NIGHT DESK (148.5 s): open, lead (record bonuses; full-screen bonus card), live cross outside Kestrel Tower (CEO Bradley Oakes: "No comment… I'm humbled", limo), the interview ("not me, specifically"), vox pops, the Bonus Index board, sign-off + credits; a ticker crawls throughout off the broadcast clock. Lines are data (`nwL`), `nwSpeech` makes the cues, `nwTalking`/`nwMouth` move mouths while a line is up (p8j reuses them). Heavy backgrounds are baked once into `NW_C` canvases (studio, skyline, tower, headshot) |
| **p8j** | v5.6 CH 5 FAMILY CLASSICS: THE GOODHEARTS, "Pancake Sunday" (124.2 s): theme song + cast freeze-frames, act one in the kitchen (the pancake goes to the ceiling, then Dad's head), act two in the living room (the vase, the lesson, the group hug, "Every single week."), credits + next week, station promo. 4:3 pillarboxed (`ghShot` clamps cameras to the set and lays the baked `ghGrade` overlay on top), studio audience synth (`ghLaugh`, `ghAww`, `ghWoo`, `IN.applause`; `ghReact` adds the caption) |
| **p8f** | v5.3 EXECUTIONER v2: `exBuildV2` (door opening in the right pier x 2.2–3.0 with jambs, wired-glass leaf `EX.doorLeaf` hinged at x 2.95 swinging to −1.5 rad into the control room, handle/lock/keypad, intake hatch in the left wall z 1.3–2.3 with a dark corridor, kneel marks painted on the floor and its pristine copy, console `NEXT SUBJECT` button under `EX.coverG`, cell-lights rocker, green glow light), `exV2Reset` (per-session state), subjects (`exSubjectLook` variety: build 0.85/1/1.25, skin, shaved/buzz/balding/pony, beard/moustache/stubble, teardrop/neck/knuckle tattoos, number; `TEMPER` defiant/pleading/praying/silent/laughing; `CHARGES`; `exSpawnSubject`, `exSubjectWalk`; `MARKS` = 3 painted + 3 fallback), walking (`exMove`, `exSolids` 2D boxes + circles, player r 0.22, eased 1.4 m/s, head bob, footsteps), `exV2Hit` (door glass cracks/stops bullets, handle 2 hits → `exBlowHandle`, keypad, button, cover), `exUseTarget`/`EX.use` (F), `exSubjectDone` (TEST COMPLETE banner), `exAlarm` (10 s klaxon + red strobe, game continues), `exEnterControl` (scientists cower + `BEG` lines), `exRagCap` (6 live ragdolls, oldest freezes: bodies removed, meshes stay; gibs capped at 48), pause menu (`exMenuToggle/Move/Pick`), `exDrawHUDv2` (prompt, banner, clipboard notes, menu). The old `endC`/`endD` states are unreachable now |
| **p8g** | v5.4 people + gore. **One continuous skin per person:** every rig part keeps its hit proxy (material `visible:false`, still raycast and still driven by the pose code / ragdolls); `exSkinHuman` builds one `THREE.Skeleton` whose bones *share* the proxies' `matrixWorld` objects (no per-frame copy) and one `SkinnedMesh` piece per segment at the scene root, with each piece's ends weighted into its neighbours (proximal 0.5 to the parent, distal 0.42 to the child; torso↔pelvis). `exSkinSever` cuts those weights when a limb comes off; `exSkinDispose` on round clear. Shaped geometry shared by proxy + skin (`exLimbGeo`, `exTorsoGeo`, `exPelvisGeo`, `exSkullGeo`) so wound UVs line up. Heads: `exHeadBuild` (sculpted skull, 256 px `txFace2` painted to the sculpt via `fUV`, eye spheres, lids, ears, mouth group) + `exFaceUpdate` (blink, talk via `H.talkT` set in `exSay`, scream via `exScream` → `H.screamOT`, squeeze on hit, slack/half-lidded dead). `exHandMesh` (mitten + thumb, clenched when cuffed), `exShoe` (soles), `exDress` (collar, rolled sleeves, lapels, lanyard + ID, split coat back). Gore: `exExitWound` (raycasts back through the proxy for the exit, big ragged wound + spray + splat behind), `exSoak` (blood spreads through cloth over ~3 s), `exHeadGraze` (an off-centre head hit on the living grazes), `exHeadChunk` (first corpse head hit takes the jaw or a skull piece; the second bursts it), layered `exCap` stumps, `exOpenTorso` (ribs, sternum, lungs, heart, fat rim, verlet gut loops `exUpdateGuts`), irregular wet Phong pools, `exUpdateSmears` (body sliding on the floor), directional spatter in `splatAt`, wrapped `EXA.scream/flesh` + `EXA.crunch/deathRattle`. Debug: `window.__EXVIEW=true` renders the game camera full-screen; `EX.dbgCam` (Vector3) pins the game camera |
| **p9m** | v5.5 mobile (see the mobile section) |
| **p9v** | v6 villa (see "The villa"). `VP` = the plan (rooms as plan-metre rectangles, `open` pairs, `openings`, `spawn`), `vX/vZ` plan→world, `VROOM`, `vRoomAtWorld`; `villaWalls` derives walls from shared room edges (`VW.walls/ext`); `vFaceCanvas/vFaceCols/vFaceRows` (sheets that skip slivers near openings); `villaBrickLines/villaBricks` (one brick skin per side, holes at openings); `villaWake(w)`; `villaFloor` (one painted floor drawable, 48 px/m), `villaCeiling` (one face for the whole house), `villaRoof` (hip, 22.5°), `villaOpenings` (merged liners + bronze frames, glass panes are ents), `villaOutside`, `villaLights`/`villaLightPick`/`updateVilla` (pool of four PointLights), `buildVilla`, `villaAfterBoot` |
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

## Mobile (v5.5, p9m)
- **Detection:** `TOUCH` in p2 (`(pointer:coarse)`, or touch events plus `maxTouchPoints`). `const TOUCH_ON=true` is the kill switch: set it `false` and the game behaves exactly like desktop.
- **Phone tier:** `QTIER='phone'` on touch. Pixel ratio is capped at 1.5, the shadow map is 1024 with one shadow light, minor lamps are off, `mkDrawable` canvases are capped at about 1 Mpx and the TV ad channel renders at 640×360. The panel's QUALITY button cycles phone → full → perf (`qualityCycle`).
- **Input:** everything goes through the p7 entry points `inKey/inDown/inUp/inLook/inPull/inWheel`, so touch never re-implements game logic.
  - Left half of the screen is a floating stick that drives `keys.W/A/S/D` (pushed to the rim it sprints).
  - Right half is look-drag (`inLook`).
  - Holding ACT or ALT turns a right-half drag into the pull for prying and ripping (`inPull`; look freezes while held).
  - Mouse events are ignored on touch unless the pointer is locked, because phones fire synthetic mouse events after touches.
- **Buttons** (`#mob`, contextual via `mobileRelabel` every frame):
  - Walking: ACT (LMB), ALT (RMB), USE (E), KICK, JUMP, CROUCH, TOOL (tap cycles, hold opens the radial picker), ≡ panel.
  - Couch: CH ▲ / SQUINT / STAND / CH ▼ / PWR / VOL.
  - Desk: FIRE / SIGHTS / RELOAD / USE (F, shown when the prompt is up) / STAND / ≡ (Tab menu; then SELECT and the stick move it).
- **Entering:** the overlay tap calls `mobileEnter` (Android fullscreen + landscape lock; iOS ignores both, so a rotate card shows in portrait).
- **Untested on a real iPhone/Android.** `pw_mob.py` and `pw_mob3.py` run Chromium phone emulation (844×390, touch, CDP touch events) only.

## The villa (v6, p9v)
- **Flag:** `VILLA` (p2) is true for `?villa` or `window.__VILLA`. p7 `buildWorld` calls `buildVilla()` instead of the bedsit; the loop calls `updateVilla(dt)`; the fridge loop is skipped. p3 empties `WALLS` after `mkCeiling` in villa mode.
- **Plan:** offset ox −8.8, oz −4.9 (plan metres → world). Rooms in p9v `VP.rooms`; the built layout differs from the doc's first drawing (entry corridor 1.2 m wide, office at the front, bath lobby with the WC and basin). Internal walls are trimmed 0.11 at T-junctions.
- **Dormant walls (the big perf idea):** studs, plates, noggins, batts and screws exist as data only, with no body, mesh or screw instance (`mkEnt` honours `dormant`). The first time a wall is opened up (`detachChunk`, `shardChunk`, `liftChunk`, a saw kerf) `villaWake(w)` registers its bodies, builds a per-wall StaticBatch (`batchRef`) and instances its screws. One wake ≈ +23 bodies, +172 screws.
- **Lazy screws:** `addScrew` stores screws with `id:-1` on dormant walls; `screwInstance` gives them an InstancedMesh slot later. Raycasts map instance ids through `SCREW_IDX`. `SCREW_MAX` is 16000 in villa mode.
- **Lights:** a HemisphereLight (ground colour = fake bounce light; without it every ceiling and door head far from a lamp goes black), ambient, a dim moon, and a pool of four PointLights that hop to the fixtures nearest you every 0.15 s (`pool[0]` always sits in your room and is the only shadow caster).
- **Load numbers (empty house):** 317 bodies (bedsit 775), 46 walls, 73 faces, 2,627 sheet chunks, 788 dormant timber pieces, 160 batts, 7,743 screws (0 instanced), 10.2 Mpx of canvas, 60–248 draw calls depending on the view, 104k–192k triangles, headless boot about 3–4 s (bedsit about 11 s). 0 chunks fall at load.
- **Wall junctions (v6.1):** `vTrimWalls` gives each overlapping square at a junction to one wall: a wall that merely ends there is cut back; at a corner where both end, it cuts whichever leaves no end face showing into a room (v6.0's rule cut walls that only touched another wall's line and left 17 slits of 11 cm into the cavity). The ends that really are open (4 of them, at open-plan doorways) are listed in `VW.freeEnds` and wrapped by `villaEndCaps` (a plaster strip, merged static mesh: it does not fall when the wall is gutted).
- **Roof space (v6.1):** `VP.manholes` (hall at plan x≈10, garage at x≈2.25) are 600 square holes in the ceiling face, edges on joist centrelines (no slivers), with trimmers (noggins) either end. `villaManholes` builds the trim ring (merged) and a cover per hole: an ent driven by the bedsit's `kinDoor` (E = OPEN/CLOSE MANHOLE, hangs down 1.5 rad) whose `onHit` counts damage and `villaBreakCover` smashes it into four pieces at 2.6. Opening or breaking a cover wakes the ceiling (`villaWake(VW.ceiling)`: 30 joist bodies, ~1,850 ceiling screws instanced). `villaRoofSpace` adds rafters/jacks at 600, hips, ridge, underpurlins and struts onto the hallway walls (two merged meshes, one static compound collider) and hip-end roof colliders; `villaRoofUnder` draws the tile undersides and battens (the outside roof is FrontSide now).
- **Climbing (v6.1):** `villaPlayer(dt)` runs at the top of `updatePlayerPhysics` in villa mode. Under an open hole, with your eye within 38 cm of the ceiling and your last ground at least 18 cm up (`player.lastGroundY`, from `groundCheck`), SPACE runs `villaClimb`: a scripted 0.85 s lift through the hole and 0.6 m forward onto the joists (player collisions off meanwhile). In the roof, CROUCH over the hole drops you back down. `groundCheck` counts ceiling sheet bodies (group 16) in villa mode, and `updateCamera` clamps the eye height to the headroom above (so the camera never pokes through a ceiling, rafter or roof). In the roof, `updateVilla` fades the house lights and the bounce light so the only light is what comes up through the hole (or the torch). Something to stand on: `villaProps` puts a platform ladder in the garage and a milk crate in the hall.
- **The basement (v6.2, p9b):** a 1987 fallout shelter 2.6 m under the house (`BF`=-2.6 floor, `BC`=-0.3 ceiling = slab underside). `VB` is a second plan (rooms stairs, airlock, bunk, plant, tunnel, escape; `ops` openings; `holes` in the house floor; `stair`). `villaFloor` cuts the two holes (`vbFloorShape`) and builds the slab collider as boxes around them (`vbFloorBody`); the lawn plane and the yard's ground collider now stop at the house footprint (the old 60 m ground box ran through the basement). `vbEntries` (built with the house): steel angle frames + slab edges, the garage hatch (0.9 × 1.9 m chequer plate, `kinDoor`, E = heave/close; padlock ent with `onHit` (4.5 damage) and `onSawn` → `vbBreakLock`), the master trapdoor (plywood, ring pull) under a carpet panel cut from the floor canvas (`onTap` hollow → `found`, E peels it back as a `kinDoor`; `onSawn` → `vbCarpetGone`; from below the trapdoor only lifts a few cm while the carpet is down, two hits slit it). `villaBasement()` builds everything else the first time the lock goes or the carpet goes (about 0.3–0.4 s): walls from shared edges (`vbSegments`: room|room = stud + fibre-cement faces, dormant; room|earth = concrete block (`vbBlocks`, one instanced mesh, blocks cut to openings, `vbChipBlock` on heavy hits); tunnel|earth = timber lagging (`vbLagging`)), floor drawable (puddles find it via `floorPuddle(..., y)`), slab-underside ceiling, I-beams, four props (`compoundEnt`, wake at 1.6, groan + dust), the steel airlock door, the welded door, stairs + landing (`vbStairs`; the ramp collider ignores the player), the ladder ent (`vbLadder`, E climbs via `vClimbPath`), lights (`vbLights`: battens with pull-cord ents, bulbs; `VL.fix` entries with `lvl:'b'`, `villaLightPick` only picks the level the camera is on). Per frame `vbUpdate`: the basement meshes hide when both hatches are shut and you're upstairs; underground the house hides except the garage and master rooms, floor, ceiling and the entries (draw calls); `vbOnStairs` moves the player on the treads (a ball can't walk a 55° stair).
- **Tests:** `harness_basement.mjs` (padlock, lazy build, hatch, stairs down/up, steel door, lights below, block chip, props, puddle, trapdoor from below, ladder both ways, hiding); `pw_basement.py [shots…]` (browser shots `b_<shot>.png`).
- **Tests:** `harness_villa.mjs` (counts, walking, shards a hall|living sheet and checks the wall wakes, then v6.1: junction overlaps + open ends, manholes, floor jump can't reach, crate climb, walking the joists, dropping back down, smashing the garage cover, low-roof eye clamp; writes `game_test_villa.mjs`); `pw_villa2.py [shots…]` (v6.1 browser shots `v2_<shot>.png`: junction, cap, arch, mh_closed, mh_open, climb, roof, roof2, garage); `pw_villa.py [spots…]` (browser shots `v_<spot>.png` plus calls/tris/bodies; spots entry, hall, kitchen, living, master, bath, garage, front, back, halldoor, halldoor2; `NOSHADOW=1` for perf mode).

## Tests
Run from `/tmp/build2`; they read `all.mjs`. Each harness runs in jsdom + node-canvas with a mocked renderer.

| Harness | Covers |
| --- | --- |
| `harness.mjs`, `harness2.mjs`, `harness3.mjs` | Core demolition regressions |
| `harness5.mjs` | Appliance features |
| `harness6.mjs` | Every assembly survives a wake; cords stay plugged |
| `harness12.mjs` | Cords stay plugged for 10 s |
| `tvperf.mjs` | Per-segment CPU draw cost of the reels: `CH=2,5,9,7 node tvperf.mjs` (node-canvas is CPU cairo; a browser canvas is usually much faster) |
| `pw_ch.py` | v5.6 browser sweep of channels (`python3 pw_ch.py 2 5 9 7`): tunes each one on the couch and steps through every segment so every cue fires against a real AudioContext; prints the per-segment browser draw cost and the caption count, screenshots `c<ch>_*.png` |
| `harness_ex2.mjs` | v5.3 EXECUTIONER v2: walking + collision, F on the locked handle, door glass stops bullets, handle shot twice opens the door, walking into the control room (scientists cower), cover + NEXT SUBJECT, intake walk to a free mark, lights, clipboard notes, completion banner, alarm without game over, ragdoll cap, menu new session, quit + relaunch. `pw_ex2.py` takes the matching browser shots (`ONLY=hatch` for one) |
| `pw_gore.py` | Full-screen game-camera shots of faces, scientists, a scream, severed arm, open torso, head chunk, pools and the intake walk (uses `__EXVIEW` + `EX.dbgCam`) |
| `harness_tv.mjs` | v5.1 couch + TV: sit via E, look clamp, full-rate redraw, channels/volume/mute/sleep, reel captions, room light, power, TV CH button, remote pop + refit, can't-sit lines, desk still works, tipped couch. `tvart.mjs <t…>` dumps frames at those reel times (`CH=9 node tvart.mjs out.png 12 30` for another channel) to `tvart.png` (needs `game_test_tv.mjs`, written by `harness_tv.mjs`); `sofawake.mjs` checks the sofa wakes without cushions jumping |
| `pw_mob.py`, `pw_mob2.py`, `pw_mob3.py` | v5.5 phone emulation: touch class + pixel ratio, TAP TO ENTER, look drag, stick walking, tool cycling, couch buttons (`pw_mob2`), desk FIRE/in-game walking/menu (`pw_mob3`). Screenshots `m_*.png` |
| `harness_ex.mjs` | Full EXECUTIONER flow. Its renderer mock adds `setRenderTarget/getRenderTarget/getClearColor/getClearAlpha/setClearColor`; its step adds `updateSeat` and `renderExecutioner` |

**Headless Chromium:**
- Use Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (the path moved; `ls /opt/pw-browsers` if it moves again) with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- It is **very slow**, roughly 1–3 s per frame. Drive states directly (`D.exGo('ad'); EX.st=13`; force `D.PC.t=5` to skip the boot) instead of waiting for real time. `pw_ex.py` shows the pattern.
- `pw_tv.py` captures the couch, CH 7, OSD, a sweep through every reel segment (watch for `tv cue` warnings) and room-light shots; `pw_tv2.py` is the quick couch + squint check. `node tvart.mjs out.png <reel seconds…>` renders reel frames headless (no browser).
- `pw9.py` captures appliance shots and `pw_min.py` smoke-tests the minified shell; serve `deploy/site` on port 8766 for that.

## Locked decisions (still in force)
1. **Audio:** procedural Web Audio plus captions first. Optional `fetch()` hooks for FAL mp3s dropped into the Vercel directory; no base64 audio in `index.html`. EXECUTIONER's hook is `audio/executioner/manifest.json`; the TV hook is `audio/tv/manifest.json` (keys in the p8d row).
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
Phase 2 is done (v5.6). Phases 4 and 5 are parked and now ride along with the villa (WS 3 and WS 7). The optimisation and polish pass comes after move-in.
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
