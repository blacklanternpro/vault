#!/usr/bin/env bash
# The full client flow against a deployed spike, with curl:
#   PRM -> AS metadata -> DCR -> /authorize page -> passphrase POST -> code
#   -> /token -> /api/mcp (initialize, tools/list, vault_push, vault_status)
#   -> refresh -> 401 checks -> Blob conditional-write probe.
#
# Usage: VAULT_PASSPHRASE_FILE=/path/to/file wire/e2e.sh https://vault-wire-spike.vercel.app
# Tokens, codes and the passphrase are never printed; long values are cut to 12 chars.
set -euo pipefail
H="${1:?usage: e2e.sh https://host}"
PASS_FILE="${VAULT_PASSPHRASE_FILE:?set VAULT_PASSPHRASE_FILE}"
CB="https://claude.ai/api/mcp/auth_callback"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cut12() { sed -E 's/(eyJ[A-Za-z0-9_-]{9})[A-Za-z0-9_.-]+/\1…/g'; }
step() { printf '\n## %s\n' "$*"; }
mcp() { # $1 token, $2 json body
  curl -sS -X POST "$H/api/mcp" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
    -H 'MCP-Protocol-Version: 2025-06-18' -H "Authorization: Bearer $1" -d "$2"
}

step "1. GET /.well-known/oauth-protected-resource/api/mcp"
curl -sS "$H/.well-known/oauth-protected-resource/api/mcp"; echo
step "2. GET /.well-known/oauth-authorization-server"
curl -sS "$H/.well-known/oauth-authorization-server"; echo

step "3. POST /register (redirect $CB)"
curl -sS -X POST "$H/register" -H 'Content-Type: application/json' \
  -d "{\"redirect_uris\":[\"$CB\"],\"client_name\":\"curl e2e\",\"token_endpoint_auth_method\":\"none\"}" > "$T/reg.json"
cut12 < "$T/reg.json"; echo
CID=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).client_id)' "$T/reg.json")
step "3b. POST /register with a foreign redirect (must be refused)"
curl -sS -o /dev/stderr -w 'HTTP %{http_code}\n' -X POST "$H/register" -H 'Content-Type: application/json' -d '{"redirect_uris":["https://evil.example/cb"]}' 2>&1

VERIFIER=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\n' | cut -c1-64)
CHALLENGE=$(printf '%s' "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=\n')
STATE=$(openssl rand -hex 8)
q() { node -e 'const p=new URLSearchParams(JSON.parse(process.argv[1]));console.log(p.toString())' "$1"; }
QS=$(q "{\"response_type\":\"code\",\"client_id\":\"$CID\",\"redirect_uri\":\"$CB\",\"code_challenge\":\"$CHALLENGE\",\"code_challenge_method\":\"S256\",\"state\":\"$STATE\",\"resource\":\"$H/api/mcp\",\"scope\":\"vault\"}")

step "4. GET /authorize (the passphrase page renders)"
curl -sS -D "$T/h4" "$H/authorize?$QS" > "$T/page.html"
grep '^HTTP/2' "$T/h4"; grep -i '^x-frame-options\|^content-security-policy' "$T/h4" || true
grep -o '<h1>[^<]*</h1>\|class="who">[^<]*<' "$T/page.html"
TXN=$(grep -o 'name="txn" value="[^"]*"' "$T/page.html" | sed 's/.*value="//;s/"$//')

step "5a. POST /authorize with a wrong passphrase (slow, 401, no code)"
curl -sS -o "$T/wrong.html" -w 'HTTP %{http_code} in %{time_total}s, location=[%{redirect_url}]\n' -X POST "$H/authorize" \
  --data-urlencode "txn=$TXN" --data-urlencode 'passphrase=definitely-not-it'
grep -o 'role="alert">[^<]*' "$T/wrong.html"

step "5b. POST /authorize with the passphrase -> 302 to Claude's callback with a code"
printf '%s' "$(cat "$PASS_FILE")" > "$T/pp"   # without the file's trailing newline
curl -sS -o /dev/null -D "$T/h5" -X POST "$H/authorize" --data-urlencode "txn=$TXN" --data-urlencode "passphrase@$T/pp"
grep '^HTTP/2' "$T/h5"
LOC=$(grep -i '^location:' "$T/h5" | tr -d '\r' | sed 's/^[Ll]ocation: //')
echo "location: $LOC" | cut12
CODE=$(node -e 'const u=new URL(process.argv[1]);console.log(u.searchParams.get("code"))' "$LOC")
GOTSTATE=$(node -e 'const u=new URL(process.argv[1]);console.log(u.searchParams.get("state"))' "$LOC")
[ "$GOTSTATE" = "$STATE" ] && echo "state round-tripped: ok"

step "6. POST /token (authorization_code + PKCE verifier)"
curl -sS -X POST "$H/token" -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode grant_type=authorization_code --data-urlencode "code=$CODE" --data-urlencode "client_id=$CID" \
  --data-urlencode "redirect_uri=$CB" --data-urlencode "code_verifier=$VERIFIER" --data-urlencode "resource=$H/api/mcp" > "$T/tok.json"
cut12 < "$T/tok.json"; echo
AT=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).access_token)' "$T/tok.json")
RT=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).refresh_token)' "$T/tok.json")
step "6b. same code, wrong verifier (must be invalid_grant)"
curl -sS -X POST "$H/token" --data-urlencode grant_type=authorization_code --data-urlencode "code=$CODE" \
  --data-urlencode "client_id=$CID" --data-urlencode "redirect_uri=$CB" --data-urlencode "code_verifier=${VERIFIER%?}x"; echo

