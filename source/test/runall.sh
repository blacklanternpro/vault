#!/bin/bash
# runs every harness in turn (from /tmp/build2, against all.mjs) and writes runall.log; a harness fails on a non-zero exit, an uncaught error, or a "FAIL" line
cd /tmp/build2; : > runall.log; pass=0; fail=0
for h in harness.mjs harness2.mjs harness3.mjs harness5.mjs harness6.mjs harness12.mjs harness_tv.mjs harness_ex.mjs harness_ex2.mjs harness_exrag.mjs harness_villa.mjs harness_basement.mjs harness_shell.mjs harness_services.mjs harness_kitchen.mjs harness_baths.mjs harness_living.mjs harness_rooms.mjs harness_vibe.mjs harness_doors.mjs harness_bricks.mjs harness_tough.mjs harness_hammer.mjs harness_runner.mjs harness_break.mjs harness_audit.mjs harness_faces.mjs harness_batches.mjs harness_vpx.mjs harness_v81.mjs harness_darts.mjs harness_street.mjs harness_gun.mjs harness_scale.mjs; do
  [ -f "$h" ] || continue; t0=$(date +%s); out=$(timeout 900 node "$h" 2>&1); rc=$?; dt=$(( $(date +%s)-t0 ))
  bad=$(echo "$out" | grep -E "^\s*(FAIL|  FAIL)|Uncaught|SyntaxError|TypeError|ReferenceError|RangeError" | grep -v "FAILS 0" | head -3)
  if [ $rc -ne 0 ] || [ -n "$bad" ]; then st=FAIL; fail=$((fail+1)); else st=ok; pass=$((pass+1)); fi
  echo "== $h  $st  rc=$rc  ${dt}s" >> runall.log; [ -n "$bad" ] && echo "$bad" >> runall.log; echo "$out" | tail -4 | sed 's/^/   | /' >> runall.log
done
echo "TOTAL ok=$pass fail=$fail" >> runall.log; tail -1 runall.log
