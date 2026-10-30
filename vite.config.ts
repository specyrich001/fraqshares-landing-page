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

/** Pages besides the home page: each is <name>/index.html, served at /<name>. */
const PAGES = ['about']

/**
 * Dev and preview serve <name>/index.html only at /<name>/; this serves it at /<name> too, as the
 * host does (Vercel serves a folder's index.html without the trailing slash).
 */
function pageUrls(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    const [pathname, query] = (req.url ?? '').split(/(?=\?)/)
    if (PAGES.includes(pathname.slice(1))) req.url = `${pathname}/${query ?? ''}`
    next()
  }
  return {
    name: 'page-urls',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dropDevOnlyImages(), siteUrl(), pageUrls()],
  build: {
    // One HTML file per page, so each has its own title and description without a router or SSR.
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(PAGES.map((name) => [name, path.resolve(import.meta.dirname, name, 'index.html')])),
      },
    },
  },
})
