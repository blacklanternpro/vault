/**
 * Renders the BAD FORM stamp out of the app and into files.
 *
 *   node scripts/make-stamp.mjs
 *
 * The stamp is normally generated at runtime by paintStamp() in
 * src/speck/paint.ts. This replays the same seeded wobble and the same
 * per-glyph tracking so the asset is the object the slip prints, only
 * bigger — not a redraw by eye.
 *
 * Emits an SVG (true vector oval) plus PNGs rasterised through headless
 * Chrome from a canvas paint of the same ops.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'brand')
const TMP = join(ROOT, 'node_modules', '.tmp-stamp')
// The /usr/local/bin wrapper pins the interactive session's debug port.
const CHROME = '/opt/google/chrome/chrome'

const COBALT = '#0000FF'
const URGENT = '#FF2B2B'
const PAPER = '#F4F4F0'
const FIELD = '#000000'
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

// The foot stamp as the slip prints it (see compile.ts footerBlock).
const STAMP = {
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
}

/** mulberry32, identical to src/speck/noise.ts */
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

/** The munted oval: one wobble sample per vertex, seeded so it never changes. */
function ovalPoints(scale) {
  const r = rng(STAMP.seed)
  const pts = []
  for (let i = 0; i <= STAMP.samples; i++) {
    const a = (i / STAMP.samples) * Math.PI * 2
    const w = 1 + (r() * 2 - 1) * STAMP.wobble
    pts.push([
      Math.cos(a) * STAMP.rx * w * scale,
      Math.sin(a) * STAMP.ry * w * scale,
    ])
  }
  return pts
}

function svg(scale, ground) {
  const pad = 10 * scale
  const w = Math.round(STAMP.rx * 2 * scale + pad * 2)
  const h = Math.round(STAMP.ry * 2 * scale + pad * 2)
  const cx = w / 2
  const cy = h / 2

  const pts = ovalPoints(scale)
  const path = `${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')} Z`
  const track = STAMP.track * scale
  const size = STAMP.font * scale
  const stroke = STAMP.width * scale
  const deg = (STAMP.angle * 180) / Math.PI

  // SVG letter-spacing includes a trailing gap; shift by half a track so the
  // word sits on the same centre the canvas tracked() paint uses.
  const layer = (color, dx, dy, alpha) => `
    <g transform="translate(${(cx + dx * scale).toFixed(2)} ${(cy + dy * scale).toFixed(2)}) rotate(${deg.toFixed(3)})" opacity="${alpha}">
      <path d="${path}" fill="none" stroke="${color}" stroke-width="${stroke.toFixed(2)}" stroke-linejoin="round"/>
      <text x="${(track / 2).toFixed(2)}" y="${(size * 0.36).toFixed(2)}" fill="${color}"
        font-family="${FONT}" font-weight="${STAMP.weight}" font-size="${size.toFixed(2)}"
        letter-spacing="${track.toFixed(2)}" text-anchor="middle">${STAMP.text}</text>
    </g>`

  const bg = ground ? `<rect width="${w}" height="${h}" fill="${ground}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${bg}${layer(URGENT, STAMP.ghostDx, STAMP.ghostDy, (STAMP.alpha * 0.55).toFixed(3))}${layer(COBALT, 0, 0, STAMP.alpha)}
</svg>
`
}

function canvasPage(scale, ground) {
  const pad = 10
  const logicalW = STAMP.rx * 2 + pad * 2
  const logicalH = STAMP.ry * 2 + pad * 2
  const w = Math.round(logicalW * scale)
  const h = Math.round(logicalH * scale)
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${w}" height="${h}"></canvas>
<script>
const COBALT = '${COBALT}'
const URGENT = '${URGENT}'
const FONT = ${JSON.stringify(FONT)}
const STAMP = ${JSON.stringify(STAMP)}
const scale = ${scale}
const ground = ${JSON.stringify(ground)}
const logicalW = ${logicalW}
const logicalH = ${logicalH}

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
  const draw = (color, dx, dy, alpha) => {
    const r = rng(op.seed)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(op.cx + dx, op.cy + dy)
    ctx.rotate(op.angle)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = op.width
    ctx.lineJoin = 'round'

    ctx.beginPath()
    for (let i = 0; i <= STAMP.samples; i++) {
      const a = (i / STAMP.samples) * Math.PI * 2
      const wobble = 1 + (r() * 2 - 1) * STAMP.wobble
      const px = Math.cos(a) * op.rx * wobble
      const py = Math.sin(a) * op.ry * wobble
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.font = op.font
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    tracked(ctx, op.text, 0, 1, op.track, 'center')
    ctx.restore()
  }
  draw(op.ghost, STAMP.ghostDx, STAMP.ghostDy, op.alpha * 0.55)
  draw(op.color, 0, 0, op.alpha)
}

const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
ctx.scale(scale, scale)
if (ground) {
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, logicalW, logicalH)
}
paintStamp(ctx, {
  cx: logicalW / 2,
  cy: logicalH / 2,
  rx: STAMP.rx,
  ry: STAMP.ry,
  text: STAMP.text,
  font: STAMP.weight + ' ' + STAMP.font + 'px ' + FONT,
  track: STAMP.track,
  color: COBALT,
  ghost: URGENT,
  angle: STAMP.angle,
  alpha: STAMP.alpha,
  width: STAMP.width,
  seed: STAMP.seed,
})
</script>
`
}

function raster(name, scale, ground) {
  mkdirSync(TMP, { recursive: true })
  const htmlPath = join(TMP, `${name}.html`)
  writeFileSync(htmlPath, canvasPage(scale, ground))
  const pad = 10
  const width = Math.round((STAMP.rx * 2 + pad * 2) * scale)
  const height = Math.round((STAMP.ry * 2 + pad * 2) * scale)
  const pngPath = join(OUT, `${name}.png`)
  const profile = join(TMP, `profile-${name}`)
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
      '--virtual-time-budget=2000',
      `--window-size=${width},${height}`,
      `--screenshot=${pngPath}`,
      `--default-background-color=${ground ? `${ground.replace('#', '')}ff` : '00000000'}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'ignore', timeout: 30_000 },
  )
  const bytes = readFileSync(pngPath).length
  console.log(`wrote ${pngPath} (${bytes} bytes, ${width}×${height})`)
}

mkdirSync(OUT, { recursive: true })

const scale = 8.5
const small = 2.6

writeFileSync(join(OUT, 'bad-form.svg'), svg(scale, null))
console.log(`wrote ${join(OUT, 'bad-form.svg')}`)
writeFileSync(join(OUT, 'bad-form-small.svg'), svg(small, null))
console.log(`wrote ${join(OUT, 'bad-form-small.svg')}`)

raster('bad-form', scale, null)
raster('bad-form-on-paper', scale, PAPER)
raster('bad-form-on-black', scale, FIELD)
raster('bad-form-small', small, null)

rmSync(TMP, { recursive: true, force: true })
