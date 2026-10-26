#!/bin/bash
# usage: release.sh "<commit title>" "<commit body>"  — builds, minifies, pushes vault (build + source/), waits for jsDelivr, writes the pinned shell
set -e
B=/tmp/build2; V=/home/claude/vault; VS=$V/source
cd $B && python3 build.py >/dev/null && node --check all.mjs
npx terser deploy/game.src.mjs --module --compress passes=2 --mangle -o deploy/game.min.mjs && node --check deploy/game.min.mjs
cp deploy/game.min.mjs $V/; cp p*.js build.py package.json release.sh $VS/src/; cp -r shell $VS/src/; cp harness*.mjs boot81.mjs runall.sh pw*.py tvart.mjs tvperf.mjs sofawake.mjs $VS/test/  # HANDOVER.md is edited in place at $VS/HANDOVER.md
cd $V; git add -A; git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "$1

$2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Cd9GTmTEqAnGDvbyGDjSzx"; git push -q origin bedsit-sandbox; SHA=$(git rev-parse HEAD); echo SHA=$SHA
cd $B; ok=0; for i in $(seq 1 12); do curl -sS -o deploy/jsd.mjs "https://cdn.jsdelivr.net/gh/blacklanternpro/vault@$SHA/game.min.mjs" || true; if cmp -s deploy/jsd.mjs deploy/game.min.mjs; then ok=1; break; fi; sleep 10; done; echo JSDELIVR_OK=$ok
python3 - "$SHA" <<'PY'
import sys
SHA=sys.argv[1];h=open('/tmp/build2/shell/head.html').read()
s=h+"<script type=\"module\">await import('https://cdn.jsdelivr.net/gh/blacklanternpro/vault@"+SHA+"/game.min.mjs');document.getElementById('load').style.display='none';</script></body></html>"
open('/tmp/build2/shell/vercel-shell.html','w').write(s);open('/tmp/build2/deploy/site/index.html','w').write(s)
PY
cp shell/vercel-shell.html $VS/src/shell/; cd $V; git add -A; git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "shell pinned to ${SHA:0:7}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Cd9GTmTEqAnGDvbyGDjSzx"; git push -q origin bedsit-sandbox; echo SHELL_PUSHED
