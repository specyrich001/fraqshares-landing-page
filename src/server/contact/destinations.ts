// Where a contact message goes: one small adapter per destination, chosen by CONTACT_DESTINATION
// (README.md lists each one's variables). Email to support@fraqshares.com unless it says otherwise;
// switching (to a CRM, say) is a config change only.

export type Env = Record<string, string | undefined>

/** Everything that's sent on: nothing else (no IP address or user agent). */
export type ContactPayload = {
  name: string
  email: string
  message: string
  /** The page the form was sent from, e.g. "/contact". */
  sourcePage: string
  /** ISO 8601, UTC. */
  submittedAt: string
}

/** status: the HTTP status to answer with when it fails (503: not set up, 502: the service failed). */
export type DeliveryResult = { ok: true } | { error: string; status: 502 | 503 }

export type DeliveryContext = { env: Env; dev: boolean; log: (message: string, data?: unknown) => void }

type Deliver = (payload: ContactPayload, ctx: DeliveryContext) => Promise<DeliveryResult>

const DEFAULT_TO = 'support@fraqshares.com'
const TIMEOUT_MS = 8000

const notSetUp = (error: string): DeliveryResult => ({ error, status: 503 })

/** POST JSON somewhere; any non-2xx answer or network error is a failure. */
async function post(url: string, body: unknown, headers: Record<string, string>, what: string): Promise<DeliveryResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) return { ok: true }
    return { error: `${what} answered ${res.status}: ${(await res.text()).slice(0, 300)}`, status: 502 }
  } catch (err) {
    return { error: `${what} failed: ${err instanceof Error ? err.message : String(err)}`, status: 502 }
  }
}

const emailText = (p: ContactPayload) =>
  `${p.message}\n\n—\nFrom: ${p.name} <${p.email}>\nPage: ${p.sourcePage}\nSent: ${p.submittedAt}`

/**
 * "email": a transactional email provider, to CONTACT_TO_EMAIL (default support@fraqshares.com), with
 * reply-to set to the sender so Reply goes to them. CONTACT_EMAIL_PROVIDER picks the provider:
 * "resend" (default, RESEND_API_KEY) or "postmark" (POSTMARK_SERVER_TOKEN). CONTACT_FROM_EMAIL is the
 * sending address, on a domain verified with the provider.
 */
const email: Deliver = async (p, { env }) => {
  const to = env.CONTACT_TO_EMAIL || DEFAULT_TO
  const from = env.CONTACT_FROM_EMAIL
  if (!from) return notSetUp('CONTACT_FROM_EMAIL is not set')
  const subject = `Contact form: ${p.name}`
  const provider = env.CONTACT_EMAIL_PROVIDER || 'resend'

  if (provider === 'resend') {
    if (!env.RESEND_API_KEY) return notSetUp('RESEND_API_KEY is not set')
    return post(
      'https://api.resend.com/emails',
      { from, to: [to], reply_to: p.email, subject, text: emailText(p) },
      { authorization: `Bearer ${env.RESEND_API_KEY}` },
      'Resend',
    )
  }
  if (provider === 'postmark') {
    if (!env.POSTMARK_SERVER_TOKEN) return notSetUp('POSTMARK_SERVER_TOKEN is not set')
    return post(
      'https://api.postmarkapp.com/email',
      { From: from, To: to, ReplyTo: p.email, Subject: subject, TextBody: emailText(p), MessageStream: 'outbound' },
      { accept: 'application/json', 'x-postmark-server-token': env.POSTMARK_SERVER_TOKEN },
      'Postmark',
    )
  }
  return notSetUp(`Unknown CONTACT_EMAIL_PROVIDER "${provider}"`)
}

/**
 * "webhook": POST the payload as JSON to CONTACT_WEBHOOK_URL (Zapier, Make, a Google Sheets Apps Script,
 * a CRM…). Optional CONTACT_WEBHOOK_SECRET is sent as "Authorization: Bearer <secret>".
 * CONTACT_WEBHOOK_FORMAT=slack wraps it as { text } for a Slack incoming webhook, which only takes that.
 */
const webhook: Deliver = async (p, { env }) => {
  const url = env.CONTACT_WEBHOOK_URL
  if (!url) return notSetUp('CONTACT_WEBHOOK_URL is not set')
  const headers: Record<string, string> = env.CONTACT_WEBHOOK_SECRET ? { authorization: `Bearer ${env.CONTACT_WEBHOOK_SECRET}` } : {}
  const body =
    env.CONTACT_WEBHOOK_FORMAT === 'slack'
      ? { text: `*New contact message* from ${p.name} (${p.email}), on ${p.sourcePage}\n>${p.message.replace(/\n/g, '\n>')}` }
      : p
  return post(url, body, headers, 'Webhook')
}

/**
 * "hubspot": create (or update) the contact and attach the message as a note.
 * TODO: not built yet. Needs a HubSpot private app token (HUBSPOT_ACCESS_TOKEN, scopes
 * crm.objects.contacts.write and crm.objects.notes.write), then: upsert the contact by email
 * (POST /crm/v3/objects/contacts, or search + PATCH), create a note (POST /crm/v3/objects/notes) with
 * the message as hs_note_body and submittedAt as hs_timestamp, associated with the contact.
 */
const hubspot: Deliver = async () => notSetUp('The HubSpot destination is not built yet (see destinations.ts)')

/** "none": nothing is sent (it fails with 503, so nobody is told their message arrived). */
const none: Deliver = async () => notSetUp('CONTACT_DESTINATION is none')

const DESTINATIONS: Record<string, Deliver> = { email, webhook, hubspot, none }

/** When CONTACT_DESTINATION isn't set: email, to CONTACT_TO_EMAIL (support@fraqshares.com). */
const DEFAULT_DESTINATION = 'email'

export async function deliver(payload: ContactPayload, ctx: DeliveryContext): Promise<DeliveryResult> {
  const name = ctx.env.CONTACT_DESTINATION || DEFAULT_DESTINATION
  const adapter = DESTINATIONS[name]
  const result = adapter ? await adapter(payload, ctx) : notSetUp(`Unknown CONTACT_DESTINATION "${name}"`)
  // In development, a destination that isn't set up on this machine (no API key, say) logs the message
  // and reports success, so the form can be tried. Anywhere else the 503 stands.
  if (ctx.dev && 'error' in result && result.status === 503) {
    ctx.log(`[contact] Development: "${name}" isn't set up here (${result.error}), so the message is only logged.`, payload)
    return { ok: true }
  }
  return result
}