step "7. /api/mcp without a token (must be 401 + WWW-Authenticate)"
curl -sS -o /dev/null -D - -X POST "$H/api/mcp" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | grep -i '^HTTP\|^www-authenticate'
step "7b. /api/mcp with a forged token (must be 401)"
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' -X POST "$H/api/mcp" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2UiOiJhY2Nlc3MifQ.forged' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

step "8. initialize"
mcp "$AT" '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl-e2e","version":"1"}}}'; echo
step "9. tools/list"
mcp "$AT" '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s.startsWith("{")?s:s.match(/^data: (.*)$/m)[1]);for(const t of j.result.tools)console.log(t.name+": "+t.description.slice(0,90)+"…")})'
step "10. vault_status before"
mcp "$AT" '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"vault_status","arguments":{}}}' | grep -o '"text":"[^"]*"' | head -1
step "11. tools/call vault_push (sample tree)"
DUE=$(node -e 'const d=new Date(Date.now()+2*864e5);console.log(d.toISOString().slice(0,10))')
mcp "$AT" "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"vault_push\",\"arguments\":{\"folder\":\"r1i\",\"tasks\":[{\"title\":\"Network map\",\"subtasks\":[\"nodes\",\"edges\",\"legend\",\"export\"],\"due\":\"$DUE\",\"next\":\"draw the nodes\"}]}}}" | grep -o '"text":"[^"]*"' | head -1
step "11b. push it again with one more todo (must update, not duplicate)"
mcp "$AT" "{\"jsonrpc\":\"2.0\",\"id\":5,\"method\":\"tools/call\",\"params\":{\"name\":\"vault_push\",\"arguments\":{\"folder\":\"R1i/\",\"tasks\":[{\"title\":\"NETWORK MAP\",\"subtasks\":[\"nodes\",{\"title\":\"edges\",\"done\":true},\"print it\"]}]}}}" | grep -o '"text":"[^"]*"' | head -1
step "12. vault_status after (read back from Blob)"
mcp "$AT" '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"vault_status","arguments":{}}}' | grep -o '"text":"[^"]*"' | head -1

step "13. POST /token (refresh_token) -> new pair, and the new access token works"
curl -sS -X POST "$H/token" --data-urlencode grant_type=refresh_token --data-urlencode "refresh_token=$RT" --data-urlencode "client_id=$CID" > "$T/tok2.json"
cut12 < "$T/tok2.json"; echo
AT2=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).access_token)' "$T/tok2.json")
curl -sS -o /dev/null -w 'tools/list with refreshed token: HTTP %{http_code}\n' -X POST "$H/api/mcp" \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H "Authorization: Bearer $AT2" -d '{"jsonrpc":"2.0","id":7,"method":"tools/list"}'

step "14. Blob conditional-write probe (private store)"
curl -sS -X POST "$H/api/probe" -H "Authorization: Bearer $AT"; echo
