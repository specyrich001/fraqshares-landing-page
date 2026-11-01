import { rmSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createServer, defineConfig, type Plugin, type ViteDevServer } from 'vite'

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
const SITE_URL = (() => {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return (process.env.SITE_URL ?? (vercel ? `https://${vercel}` : '')).replace(/\/$/, '')
})()

function siteUrl(): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
  }
}

/** src/prerender/glossary.tsx, as loaded in Node. */
type GlossaryRenderer = {
  assertValidGlossary: () => void
  renderGlossary: (siteUrl: string) => { html: string; jsonLd: string }
}
const GLOSSARY_RENDERER = '/src/prerender/glossary.tsx'

/** Loads the renderer through Vite (TSX, JSON, CSS imports), with the dev server or a throwaway one. */
async function loadGlossaryRenderer(server?: ViteDevServer): Promise<GlossaryRenderer> {
  if (server) return (await server.ssrLoadModule(GLOSSARY_RENDERER)) as GlossaryRenderer
  const temp = await createServer({
    configFile: false,
    root: import.meta.dirname,
    plugins: [react()],
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  try {
    return (await temp.ssrLoadModule(GLOSSARY_RENDERER)) as GlossaryRenderer
  } finally {
    await temp.close()
  }
}

/**
 * /glossary, prerendered: the whole page as HTML in #root (no filters, so every term is there without
 * JS) and its DefinedTermSet JSON-LD in <head>, both from the glossary data. The browser app then
 * renders over it. In dev it's rendered on each request, so edits show.
 *
 * The glossary data is validated when the build or dev server starts (unique slugs and category ids,
 * every category exists, no empty definitions): any problem stops it, listing each one.
 */
function glossaryPrerender(): Plugin {
  let server: ViteDevServer | undefined
  return {
    name: 'glossary-prerender',
    configureServer(s) {
      server = s
    },
    async buildStart() {
      const renderer = await loadGlossaryRenderer()
      renderer.assertValidGlossary()
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        if (!ctx.filename.replaceAll('\\', '/').endsWith('/glossary/index.html')) return html
        const { html: page, jsonLd } = (await loadGlossaryRenderer(ctx.server ?? server)).renderGlossary(SITE_URL)
        return html
          .replace('<div id="root"></div>', () => `<div id="root">${page}</div>`)
          .replace('</head>', () => `    <script type="application/ld+json">${jsonLd}</script>\n  </head>`)
      },
    },
  }
}

/** Pages besides the home page: each is <name>/index.html, served at /<name>. */
const PAGES = ['about', 'glossary']

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
  plugins: [react(), tailwindcss(), dropDevOnlyImages(), siteUrl(), pageUrls(), glossaryPrerender()],
  build: {
    // One HTML file per page, so each has its own title and description without a router or SSR
    // (the Glossary's is prerendered: glossaryPrerender).
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(PAGES.map((name) => [name, path.resolve(import.meta.dirname, name, 'index.html')])),
      },
    },
  },
})
