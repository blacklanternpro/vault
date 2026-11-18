/*
 * The passphrase page. The app's field played straight: cool near-white
 * ground, one white panel, a hairline, one blue for the one button, plain
 * type, the `VAULT_` wordmark in mono. No costume, no script, no fonts
 * fetched from anywhere.
 */

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:#f2f3f6;color:#151515;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px}
main{background:#fff;border:1px solid #e5e6e8;border-radius:8px;width:100%;max-width:380px;padding:28px 28px 24px}
.mark{font:600 15px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em;margin:0 0 22px;color:#151515}
.mark b{color:#0b6ef3;font-weight:600}
h1{font-size:17px;font-weight:600;margin:0 0 6px}
p{margin:0 0 18px;color:#666a70}
.who{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#151515;background:#f2f3f6;border-radius:4px;padding:2px 6px}
label{display:block;font-size:13px;color:#666a70;margin:0 0 6px}
input[type=password]{width:100%;font:inherit;padding:10px 12px;border:1px solid #d7d9dd;border-radius:6px;background:#fff;color:#151515;outline:none}
input[type=password]:focus{border-color:#0b6ef3;box-shadow:0 0 0 3px #f1f6fe}
.row{display:flex;gap:10px;margin-top:16px}
button{font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;height:38px;border-radius:6px;cursor:pointer;padding:0 16px}
.go{background:#0b6ef3;color:#fff;border:0;flex:1}
.go:hover{background:#0a5cdd}
.no{background:#fff;color:#666a70;border:1px solid #e5e6e8}
.err{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#d92c20;margin:10px 0 0}
.warn{font-size:13px;color:#d92c20;margin:0 0 14px}
@media (prefers-color-scheme:dark){
body{background:#151515;color:#f2f3f6}
main{background:#1d1e20;border-color:#2c2d30}
h1,.mark{color:#f2f3f6}
.who{background:#2c2d30;color:#f2f3f6}
input[type=password]{background:#151515;color:#f2f3f6;border-color:#3a3c40}
.no{background:#1d1e20;border-color:#2c2d30}
}
`

export type PageOpts = { txn: string; clientLabel: string; returnHost: string; loopback: boolean; error?: string }

export function authorizePage(o: PageOpts): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>VAULT_ · connect</title><style>${CSS}</style></head>
<body><main>
<p class="mark">VAULT<b>_</b></p>
<h1>Connect ${escapeHtml(o.clientLabel)}</h1>
<p>It will read and write your VAULT test board. You'll go back to <span class="who">${escapeHtml(o.returnHost)}</span>.</p>
${o.loopback ? '<p class="warn">This sends you back to a program on this computer. Only go on if you started it.</p>' : ''}
<form method="post" action="/authorize" autocomplete="off">
<input type="hidden" name="txn" value="${escapeHtml(o.txn)}">
<label for="pp">passphrase</label>
<input id="pp" name="passphrase" type="password" autofocus required autocomplete="current-password">
${o.error ? `<p class="err" role="alert">${escapeHtml(o.error)}</p>` : ''}
<div class="row"><button class="no" type="submit" name="deny" value="1" formnovalidate>cancel</button><button class="go" type="submit">Connect</button></div>
</form>
</main></body></html>`
}

export function errorPage(message: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>VAULT_ · not a thing</title><style>${CSS}</style></head>
<body><main><p class="mark">VAULT<b>_</b></p><h1>not a thing.</h1><p>${escapeHtml(message)}</p></main></body></html>`
}

export const PAGE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
}
