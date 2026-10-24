# bedsit-sandbox

BEDSIT — a browser first-person demolition sandbox (Three.js + cannon-es). Built for BAD FORM.

This branch holds:

- `game.min.mjs`, `hammer.glb`, `saw.glb` — the live build, served through jsDelivr to the Vercel shell.
- `source/` — a full backup of the game's source: the module parts (`source/src/p*.js`), `build.py`, the Vercel shell, the test harnesses, and `HANDOVER.md` (start there).

To rebuild: copy `source/src/*` and `source/test/*` into a working folder, copy `hammer.glb` and `saw.glb` from the repo root next to them, `npm install`, then `python3 build.py`. `HANDOVER.md` has the full pipeline.
