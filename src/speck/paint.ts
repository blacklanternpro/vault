import type { Op } from './ir'
import { rng } from './noise'
import { FIELD } from './tokens'

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

/** Diagonal connector with a little overshoot past the node. No elbows. */
function paintWire(ctx: CanvasRenderingContext2D, op: Extract<Op, { op: 'WIRE' }>): void {
  const r = rng(op.seed)
  const dx = op.x2 - op.x1
  const dy = op.y2 - op.y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const over = 2 + r() * 3
  // one soft break in the middle so the line is drawn, not printed
  const mx = op.x1 + dx * (0.45 + r() * 0.15) + (r() * 2 - 1) * 1.6
  const my = op.y1 + dy * (0.45 + r() * 0.15) + (r() * 2 - 1) * 1.6

  ctx.save()
  ctx.strokeStyle = op.color
  ctx.lineWidth = op.width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(op.x1, op.y1)
  ctx.lineTo(mx, my)
  ctx.lineTo(op.x2 + ux * over, op.y2 + uy * over)
  ctx.stroke()
  ctx.restore()
}

/** The hand. Jittered, overshooting both ends, wrong on purpose. */
function paintHand(ctx: CanvasRenderingContext2D, op: Extract<Op, { op: 'HAND' }>): void {
  const r = rng(op.seed)
  const lead = 3 + r() * 4
  const tail = 3 + r() * 5
  const x0 = op.x - lead
  const x1 = op.x + op.w + tail
  const steps = 5
  ctx.save()
  ctx.strokeStyle = op.color
  ctx.lineWidth = op.width
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const px = x0 + (x1 - x0) * t
    const py = op.y + (r() * 2 - 1) * 1.5 + Math.sin(t * Math.PI) * (r() - 0.5) * 1.2
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()
}

/** Distorted oval, printed twice a hair apart — riso mis-registration. */
function paintStamp(ctx: CanvasRenderingContext2D, op: Extract<Op, { op: 'STAMP' }>): void {
  const draw = (color: string, dx: number, dy: number, alpha: number) => {
    const r = rng(op.seed)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(op.cx + dx, op.cy + dy)
    ctx.rotate(op.angle)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = op.width
    ctx.lineJoin = 'round'

    const samples = 42
    ctx.beginPath()
    for (let i = 0; i <= samples; i++) {
      const a = (i / samples) * Math.PI * 2
      const wobble = 1 + (r() * 2 - 1) * 0.06
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

  draw(op.ghost, 1.6, -1.4, op.alpha * 0.55)
  draw(op.color, 0, 0, op.alpha)
}

export function paint(ctx: CanvasRenderingContext2D, ops: Op[], w: number, h: number): void {
  ctx.save()
  ctx.fillStyle = FIELD
  ctx.fillRect(0, 0, w, h)

  for (const op of ops) {
    switch (op.op) {
      case 'FILL': {
        ctx.fillStyle = op.color
        ctx.fillRect(op.x, op.y, op.w, op.h)
        break
      }
      case 'GLYPH': {
        ctx.font = op.font
        ctx.textBaseline = op.baseline ?? 'alphabetic'
        const align = op.align ?? 'left'
        if (op.ghost) {
          ctx.fillStyle = op.ghost
          ctx.textAlign = op.track ? 'left' : align
          const gx = op.x + (op.ghostDx ?? 1.5)
          const gy = op.y + (op.ghostDy ?? 0)
          if (op.track) tracked(ctx, op.text, gx, gy, op.track, align)
          else ctx.fillText(op.text, gx, gy)
        }
        ctx.fillStyle = op.color
        ctx.textAlign = op.track ? 'left' : align
        if (op.track) tracked(ctx, op.text, op.x, op.y, op.track, align)
        else ctx.fillText(op.text, op.x, op.y)
        break
      }
      case 'CHIP': {
        ctx.fillStyle = op.bg
        ctx.fillRect(op.x, op.y, op.w, op.h)
        ctx.fillStyle = op.fg
        ctx.font = op.font
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(op.text, op.x + (op.padX ?? 6), op.y + op.h / 2)
        break
      }
      case 'LINE': {
        ctx.strokeStyle = op.color
        ctx.lineWidth = op.width
        ctx.setLineDash(op.dash ?? [])
        ctx.beginPath()
        ctx.moveTo(op.x1, op.y1)
        ctx.lineTo(op.x2, op.y2)
        ctx.stroke()
        ctx.setLineDash([])
        break
      }
      case 'DOT': {
        ctx.beginPath()
        ctx.arc(op.cx, op.cy, op.r, 0, Math.PI * 2)
        if (op.filled) {
          ctx.fillStyle = op.color
          ctx.fill()
        } else {
          ctx.strokeStyle = op.color
          ctx.lineWidth = op.width
          ctx.stroke()
        }
        break
      }
      case 'WIRE': {
        paintWire(ctx, op)
        break
      }
      case 'HAND': {
        paintHand(ctx, op)
        break
      }
      case 'STAMP': {
        paintStamp(ctx, op)
        break
      }
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
