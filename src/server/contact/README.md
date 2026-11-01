# Contact form backend

`POST /api/contact` takes the Contact page's form, checks it, and sends it on to one destination.
Switching destination is a matter of environment variables; no code changes.

| File | What it does |
| --- | --- |
| `index.ts` | The endpoint: reads the post, spam checks, validation, rate limit, delivery, the answer |
| `destinations.ts` | One adapter per destination: `deliver(payload) → { ok } \| { error }` |
| `protection.ts` | Per-IP rate limit, CAPTCHA hook (off) |
| `renderPage.ts` | The no-JS answer: the /contact page again, with the input and errors filled in |
| `../../components/contact/contactRules.ts` | The validation rules, shared with the form |
| `../../../api/contact.ts` | The Vercel function that runs `index.ts` |

Locally, `npm run dev` and `vite preview` serve the same endpoint (`contactApi` in `vite.config.ts`),
reading variables from the shell and from `.env` / `.env.local` (git-ignored).

## What's sent

```json
{ "name": "…", "email": "…", "message": "…", "sourcePage": "/contact", "submittedAt": "2026-11-01T19:05:42.820Z" }
```

Trimmed values, and nothing else: no IP address or user agent (the IP is only used for the rate limit,
in memory).

## Choosing the destination: `CONTACT_DESTINATION`

Unset, it's `email`: messages go to support@fraqshares.com. To send them somewhere else (a CRM,
say), set `CONTACT_DESTINATION` and that destination's variables below; no code changes.

A destination that isn't set up (a missing API key or URL) answers 503 and the form shows its
"Something went wrong" message, so nobody is told their message arrived when it went nowhere. In
development (`npm run dev`) it logs the message in the terminal instead and the form shows success,
so the form can be tried without keys.

### Setting up email on Vercel (Project → Settings → Environment Variables)

1. Make an account with the provider (Resend, or Postmark) and verify the fraqshares.com domain there
   (it gives DNS records to add).
2. Add `RESEND_API_KEY` (or `CONTACT_EMAIL_PROVIDER=postmark` and `POSTMARK_SERVER_TOKEN`).
3. Add `CONTACT_FROM_EMAIL`, an address on the verified domain, e.g. `Fraqshares <contact@fraqshares.com>`.
4. Redeploy.

### `email`

| Variable | |
| --- | --- |
| `CONTACT_EMAIL_PROVIDER` | `resend` (default) or `postmark` |
| `RESEND_API_KEY` | for Resend |
| `POSTMARK_SERVER_TOKEN` | for Postmark |
| `CONTACT_FROM_EMAIL` | required: the sending address, on a domain verified with the provider, e.g. `Fraqshares <contact@fraqshares.com>` |
| `CONTACT_TO_EMAIL` | where it goes; default `support@fraqshares.com` |

Reply-to is the sender's email, so replying answers them.

### `webhook`

| Variable | |
| --- | --- |
| `CONTACT_WEBHOOK_URL` | required: receives the payload as a JSON POST |
| `CONTACT_WEBHOOK_SECRET` | optional: sent as `Authorization: Bearer <secret>` |
| `CONTACT_WEBHOOK_FORMAT` | `slack` wraps it as `{ "text": "…" }` for a Slack incoming webhook (which only accepts that) |

Works for Zapier, Make, a Google Sheets Apps Script web app, or a CRM's inbound webhook. Any non-2xx
answer counts as a failure (the form shows its error message).

### `none`

Nothing is sent: the endpoint answers 503 (logged instead in development).

### `hubspot`

Stub only: answers 503 until it's built. The TODO in `destinations.ts` lists what it needs (a private
app token in `HUBSPOT_ACCESS_TOKEN`, contact upsert and a note).

## Spam protection

- **Honeypot:** a hidden `website` field. Filled → answered as sent, not delivered.
- **Time to submit:** the script sends the milliseconds since page load; under 3s → answered as sent,
  not delivered. No-JS posts don't have it and skip this check.
- **Rate limit:** 5 delivered messages per IP per 10 minutes, then 429. In memory, per server
  instance, so it's a brake rather than a guarantee; for a hard limit move `overRateLimit` to a
  shared store (e.g. Upstash Redis).
- **CAPTCHA (off):** `CONTACT_CAPTCHA=turnstile` with `TURNSTILE_SECRET_KEY`, or `recaptcha` with
  `RECAPTCHA_SECRET_KEY`. The server check is written; the widget still has to be added to the form.

## Answers

| | JSON (the form's script) | Form post (no JS) |
| --- | --- | --- |
| Sent | 200 `{ ok: true }` | 303 to `/contact?sent=1#message-sent` |
| Invalid | 400 `{ ok: false, errors: { field: message } }` | 400, the page with the errors |
| Too many | 429 `{ ok: false, error: "rate_limited" }` | 429, the page with the error message |
| Not delivered | 502 / 503 `{ ok: false, error: "not_delivered" }` | same status, the page with the error message |
