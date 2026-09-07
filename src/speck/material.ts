const VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FS = `
precision mediump float;
varying vec2 vUv;
uniform float uGrain;
uniform float uScan;
uniform vec2 uRes;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 pix = floor(vUv * uRes);
  float g = (hash(pix) - 0.5) * uGrain * 1.4;
  float scan = sin(pix.y * 3.14159265) * uScan * 0.28;
  float v = 0.9 + g - scan;
  float a = 0.42 * max(uGrain * 4.0, uScan * 2.2);
  gl_FragColor = vec4(vec3(v), clamp(a, 0.0, 0.55));
}
`

type GlHandle = {
  gl: WebGLRenderingContext
  program: WebGLProgram
  buf: WebGLBuffer
  grainLoc: WebGLUniformLocation | null
  scanLoc: WebGLUniformLocation | null
  resLoc: WebGLUniformLocation | null
}

let handle: GlHandle | null = null
let glFailed = false

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function getHandle(canvas: HTMLCanvasElement): GlHandle | null {
  if (glFailed) return null
  if (handle && handle.gl.canvas === canvas) return handle
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
  })
  if (!gl) {
    glFailed = true
    return null
  }
  const vs = compileShader(gl, gl.VERTEX_SHADER, VS)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS)
  if (!vs || !fs) {
    glFailed = true
    return null
  }
  const program = gl.createProgram()
  if (!program) {
    glFailed = true
    return null
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    glFailed = true
    return null
  }
  const buf = gl.createBuffer()
  if (!buf) {
    glFailed = true
    return null
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  handle = {
    gl,
    program,
    buf,
    grainLoc: gl.getUniformLocation(program, 'uGrain'),
    scanLoc: gl.getUniformLocation(program, 'uScan'),
    resLoc: gl.getUniformLocation(program, 'uRes'),
  }
  return handle
}

function paintFallback(canvas: HTMLCanvasElement, cssW: number, cssH: number, grain: number, scan: number): void {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.floor(cssW * dpr))
  const h = Math.max(1, Math.floor(cssH * dpr))
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  if (grain <= 0 && scan <= 0) return
  const img = ctx.createImageData(w, h)
  const data = img.data
  let s = 9029
  for (let y = 0; y < h; y++) {
    const scanV = scan > 0 && y % 2 === 0 ? scan * 40 : 0
    for (let x = 0; x < w; x++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0
      const g = grain > 0 ? (s & 255) * grain * 0.35 : 0
      const i = (y * w + x) * 4
      const v = 230 - g - scanV
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = Math.min(90, 20 + grain * 180 + scan * 80)
    }
  }
  ctx.putImageData(img, 0, 0)
}

export function paintMaterial(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  grain: number,
  scan: number,
): void {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.floor(cssW * dpr))
  const h = Math.max(1, Math.floor(cssH * dpr))
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`

  if (grain <= 0 && scan <= 0) {
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
    if (handle && handle.gl.canvas === canvas) {
      const gl = handle.gl
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    } else {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, w, h)
    }
    return
  }

  if (canvas.width !== w || canvas.height !== h) {
    handle = null
    canvas.width = w
    canvas.height = h
  }
  const hx = getHandle(canvas)
  if (!hx) {
    paintFallback(canvas, cssW, cssH, grain, scan)
    return
  }
  const { gl, program, buf, grainLoc, scanLoc, resLoc } = hx
  gl.viewport(0, 0, w, h)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  if (grainLoc) gl.uniform1f(grainLoc, grain)
  if (scanLoc) gl.uniform1f(scanLoc, scan)
  if (resLoc) gl.uniform2f(resLoc, w, h)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}
