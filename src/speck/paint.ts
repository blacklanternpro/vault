import type { Op } from './ir'

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

function paintGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amount: number,
): void {
  if (amount <= 0 || w < 1 || h < 1) return
  const n = Math.max(80, Math.floor(w * h * amount * 0.004))
  let s = Math.floor(amount * 9973 + w * 13 + h) >>> 0
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const px = x + (s % Math.floor(w))
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const py = y + (s % Math.floor(h))
    ctx.fillStyle = i % 19 === 0 ? 'rgba(225,6,0,0.4)' : 'rgba(0,0,0,0.32)'
    ctx.fillRect(px, py, 1, 1)
  }
}

function paintScan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amount: number,
): void {
  if (amount <= 0 || w < 1 || h < 1) return
  ctx.strokeStyle = `rgba(244,244,240,${0.05 + amount * 0.45})`
  ctx.lineWidth = 1
  const step = amount > 0.16 ? 2 : 3
  for (let yy = y; yy < y + h; yy += step) {
    ctx.beginPath()
    ctx.moveTo(x, yy)
    ctx.lineTo(x + w, yy)
    ctx.stroke()
  }
}

export function paint(ctx: CanvasRenderingContext2D, ops: Op[], w: number, h: number): void {
  ctx.save()
  ctx.clearRect(0, 0, w, h)
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
      case 'STEM': {
        ctx.fillStyle = op.color
        ctx.font = op.font
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(op.text, op.x, op.y)
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
      case 'GRAIN': {
        paintGrain(ctx, op.x, op.y, op.w, op.h, op.amount)
        break
      }
      case 'SCAN': {
        paintScan(ctx, op.x, op.y, op.w, op.h, op.amount)
        break
      }
      case 'INV': {
        break
      }
      case 'OVAL': {
        ctx.strokeStyle = op.color
        ctx.lineWidth = op.width
        ctx.beginPath()
        ctx.ellipse(
          op.x + op.w / 2,
          op.y + op.h / 2,
          Math.max(1, op.w / 2),
          Math.max(1, op.h / 2),
          0,
          0,
          Math.PI * 2,
        )
        ctx.stroke()
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
