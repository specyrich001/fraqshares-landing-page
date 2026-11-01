import { readFileSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createServer, defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'

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

/** The renderers in src/prerender, as loaded in Node. */
type GlossaryRenderer = {
  assertValidGlossary: () => void
  renderGlossary: (siteUrl: string) => { html: string; jsonLd: string }
}
type PageRenderer = { renderPage: () => string }
const GLOSSARY_RENDERER = '/src/prerender/glossary.tsx'
/** Pages prerendered as they are (no structured data): <name>/index.html → its renderer. */
const PAGE_RENDERERS: Record<string, string> = {
  contact: '/src/prerender/contact.tsx',
  'privacy-policy': '/src/prerender/privacyPolicy.tsx',
  'terms-and-conditions': '/src/prerender/termsAndConditions.tsx',
}

/** Loads a module through Vite (TSX, JSON, CSS imports), with the dev server or a throwaway one. */
async function loadRenderer<T>(id: string, server?: ViteDevServer): Promise<T> {
  if (server) return (await server.ssrLoadModule(id)) as T
  const temp = await createServer({
    configFile: false,
    root: import.meta.dirname,
    plugins: [react()],
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  try {
    return (await temp.ssrLoadModule(id)) as T
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
 *
 * /contact and the legal pages, prerendered the same way (no structured data; PAGE_RENDERERS): the
 * Contact form can be read and sent without JS, and the legal text is in the HTML.
 */
function pagePrerender(): Plugin {
  let server: ViteDevServer | undefined
  return {
    name: 'glossary-prerender',
    configureServer(s) {
      server = s
    },
    async buildStart() {
      const renderer = await loadRenderer<GlossaryRenderer>(GLOSSARY_RENDERER)
      renderer.assertValidGlossary()
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        const file = ctx.filename.replaceAll('\\', '/')
        const renderer = PAGE_RENDERERS[path.basename(path.dirname(file))]
        if (renderer) {
          const page = (await loadRenderer<PageRenderer>(renderer, ctx.server ?? server)).renderPage()
          return html.replace('<div id="root"></div>', () => `<div id="root">${page}</div>`)
        }
        if (!file.endsWith('/glossary/index.html')) return html
        const { html: page, jsonLd } = (await loadRenderer<GlossaryRenderer>(GLOSSARY_RENDERER, ctx.server ?? server)).renderGlossary(SITE_URL)
        return html
          .replace('<div id="root"></div>', () => `<div id="root">${page}</div>`)
          .replace('</head>', () => `    <script type="application/ld+json">${jsonLd}</script>\n  </head>`)
      },
    },
  }
}

/** Pages besides the home page: each is <name>/index.html, served at /<name>. */
const PAGES = ['about', 'glossary', 'contact', 'privacy-policy', 'terms-and-conditions']

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

/** src/server/contact, as loaded in Node. */
type ContactModule = { handleContactRequest: (request: Request, ctx: object) => Promise<Response> }
const CONTACT_SERVER = '/src/server/contact/index.ts'

type Connect = { use: (route: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => unknown }

/** Hands /api/contact posts to src/server/contact as web Requests, and writes its Responses back. */
function serveContact(
  middlewares: Connect,
  { load, loadPage, dev, mode, root, logger }: {
    load: () => Promise<ContactModule>
    loadPage: () => Promise<string>
    dev: boolean
    mode: string
    root: string
    logger: { info: (message: string) => void }
  },
) {
  middlewares.use('/api/contact', async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'POST' }).end()
      return
    }
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) if (value !== undefined) headers.set(key, String(value))
    const request = new Request(new URL('/api/contact', `http://${req.headers.host ?? 'localhost'}`), {
      method: 'POST',
      headers,
      body: Buffer.concat(chunks),
    })
    const response = await (await load()).handleContactRequest(request, {
      env: { ...loadEnv(mode, root, ''), ...process.env },
      dev,
      ip: req.socket.remoteAddress ?? 'unknown',
      loadPage,
      log: (message: string, data?: unknown) => logger.info(data === undefined ? message : `${message}\n${JSON.stringify(data, null, 2)}`),
    })
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  })
}

/**
 * POST /api/contact locally: the same handler Vercel runs (api/contact.ts). Environment: the shell's,
 * plus .env files (all variables, not only VITE_ ones; they stay on the server).
 * src/server/contact/README.md has the variables.
 *
 * Dev server: answers no-JS posts with the dev /contact page; a destination that isn't set up here (no
 * email API key, say) logs the message while the form shows success. vite preview: the built page,
 * treated as production, as on Vercel (not set up: 503, and the form says so).
 */
function contactApi(): Plugin {
  return {
    name: 'contact-api',
    configureServer(server) {
      const { mode, root, logger } = server.config
      serveContact(server.middlewares, {
        load: () => server.ssrLoadModule(CONTACT_SERVER) as Promise<ContactModule>,
        loadPage: () => server.transformIndexHtml('/contact/index.html', readFileSync(path.join(root, 'contact/index.html'), 'utf8')),
        dev: true,
        mode,
        root,
        logger,
      })
    },
    configurePreviewServer(server) {
      const { mode, root, logger, build } = server.config
      let module: Promise<ContactModule> | undefined
      serveContact(server.middlewares, {
        load: () => (module ??= loadRenderer<ContactModule>(CONTACT_SERVER)),
        loadPage: async () => readFileSync(path.resolve(root, build.outDir, 'contact/index.html'), 'utf8'),
        dev: false,
        mode,
        root,
        logger,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dropDevOnlyImages(), siteUrl(), pageUrls(), pagePrerender(), contactApi()],
  build: {
    // One HTML file per page, so each has its own title and description without a router or SSR
    // (the Glossary's and Contact's are prerendered: pagePrerender).
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(PAGES.map((name) => [name, path.resolve(import.meta.dirname, name, 'index.html')])),
      },
    },
  },
})
