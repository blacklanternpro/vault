/**
 * Generates the PWA icons. No image dependency: a PNG is a signature plus
 * three chunks, and the mark is three rectangles.
 *
 *   node scripts/make-icons.mjs
 *
 * Black field, cobalt square, one red strike through it: machine, data, hand.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const FIELD = [0x00, 0x00, 0x00]
const COBALT = [0x00, 0x00, 0xff]
const URGENT = [0xff, 0x2b, 0x2b]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  const put = (x, y, rgb) => {
    const row = y * (size * 3 + 1)
    const at = row + 1 + x * 3
    raw[at] = rgb[0]
    raw[at + 1] = rgb[1]
    raw[at + 2] = rgb[2]
  }

  const box = Math.round(size * 0.46)
  const boxX = Math.round((size - box) / 2)
  const boxY = boxX
  const strikeH = Math.max(2, Math.round(size * 0.045))
  const strikeY = Math.round(size * 0.5 - strikeH / 2)
  const strikePad = Math.round(size * 0.14)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rgb = FIELD
      if (x >= boxX && x < boxX + box && y >= boxY && y < boxY + box) rgb = COBALT
      if (y >= strikeY && y < strikeY + strikeH && x >= strikePad && x < size - strikePad) {
        rgb = URGENT
      }
      put(x, y, rgb)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT, { recursive: true })
for (const size of [192, 512]) {
  const file = join(OUT, `icon-${size}.png`)
  writeFileSync(file, png(size))
  console.log(`wrote ${file}`)
}
