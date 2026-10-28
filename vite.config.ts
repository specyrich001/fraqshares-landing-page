import { rmSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Figma reference renders for the dev-only ?overlay=1 views: served in dev, left out of builds. */
const DEV_ONLY_IMAGES = ['images/steps/sign-up-reference']

function dropDevOnlyImages(): Plugin {
  let outDir = ''
  return {
    name: 'drop-dev-only-images',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const dir of DEV_ONLY_IMAGES) rmSync(path.join(outDir, dir), { recursive: true, force: true })
    },
  }
}

/**
 * %SITE_URL% in index.html: link previews need absolute URLs (og:image, og:url). SITE_URL if set,
 * else Vercel's production domain (VERCEL_PROJECT_PRODUCTION_URL, set on Vercel builds; the custom
 * domain once there is one), else empty (relative URLs, fine locally).
 */
function siteUrl(): Plugin {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const url = (process.env.SITE_URL ?? (vercel ? `https://${vercel}` : '')).replace(/\/$/, '')
  return {
    name: 'site-url',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', url) },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dropDevOnlyImages(), siteUrl()],
})
