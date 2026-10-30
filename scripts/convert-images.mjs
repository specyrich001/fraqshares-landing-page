// Converts raster sources in assets-src/ to WebP in public/images/.
//
//   npm run images            convert new/changed sources
//   npm run images -- --force reconvert everything
//
// Name sources by the scale they were exported at, relative to their CSS display size:
//   hero-phone@2x.png  → hero-phone.webp (1x) + hero-phone@2x.webp
//   hero-phone@3x.png  → same two files, downscaled from 3x
//   badge.png          → badge.webp only (no 2x without upscaling; re-export at 2x for retina)
//
// Optional sidecar <name>.json next to a source, applied in this order:
//   { "flop": true }                                  mirror horizontally (Figma flips)
//   { "crop": { "left", "top", "width", "height" } }  in source pixels, after flop
//   { "widths": [1440, 1920] }                        responsive set → name-1440.webp … + srcset
//   { "widths": [1440], "height": 357 }               stretch to this height at the first width (scaled
//                                                      for the others), like Figma's "fill" on blurs
//   { "quality": 80, "alphaQuality": 60 }             WebP overrides (alpha is lossless at 100,
//                                                      which bloats noise/grain textures)
//   { "lossless": true }                              lossless WebP (fine detail such as halftone dots,
//   { "nearLossless": true, "quality": 60 }           which lossy smears); near-lossless takes quality
//                                                      as its preprocessing level (100 = off)
//   { "flatten": "#0e1711" }                          composite over a colour (drops alpha)
//   { "recomb": [[r],[g],[b]], "offset": [r, g, b] }  colour matrix + offset, after flatten (Figma
//                                                      image filters such as tint, fitted to its render)
// Widths larger than the (cropped) source are skipped with a warning, never upscaled.
//
// Derived assets: <name>.derive.json with "source" (a path relative to it) and the options above
// renders another source a second way — one original, several crops/grades, no second export.
//
// SVGs are skipped: vectors stay SVG and are never rasterised. assets-src/meta (favicon, Open Graph
// image) is skipped too: those need PNG/ICO/JPG, see scripts/make-meta-images.mjs.
// Writes src/generated/images.json: width/height (1x, or the smallest width) for the <img>
// attributes, src, and src2x or srcset.

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-src')
const outDir = path.join(root, 'public', 'images')
const manifestPath = path.join(root, 'src', 'generated', 'images.json')
const QUALITY = 80
const force = process.argv.includes('--force')

const RASTER = /\.(png|jpe?g|webp|avif|tiff?)$/i
const DERIVE = /\.derive\.json$/i

/** Favicon and Open Graph sources: not WebP, made by scripts/make-meta-images.mjs. */
const SKIP = new Set([path.join(srcDir, 'meta')])

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && SKIP.has(full)) continue
    if (entry.isDirectory()) yield* walk(full)
    else if (RASTER.test(entry.name) || DERIVE.test(entry.name)) yield full
  }
}

async function isFresh(out, srcMtime) {
  if (force) return false
  const s = await stat(out).catch(() => null)
  return s !== null && s.mtimeMs >= srcMtime
}

async function readSidecar(file) {
  const p = file.replace(RASTER, '.json')
  const [text, s] = await Promise.all([readFile(p, 'utf8').catch(() => null), stat(p).catch(() => null)])
  return { config: text ? JSON.parse(text) : {}, mtimeMs: s?.mtimeMs ?? 0 }
}

function pipeline(file, config) {
  let img = sharp(file).rotate() // honour EXIF orientation first
  if (config.flop) img = img.flop()
  if (config.crop) img = img.extract(config.crop)
  if (config.flatten) img = img.flatten({ background: config.flatten })
  if (config.recomb) img = img.recomb(config.recomb)
  if (config.offset) img = img.linear([1, 1, 1], config.offset)
  return img
}

/** A raster plus its optional sidecar, or a .derive.json pointing at another raster. */
async function resolveSource(file) {
  if (!DERIVE.test(file)) return { source: file, rel: path.relative(srcDir, file), ...(await readSidecar(file)) }
  const [text, s] = await Promise.all([readFile(file, 'utf8'), stat(file)])
  const config = JSON.parse(text)
  const rel = path.relative(srcDir, file).replace(DERIVE, '.derived')
  return { source: path.resolve(path.dirname(file), config.source), rel, config, mtimeMs: s.mtimeMs }
}

const manifest = {}
let converted = 0
let skipped = 0

for await (const found of walk(srcDir)) {
  const { source: file, rel, config, mtimeMs: sidecarMtime } = await resolveSource(found)
  const parsed = path.parse(rel)
  const match = parsed.name.match(/^(.*?)(?:@(\d)x)?$/)
  const base = match[1]
  const scale = Number(match[2] ?? 1)
  const key = path.join(parsed.dir, base).replaceAll('\\', '/')

  const meta = await sharp(file).rotate().metadata()
  const srcW = config.crop?.width ?? meta.autoOrient.width
  const srcH = config.crop?.height ?? meta.autoOrient.height
  const srcMtime = Math.max((await stat(file)).mtimeMs, sidecarMtime)

  let targets
  if (config.widths) {
    targets = config.widths.filter((w) => {
      if (w <= srcW) return true
      console.warn(`  note: ${rel} is ${srcW}px wide — skipping ${w}w (no upscaling)`)
      return false
    }).map((w) => ({ name: `${base}-${w}.webp`, w }))
  } else {
    const width = Math.round(srcW / scale)
    targets = [{ name: `${base}.webp`, w: width }]
    if (scale >= 2) targets.push({ name: `${base}@2x.webp`, w: width * 2 })
    if (scale < 2) console.warn(`  note: ${rel} has no @2x/@3x suffix — 1x only`)
  }

  await mkdir(path.join(outDir, parsed.dir), { recursive: true })
  const url = (name) => `/images/${parsed.dir ? `${parsed.dir.replaceAll('\\', '/')}/` : ''}${name}`
  // Output height for a given width: proportional, or stretched when the sidecar fixes a height.
  const heightFor = (w) =>
    config.height ? Math.round((config.height * w) / targets[0].w) : Math.round((w * srcH) / srcW)
  const first = targets[0]
  const entry = { width: first.w, height: heightFor(first.w), src: url(first.name) }
  if (config.widths) entry.srcset = targets.map((t) => `${url(t.name)} ${t.w}w`).join(', ')
  else if (targets[1]) entry.src2x = url(targets[1].name)

  for (const t of targets) {
    const out = path.join(outDir, parsed.dir, t.name)
    if (await isFresh(out, srcMtime)) {
      skipped++
      continue
    }
    await pipeline(file, config)
      .resize(
        config.height
          ? { width: t.w, height: heightFor(t.w), fit: 'fill' }
          : { width: t.w, withoutEnlargement: true },
      )
      .webp({
        quality: config.quality ?? QUALITY,
        alphaQuality: config.alphaQuality ?? 100,
        lossless: config.lossless ?? false,
        nearLossless: config.nearLossless ?? false,
        effort: 6,
      })
      .toFile(out)
    converted++
  }

  manifest[key] = entry
}

await mkdir(path.dirname(manifestPath), { recursive: true })
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`images: ${converted} written, ${skipped} up to date, ${Object.keys(manifest).length} in manifest`)
