/**
 * Five agency-mark studies of BAD FORM. Same tongue as the slip stamp —
 * munted oval, Helvetica, cobalt, red only as a second impression or a hand —
 * different sentences.
 *
 *   node scripts/make-stamp-alts.mjs
 *
 * Writes public/brand/alts/<name>-<ground>.png and a contact sheet.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'brand', 'alts')
const TMP = join(ROOT, 'node_modules', '.tmp-stamp-alts')
const CHROME = '/opt/google/chrome/chrome'

const COBALT = '#0000FF'
const URGENT = '#FF2B2B'
const PAPER = '#F4F4F0'
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const GROUNDS = {
  black: '#000000',
  white: '#FFFFFF',
  grey: '#A8A8A2',
}

const FRAME = { w: 148, h: 96 }
const SCALE = 8
const PIXEL_W = FRAME.w * SCALE
const PIXEL_H = FRAME.h * SCALE

const VARIANTS = [
  { id: 'seal', seed: 0x5ea10001 },
  { id: 'stack', seed: 0x57ac0002 },
  { id: 'burst', seed: 0xb0257003 },
  { id: 'strike', seed: 0x5711ce04 },
  { id: 'cut', seed: 0xcd700005 },
]

const PAINTER = String.raw`
const COBALT = '${COBALT}'
const URGENT = '${URGENT}'
const FONT = ${JSON.stringify(FONT)}
const FRAME = ${JSON.stringify(FRAME)}

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function tracked(ctx, text, x, y, track, align) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width)
  const extra = track * Math.max(0, text.length - 1)
  const total = widths.reduce((a, b) => a + b, 0) + extra
  let cx = x
  if (align === 'center') cx = x - total / 2
  else if (align === 'right') cx = x - total
  ctx.textAlign = 'left'
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cx, y)
    cx += widths[i] + track
  }
  return total
}

function oval(ctx, rx, ry, seed, samples, wobble) {
  const r = rng(seed)
  ctx.beginPath()
  for (let i = 0; i <= samples; i++) {
    const a = (i / samples) * Math.PI * 2
    const w = 1 + (r() * 2 - 1) * wobble
    const px = Math.cos(a) * rx * w
    const py = Math.sin(a) * ry * w
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function typeface(ctx, px, weight) {
  ctx.font = weight + ' ' + px + 'px ' + FONT
  ctx.textBaseline = 'middle'
}

function riso(ctx, draw) {
  ctx.save()
  ctx.globalAlpha = 0.72
  ctx.translate(2.2, -1.8)
  draw(URGENT)
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = 0.92
  draw(COBALT)
  ctx.restore()
}

function paintHand(ctx, x, y, w, width, seed) {
  const r = rng(seed)
  const lead = 5 + r() * 6
  const tail = 5 + r() * 7
  const x0 = x - lead
  const x1 = x + w + tail
  const steps = 6
  ctx.save()
  ctx.strokeStyle = URGENT
  ctx.globalAlpha = 0.94
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const px = x0 + (x1 - x0) * t
    const py = y + (r() * 2 - 1) * 1.7 + Math.sin(t * Math.PI) * (r() - 0.5) * 1.5
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()
}

function paintSeal(ctx, seed) {
  ctx.save()
  ctx.rotate(-0.08)
  riso(ctx, (color) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineJoin = 'round'
    ctx.lineWidth = 1.7
    oval(ctx, 58, 34, seed, 48, 0.055)
    ctx.stroke()
    ctx.lineWidth = 1.05
    oval(ctx, 49, 26, seed ^ 0x1111, 42, 0.05)
    ctx.stroke()
    typeface(ctx, 10, 700)
    tracked(ctx, 'BAD FORM', 0, 0.6, 3.4, 'center')
    ctx.beginPath()
    ctx.arc(-49, 0, 1.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(49, 0, 1.35, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function paintStack(ctx, seed) {
  ctx.save()
  ctx.rotate(-0.035)
  riso(ctx, (color) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineJoin = 'round'
    ctx.lineWidth = 1.9
    oval(ctx, 46, 40, seed, 44, 0.07)
    ctx.stroke()
    typeface(ctx, 14, 700)
    tracked(ctx, 'BAD', 0, -8.2, 4.2, 'center')
    tracked(ctx, 'FORM', 0, 10.4, 2.6, 'center')
  })
  ctx.restore()
}

function paintBurst(ctx, seed) {
  ctx.save()
  ctx.rotate(-0.025)
  riso(ctx, (color) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.3
    oval(ctx, 30, 18, seed, 36, 0.09)
    ctx.stroke()
    typeface(ctx, 20, 700)
    tracked(ctx, 'BAD FORM', 0, 1, 1.8, 'center')
  })
  ctx.restore()
}

function paintStrike(ctx, seed) {
  ctx.save()
  ctx.rotate(-0.05)
  riso(ctx, (color) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineJoin = 'round'
    ctx.lineWidth = 1.35
    oval(ctx, 58, 21, seed, 42, 0.06)
    ctx.stroke()
    typeface(ctx, 11, 700)
    tracked(ctx, 'BAD FORM', 0, 0.8, 3.1, 'center')
  })
  paintHand(ctx, -50, 3.2, 100, 2.35, seed ^ 0xabc)
  ctx.restore()
}

function paintCut(ctx, seed, ground) {
  ctx.save()
  ctx.rotate(-0.06)
  ctx.save()
  ctx.globalAlpha = 0.62
  ctx.translate(2.3, -1.9)
  ctx.fillStyle = URGENT
  oval(ctx, 56, 26, seed, 44, 0.065)
  ctx.fill()
  ctx.restore()
  ctx.globalAlpha = 0.94
  ctx.fillStyle = COBALT
  oval(ctx, 56, 26, seed, 44, 0.065)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = ground || '#000'
  typeface(ctx, 12, 700)
  tracked(ctx, 'BAD FORM', 0, 0.8, 2.7, 'center')
  ctx.lineJoin = 'round'
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.translate(2.3, -1.9)
  ctx.strokeStyle = URGENT
  ctx.lineWidth = 1.5
  oval(ctx, 56, 26, seed, 44, 0.065)
  ctx.stroke()
  ctx.restore()
  ctx.globalAlpha = 0.92
  ctx.strokeStyle = COBALT
  ctx.lineWidth = 1.5
  oval(ctx, 56, 26, seed, 44, 0.065)
  ctx.stroke()
  ctx.restore()
}

const PAINT = {
  seal: paintSeal,
  stack: paintStack,
  burst: paintBurst,
  strike: paintStrike,
  cut: paintCut,
}

function paintVariant(ctx, id, seed, ground) {
  if (ground) {
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, FRAME.w, FRAME.h)
  }
  ctx.save()
  ctx.translate(FRAME.w / 2, FRAME.h / 2)
  PAINT[id](ctx, seed, ground)
  ctx.restore()
}
`

function pageFor(id, seed, ground) {
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${PIXEL_W}" height="${PIXEL_H}"></canvas>
<script>
${PAINTER}
const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
ctx.scale(${SCALE}, ${SCALE})
paintVariant(ctx, ${JSON.stringify(id)}, ${seed}, ${JSON.stringify(ground)})
</script>
`
}

function sheetPage() {
  const thumb = 420
  const thumbH = Math.round((PIXEL_H / PIXEL_W) * thumb)
  const pad = 28
  const nameW = 78
  const gap = 10
  const head = 48
  const sheetW = pad + nameW + 3 * (thumb + gap) - gap + pad
  const sheetH = pad + head + VARIANTS.length * (thumbH + gap) - gap + pad
  const rows = VARIANTS.map(
    (v) => `<tr>
      <td class="name">${v.id.toUpperCase()}</td>
      ${['black', 'white', 'grey'].map((g) => `<td><img width="${thumb}" height="${thumbH}" src="${v.id}-${g}.png"></td>`).join('')}
    </tr>`,
  ).join('')
  return {
    sheetW,
    sheetH,
    html: `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;background:#000;color:#F4F4F0;font:700 11px ${FONT}}
  .wrap{padding:${pad}px}
  table{border-collapse:collapse}
  th{font-size:9px;letter-spacing:.28em;color:rgba(244,244,240,.5);text-align:left;padding:0 ${gap}px 10px;font-weight:700}
  td{padding:0 ${gap}px ${gap}px 0;vertical-align:middle}
  td.name{width:${nameW}px;letter-spacing:.22em;padding-right:12px}
  h1{margin:0 0 6px;font-size:13px;letter-spacing:.42em}
  p{margin:0 0 18px;font-size:9px;letter-spacing:.24em;color:rgba(244,244,240,.45);font-weight:400}
  img{display:block}
</style>
<div class="wrap">
  <h1>BAD FORM</h1>
  <p>FIVE CUTS</p>
  <table>
    <tr><th></th><th>BLACK</th><th>WHITE</th><th>GREY</th></tr>
    ${rows}
  </table>
</div>
`,
  }
}

function chromeShot(htmlPath, pngPath, width, height, bg, budget = 2000) {
  const profile = join(TMP, `p-${Math.random().toString(16).slice(2)}`)
  execFileSync(
    CHROME,
    [
      `--user-data-dir=${profile}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      `--virtual-time-budget=${budget}`,
      `--window-size=${width},${height}`,
      `--screenshot=${pngPath}`,
      `--default-background-color=${bg}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'ignore', timeout: 30_000 },
  )
}

function raster(name, html, width, height, bg) {
  mkdirSync(TMP, { recursive: true })
  const htmlPath = join(TMP, `${name}.html`)
  writeFileSync(htmlPath, html)
  const pngPath = join(OUT, `${name}.png`)
  chromeShot(htmlPath, pngPath, width, height, bg)
  console.log(`wrote ${pngPath} (${readFileSync(pngPath).length} bytes)`)
}

mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })

for (const v of VARIANTS) {
  for (const [name, hex] of Object.entries(GROUNDS)) {
    raster(
      `${v.id}-${name}`,
      pageFor(v.id, v.seed, hex),
      PIXEL_W,
      PIXEL_H,
      `${hex.replace('#', '')}ff`,
    )
  }
}

const sheet = sheetPage()
const sheetHtml = join(OUT, '_sheet.html')
writeFileSync(sheetHtml, sheet.html)
chromeShot(sheetHtml, join(OUT, 'sheet.png'), sheet.sheetW, sheet.sheetH, '000000ff', 4000)
rmSync(sheetHtml)
console.log(`wrote ${join(OUT, 'sheet.png')} (${readFileSync(join(OUT, 'sheet.png')).length} bytes)`)

rmSync(TMP, { recursive: true, force: true })
