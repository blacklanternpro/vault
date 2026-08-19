import type { Op } from './ir'
import { CANVAS } from './tokens'

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
      case 'SEAL':
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
