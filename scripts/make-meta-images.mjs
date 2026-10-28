// Favicon and Open Graph files, from the Figma exports in assets-src/meta:
//   favicon.svg (Figma 11041:50166)  → public/favicon.svg, public/favicon.ico (16/32/48),
//                                      public/apple-touch-icon.png (180)
//   og@2x.png    (Figma 11041:50172) → public/og-image.jpg (1200 × 630)
// Not WebP on purpose: favicons and link previews must load in every browser, crawler and chat app.
// Run: node scripts/make-meta-images.mjs
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import sharp from 'sharp'

const SRC = 'assets-src/meta'
const OUT = 'public'

const svg = readFileSync(`${SRC}/favicon.svg`)
copyFileSync(`${SRC}/favicon.svg`, `${OUT}/favicon.svg`)

const png = (size) => sharp(svg, { density: (72 * size) / 32 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

// ICO: a directory of PNG images (supported everywhere since Windows Vista).
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map(png))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((size, i) => {
  const e = 6 + 16 * i
  header.writeUInt8(size, e) // width
  header.writeUInt8(size, e + 1) // height
  header.writeUInt8(0, e + 2) // palette
  header.writeUInt8(0, e + 3) // reserved
  header.writeUInt16LE(1, e + 4) // planes
  header.writeUInt16LE(32, e + 6) // bits per pixel
  header.writeUInt32LE(images[i].length, e + 8)
  header.writeUInt32LE(offset, e + 12)
  offset += images[i].length
})
writeFileSync(`${OUT}/favicon.ico`, Buffer.concat([header, ...images]))

writeFileSync(`${OUT}/apple-touch-icon.png`, await png(180))

await sharp(`${SRC}/og@2x.png`)
  .flatten({ background: '#034c3c' })
  .resize(1200, 630, { kernel: 'lanczos3' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(`${OUT}/og-image.jpg`)

console.log('meta images: favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180), og-image.jpg (1200 × 630)')
