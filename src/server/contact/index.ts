// POST /api/contact: the contact form's endpoint (README.md). Runtime-neutral (a web Request in, a
// Response out): api/contact.ts runs it on Vercel, and vite.config.ts (contactApi) in development.
//
// Imports here end in .js, not .ts: Vercel compiles these files to JavaScript and runs them as they
// are, so the paths must name the compiled files (TypeScript and Vite map them back to the .ts).

import {
  CONTACT_EXTRA,
  CONTACT_FIELDS,
  validateContact,
  type ContactErrors,
  type ContactValues,
} from '../../components/contact/contactRules.js'
import { deliver, type ContactPayload, type Env } from './destinations.js'
import { overRateLimit, passesCaptcha } from './protection.js'
import { renderContactPage } from './renderPage.js'

export type ContactContext = {
  env: Env
  /** The Vite dev server: a destination that isn't set up here logs the message and reports success. */
  dev: boolean
  /** The sender's IP, for the rate limit only (it's never sent on). */
  ip: string
  /** The /contact page's HTML, to answer a no-JS post with its errors. */
  loadPage: () => Promise<string>
  log?: (message: string, data?: unknown) => void
}

/** Faster than this from page load to Submit is a script, not a person. */
const MIN_ELAPSED_MS = 3000
const MAX_BODY_BYTES = 16 * 1024
/** Where a no-JS post lands when it went through: the fragment shows the success without JS (contact.css). */
const SENT_URL = '/contact?sent=1#message-sent'

type Outcome =
  | { kind: 'sent' }
  | { kind: 'invalid'; values: ContactValues; errors: ContactErrors }
  | { kind: 'failed'; status: number; error: string; values?: ContactValues }

/** The posted fields as strings, from JSON (the script) or a urlencoded form (no JS). */
async function readFields(request: Request, json: boolean): Promise<Record<string, string> | null> {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) return null
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return null
  if (!json) return Object.fromEntries(new URLSearchParams(text))
  try {
    const data: unknown = JSON.parse(text)
    if (!data || typeof data !== 'object') return null
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '']))
  } catch {
    return null
  }
}

/** The page it was sent from: the form's own field if it's a plain path, else the referrer's path. */
function sourcePageOf(fields: Record<string, string>, request: Request): string {
  const claimed = fields[CONTACT_EXTRA.sourcePage] ?? ''
  if (/^\/(?!\/)[\w\-./]{0,200}$/.test(claimed)) return claimed
  try {
    return new URL(request.headers.get('referer') ?? '').pathname
  } catch {
    return '/contact'
  }
}

async function evaluate(request: Request, json: boolean, ctx: ContactContext, log: NonNullable<ContactContext['log']>): Promise<Outcome> {
  const fields = await readFields(request, json)
  if (!fields) return { kind: 'failed', status: 400, error: 'bad_request' }
  const values = Object.fromEntries(CONTACT_FIELDS.map((f) => [f, fields[f] ?? ''])) as ContactValues

  // Bots: a filled honeypot, or Submit within 3s of the page loading (the script sends the time; a no-JS
  // post doesn't, so it's only checked when present). Answered as if sent, so they learn nothing.
  const elapsed = Number(fields[CONTACT_EXTRA.elapsed])
  if (fields[CONTACT_EXTRA.honeypot] || (fields[CONTACT_EXTRA.elapsed] && elapsed < MIN_ELAPSED_MS)) {
    log('[contact] Dropped as spam (honeypot or too fast).')
    return { kind: 'sent' }
  }
  if (!(await passesCaptcha(fields, ctx.env, ctx.ip))) return { kind: 'failed', status: 400, error: 'captcha', values }

  const errors = validateContact(values)
  if (Object.keys(errors).length) return { kind: 'invalid', values, errors }

  if (overRateLimit(ctx.ip)) return { kind: 'failed', status: 429, error: 'rate_limited', values }

  const payload: ContactPayload = {
    name: values.name.trim(),
    email: values.email.trim(),
    message: values.message.trim(),
    sourcePage: sourcePageOf(fields, request),
    submittedAt: new Date().toISOString(),
  }
  const result = await deliver(payload, { env: ctx.env, dev: ctx.dev, log })
  if ('ok' in result) return { kind: 'sent' }
  log(`[contact] Not delivered: ${result.error}`)
  return { kind: 'failed', status: result.status, error: 'not_delivered', values }
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

export async function handleContactRequest(request: Request, ctx: ContactContext): Promise<Response> {
  const log = ctx.log ?? ((message: string, data?: unknown) => console.log(message, ...(data === undefined ? [] : [data])))
  const json = (request.headers.get('content-type') ?? '').includes('application/json')
  const outcome = await evaluate(request, json, ctx, log)

  if (json) {
    if (outcome.kind === 'sent') return jsonResponse(200, { ok: true })
    if (outcome.kind === 'invalid') return jsonResponse(400, { ok: false, errors: outcome.errors })
    return jsonResponse(outcome.status, { ok: false, error: outcome.error })
  }

  // No JS: post / redirect / get on success, the page again (with the input and errors) otherwise.
  if (outcome.kind === 'sent') return new Response(null, { status: 303, headers: { location: SENT_URL, 'cache-control': 'no-store' } })
  const values = outcome.values ?? { name: '', email: '', message: '' }
  try {
    const page = renderContactPage(await ctx.loadPage(), {
      values,
      errors: outcome.kind === 'invalid' ? outcome.errors : {},
      serverError: outcome.kind === 'failed',
    })
    const status = outcome.kind === 'invalid' ? 400 : outcome.status
    return new Response(page, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
  } catch (err) {
    log(`[contact] Could not load the page to answer with: ${err instanceof Error ? err.stack : String(err)}`)
    return new Response('Something went wrong. Please go back and try again, or email support@fraqshares.com.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}
