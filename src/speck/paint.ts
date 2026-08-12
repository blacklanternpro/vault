import type { Op } from './ir'
import { CANVAS, COBALT, INK, fontMono } from './tokens'

function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  track: number,
  align: CanvasTextAlign,
): void {
  if (!track) {
    ctx.fillText(text, x, y)
    return
  }
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
}

function paintSeal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const s = w / 280
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)

  ctx.strokeStyle = INK
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(140, 42, 38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  ctx.arc(140, 42, 32, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.strokeStyle = COBALT
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.ellipse(140, 42, 28, 12, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(140, 42, 12, 28, (55 * Math.PI) / 180, 0, Math.PI * 2)
  ctx.stroke()
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(140, 42, 12, 28, (-35 * Math.PI) / 180, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.strokeStyle = COBALT
  ctx.lineCap = 'butt'
  const lines: [number, number, number, number][] = [
    [118, 24, 162, 24],
    [112, 29, 168, 29],
    [108, 34, 172, 34],
    [106, 39, 174, 39],
    [105, 44, 175, 44],
    [106, 49, 174, 49],
    [108, 54, 172, 54],
    [112, 59, 168, 59],
    [118, 64, 162, 64],
  ]
  lines.forEach(([x1, y1, x2, y2], i) => {
    ctx.save()
    ctx.globalAlpha = 0.55 + (i % 3) * 0.12
    ctx.lineWidth = 2.2
    ctx.beginPath()
    const ox = i % 2 === 0 ? 0 : 1.5
    ctx.moveTo(x1 + ox, y1)
    ctx.lineTo(x2 - ox, y2)
    ctx.stroke()
    ctx.restore()
  })
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(140, 18)
  ctx.lineTo(140, 66)
  ctx.stroke()
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(118, 42)
  ctx.bezierCurveTo(128, 30, 152, 30, 162, 42)
  ctx.bezierCurveTo(152, 54, 128, 54, 118, 42)
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = INK
  ctx.font = fontMono(6.5, 400)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  tracked(ctx, 'REINDUSTRIALIZE', 140, 12, 1.8, 'center')

  ctx.font = fontMono(18, 800)
  tracked(ctx, 'VAULT', 140, 92, 6, 'center')

  ctx.fillStyle = COBALT
  ctx.font = fontMono(9, 700)
  tracked(ctx, 'WORLDWIDE ®', 140, 108, 3.6, 'center')

  ctx.fillStyle = COBALT
  const dots: [number, number, number][] = [
    [86, 42, 1.4],
    [94, 34, 1.1],
    [94, 50, 1.1],
    [194, 42, 1.4],
    [186, 34, 1.1],
    [186, 50, 1.1],
    [140, 42, 1.6],
  ]
  for (const [dx, dy, r] of dots) {
    ctx.beginPath()
    ctx.arc(dx, dy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

export function paint(ctx: CanvasRenderingContext2D, ops: Op[], w: number, h: number): void {
  ctx.save()
  ctx.fillStyle = CANVAS
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingEnabled = false

  for (const op of ops) {
    switch (op.op) {
      case 'FILL': {
        ctx.fillStyle = op.color
        ctx.fillRect(op.x, op.y, op.w, op.h)
        break
      }
      case 'GLYPH': {
        ctx.fillStyle = op.color
        ctx.font = op.font
        ctx.textAlign = op.track ? 'left' : (op.align ?? 'left')
        ctx.textBaseline = op.baseline ?? 'alphabetic'
        if (op.track) tracked(ctx, op.text, op.x, op.y, op.track, op.align ?? 'left')
        else ctx.fillText(op.text, op.x, op.y)
        break
      }
      case 'STRIKE': {
        ctx.fillStyle = op.color
        ctx.fillRect(op.x, op.y - op.thick / 2, op.w, op.thick)
        break
      }
      case 'CHIP': {
        ctx.fillStyle = op.bg
        ctx.fillRect(op.x, op.y, op.w, op.h)
        ctx.fillStyle = op.fg
        ctx.font = op.font
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const pad = op.padX ?? 6
        ctx.fillText(op.text, op.x + pad, op.y + op.h / 2)
        break
      }
      case 'SEAL': {
        paintSeal(ctx, op.x, op.y, op.w)
        break
      }
      case 'LINE': {
        ctx.strokeStyle = op.color
        ctx.lineWidth = op.width
        if (op.dash) ctx.setLineDash(op.dash)
        else ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(op.x1, op.y1)
        ctx.lineTo(op.x2, op.y2)
        ctx.stroke()
        ctx.setLineDash([])
        break
      }
      case 'GRAIN':
      case 'SCAN':
      case 'INV':
        break
    }
  }
  ctx.restore()
}

export function sizeCanvas(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
): CanvasRenderingContext2D | null {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.floor(cssW * dpr))
  const h = Math.max(1, Math.floor(cssH * dpr))
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

export function makeMeasure(ctx: CanvasRenderingContext2D): (text: string, font: string) => number {
  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}
