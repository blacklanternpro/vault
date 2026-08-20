/**
 * Studies of the original BAD FORM stamp — the object, not a new mark.
 *
 *   node scripts/make-stamp-studies.mjs
 *
 * 1. Colour: same oval, same type, both inks swapped for a new pair.
 * 2. Shape: same cobalt / urgent, the munted oval rewritten five ways.
 * 3. More inks of the original oval.
 * 4. No oval: type still tilted, a dead-level underline through the word.
 *
 * Each on black, white, grey. Sheets in public/brand/studies/.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'brand', 'studies')
const TMP = join(ROOT, 'node_modules', '.tmp-stamp-studies')
const CHROME = '/opt/google/chrome/chrome'

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const GROUNDS = { black: '#000000', white: '#FFFFFF', grey: '#A8A8A2' }

const FRAME = { w: 164, h: 108 }
const SCALE = 8
const PIXEL_W = FRAME.w * SCALE
const PIXEL_H = FRAME.h * SCALE

// The slip stamp. Colour and oval are the only knobs these studies turn.
const BASE = {
  text: 'BAD FORM',
  rx: 54,
  ry: 19,
  font: 9,
  weight: 700,
  track: 3,
  width: 1.2,
  angle: -0.05,
  alpha: 0.9,
  seed: 0x8adf07,
  ghostDx: 1.6,
  ghostDy: -1.4,
  samples: 42,
  wobble: 0.06,
  harmonicN: 0,
  harmonic: 0,
  egg: 0,
  color: '#0000FF',
  ghost: '#FF2B2B',
}

const COLOURS = [
  { id: 'mono', color: '#F4F4F0', ghost: '#111111' },
  { id: 'hazard', color: '#FFD200', ghost: '#9B0B0B' },
  { id: 'riso', color: '#FF48B0', ghost: '#0A2F5C' },
  { id: 'heat', color: '#FF5A00', ghost: '#4A00CC' },
  { id: 'wine', color: '#6E1423', ghost: '#E6DCC8' },
]

const COLOURS2 = [
  { id: 'ivory', color: '#F7F1E1', ghost: '#140052' },
  { id: 'copper', color: '#C45C26', ghost: '#001A4D' },
  { id: 'slate', color: '#3A4450', ghost: '#FF6F61' },
  { id: 'plum', color: '#4A0E4E', ghost: '#E6B800' },
  { id: 'signal', color: '#FFFFFF', ghost: '#FF3B00' },
]

const RULES = [
  { id: 'source', color: '#0000FF', ghost: '#FF2B2B' },
  { id: 'mono', color: '#F4F4F0', ghost: '#111111' },
  { id: 'swap', color: '#FF2B2B', ghost: '#0000FF' },
  { id: 'hazard', color: '#FFD200', ghost: '#9B0B0B' },
  { id: 'night', color: '#F4F4F0', ghost: '#FF2B2B' },
]

const SHAPES = [
  { id: 'round', rx: 38, ry: 36, samples: 48, wobble: 0.07, angle: -0.04, seed: 0xa11e0001 },
  { id: 'flat', rx: 70, ry: 10, samples: 40, wobble: 0.08, angle: -0.02, seed: 0xa11e0002 },
  { id: 'shard', rx: 56, ry: 22, samples: 14, wobble: 0.22, angle: -0.09, seed: 0xa11e0003 },
  {
    id: 'pulse',
    rx: 54,
    ry: 20,
    samples: 48,
    wobble: 0.03,
    harmonicN: 6,
    harmonic: 0.12,
    angle: -0.05,
    seed: 0xa11e0004,
  },
  {
    id: 'egg',
    rx: 48,
    ry: 26,
    samples: 42,
    wobble: 0.055,
    egg: 0.32,
    angle: -0.07,
    seed: 0xa11e0005,
  },
]

const PAINTER = `
const FONT = ${JSON.stringify(FONT)}
const FRAME = ${JSON.stringify(FRAME)}
const BASE = ${JSON.stringify(BASE)}

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
  ctx.textAlign = 'left'
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cx, y)
    cx += widths[i] + track
  }
}

function paintStamp(ctx, op) {
  const draw = (ink, dx, dy, alpha) => {
    const r = rng(op.seed)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(op.cx + dx, op.cy + dy)
    ctx.rotate(op.angle)
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineWidth = op.width
    ctx.lineJoin = 'round'

    const samples = op.samples
    ctx.beginPath()
    for (let i = 0; i <= samples; i++) {
      const a = (i / samples) * Math.PI * 2
      let wobble = 1 + (r() * 2 - 1) * op.wobble
      if (op.harmonic) wobble += op.harmonic * Math.cos(op.harmonicN * a)
      const rx = op.rx * (1 + (op.egg || 0) * Math.cos(a))
      const px = Math.cos(a) * rx * wobble
      const py = Math.sin(a) * op.ry * wobble
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.font = op.weight + ' ' + op.font + 'px ' + FONT
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    tracked(ctx, op.text, 0, 1, op.track, 'center')
    ctx.restore()
  }
  draw(op.ghost, op.ghostDx, op.ghostDy, op.alpha * 0.62)
  draw(op.color, 0, 0, op.alpha)
}

function paintRule(ctx, op) {
  const drawType = (ink, dx, dy, alpha) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(op.cx + dx, op.cy + dy)
    ctx.rotate(op.angle)
    ctx.fillStyle = ink
    ctx.font = op.weight + ' ' + op.font + 'px ' + FONT
    ctx.textBaseline = 'middle'
    tracked(ctx, op.text, 0, 1, op.track, 'center')
    ctx.restore()
  }
  drawType(op.ghost, op.ghostDx, op.ghostDy, op.alpha * 0.62)
  drawType(op.color, 0, 0, op.alpha)

  // Dead level. Not rotated, not jittered. The word still sits at -0.05,
  // so the rule cuts the left letters higher and the right letters lower.
  ctx.save()
  ctx.font = op.weight + ' ' + op.font + 'px ' + FONT
  const widths = [...op.text].map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + op.track * Math.max(0, op.text.length - 1)
  const pad = 2.5
  ctx.globalAlpha = op.alpha
  ctx.strokeStyle = op.color
  ctx.lineWidth = 1.15
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.moveTo(-total / 2 - pad, 3.7)
  ctx.lineTo(total / 2 + pad, 3.7)
  ctx.stroke()
  ctx.restore()
}

function paintOp(ctx, patch, ground) {
  if (ground) {
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, FRAME.w, FRAME.h)
  }
  ctx.save()
  ctx.translate(FRAME.w / 2, FRAME.h / 2)
  const op = Object.assign({ cx: 0, cy: 0 }, BASE, patch)
  if (op.kind === 'rule') paintRule(ctx, op)
  else paintStamp(ctx, op)
  ctx.restore()
}
`

function pageFor(patch, ground) {
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${PIXEL_W}" height="${PIXEL_H}"></canvas>
<script>
${PAINTER}
const ctx = document.getElementById('c').getContext('2d')
ctx.scale(${SCALE}, ${SCALE})
paintOp(ctx, ${JSON.stringify(patch)}, ${JSON.stringify(ground)})
</script>
`
}

function chromeShot(htmlPath, pngPath, width, height, bg, budget = 2000) {
  execFileSync(
    CHROME,
    [
      `--user-data-dir=${join(TMP, 'p-' + Math.random().toString(16).slice(2))}`,
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

function raster(dir, name, patch, ground, hex) {
  mkdirSync(dir, { recursive: true })
  mkdirSync(TMP, { recursive: true })
  const htmlPath = join(TMP, `${name}.html`)
  writeFileSync(htmlPath, pageFor(patch, hex))
  const pngPath = join(dir, `${name}.png`)
  chromeShot(htmlPath, pngPath, PIXEL_W, PIXEL_H, `${hex.replace('#', '')}ff`)
  console.log(`wrote ${pngPath}`)
}

function sheet(dir, filename, title, items) {
  const thumb = 400
  const thumbH = Math.round((PIXEL_H / PIXEL_W) * thumb)
  const pad = 28
  const nameW = 92
  const gap = 10
  const head = 52
  const sheetW = pad + nameW + 3 * (thumb + gap) - gap + pad
  const sheetH = pad + head + items.length * (thumbH + gap) - gap + pad
  const rows = items
    .map(
      (v) => `<tr>
      <td class="name">${v.id.toUpperCase()}</td>
      ${['black', 'white', 'grey'].map((g) => `<td><img width="${thumb}" height="${thumbH}" src="${v.id}-${g}.png"></td>`).join('')}
    </tr>`,
    )
    .join('')
  const html = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;background:#000;color:#F4F4F0;font:700 11px ${FONT}}
  .wrap{padding:${pad}px}
  table{border-collapse:collapse}
  th{font-size:9px;letter-spacing:.28em;color:rgba(244,244,240,.5);text-align:left;padding:0 ${gap}px 10px;font-weight:700}
  td{padding:0 ${gap}px ${gap}px 0;vertical-align:middle}
  td.name{width:${nameW}px;letter-spacing:.22em;padding-right:12px}
  h1{margin:0 0 6px;font-size:13px;letter-spacing:.42em}
  p{margin:0 0 18px;font-size:9px;letter-spacing:.22em;color:rgba(244,244,240,.45);font-weight:400}
  img{display:block}
</style>
<div class="wrap">
  <h1>BAD FORM</h1>
  <p>${title}</p>
  <table>
    <tr><th></th><th>BLACK</th><th>WHITE</th><th>GREY</th></tr>
    ${rows}
  </table>
</div>`
  const htmlPath = join(dir, '_sheet.html')
  writeFileSync(htmlPath, html)
  const pngPath = join(dir, filename)
  chromeShot(htmlPath, pngPath, sheetW, sheetH, '000000ff', 4000)
  rmSync(htmlPath)
  console.log(`wrote ${pngPath}`)
}

mkdirSync(OUT, { recursive: true })
const onlyNew = process.argv.includes('--new')
const colorDir = join(OUT, 'color')
const shapeDir = join(OUT, 'shape')
const color2Dir = join(OUT, 'color2')
const ruleDir = join(OUT, 'rule')

if (!onlyNew) {
  for (const c of COLOURS) {
    for (const [g, hex] of Object.entries(GROUNDS)) {
      raster(colorDir, `${c.id}-${g}`, { color: c.color, ghost: c.ghost }, g, hex)
    }
  }
  sheet(colorDir, 'sheet.png', 'ORIGINAL  ·  FIVE INKS', COLOURS)

  for (const s of SHAPES) {
    const patch = {
      rx: s.rx,
      ry: s.ry,
      samples: s.samples,
      wobble: s.wobble,
      angle: s.angle,
      seed: s.seed,
      harmonicN: s.harmonicN || 0,
      harmonic: s.harmonic || 0,
      egg: s.egg || 0,
    }
    for (const [g, hex] of Object.entries(GROUNDS)) {
      raster(shapeDir, `${s.id}-${g}`, patch, g, hex)
    }
  }
  sheet(shapeDir, 'sheet.png', 'ORIGINAL  ·  FIVE OVALS', SHAPES)
}

for (const c of COLOURS2) {
  for (const [g, hex] of Object.entries(GROUNDS)) {
    raster(color2Dir, `${c.id}-${g}`, { color: c.color, ghost: c.ghost }, g, hex)
  }
}
sheet(color2Dir, 'sheet.png', 'ORIGINAL  ·  FIVE MORE INKS', COLOURS2)

for (const c of RULES) {
  for (const [g, hex] of Object.entries(GROUNDS)) {
    raster(ruleDir, `${c.id}-${g}`, { kind: 'rule', color: c.color, ghost: c.ghost }, g, hex)
  }
}
sheet(ruleDir, 'sheet.png', 'NO OVAL  ·  LEVEL RULE', RULES)

rmSync(TMP, { recursive: true, force: true })
