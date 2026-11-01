// Spam protection for the contact endpoint: a per-IP rate limit, and a hook for a CAPTCHA (off by
// default). The honeypot and the time-to-submit check are in index.ts.

import type { Env } from './destinations.js'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
/** Past this many IPs, forget the oldest (it's only a guard against memory growth). */
const MAX_TRACKED = 5000

const sent = new Map<string, number[]>()

/**
 * True if this IP has already sent MAX_PER_WINDOW messages in the last WINDOW_MS (5 in 10 minutes);
 * otherwise counts this one. In memory: each server instance counts on its own and starts again when
 * it restarts, so it's a brake, not a guarantee (README.md: moving it to a shared store).
 */
export function overRateLimit(ip: string, now = Date.now()): boolean {
  const recent = (sent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    sent.set(ip, recent)
    return true
  }
  recent.push(now)
  sent.delete(ip)
  sent.set(ip, recent)
  if (sent.size > MAX_TRACKED) sent.delete(sent.keys().next().value!)
  return false
}

/**
 * CAPTCHA hook, off by default. CONTACT_CAPTCHA=turnstile (TURNSTILE_SECRET_KEY) or recaptcha
 * (RECAPTCHA_SECRET_KEY) checks the widget's token, posted as cf-turnstile-response or
 * g-recaptcha-response. TODO when turned on: add the widget to the form (ContactForm), with its site key.
 */
export async function passesCaptcha(fields: Record<string, string>, env: Env, ip: string): Promise<boolean> {
  const kind = env.CONTACT_CAPTCHA
  if (!kind || kind === 'none') return true
  const [url, secret, token] =
    kind === 'turnstile'
      ? ['https://challenges.cloudflare.com/turnstile/v0/siteverify', env.TURNSTILE_SECRET_KEY, fields['cf-turnstile-response']]
      : kind === 'recaptcha'
        ? ['https://www.google.com/recaptcha/api/siteverify', env.RECAPTCHA_SECRET_KEY, fields['g-recaptcha-response']]
        : []
  if (!url || !secret || !token) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    })
    return Boolean(((await res.json()) as { success?: boolean }).success)
  } catch {
    return false
  }
}
