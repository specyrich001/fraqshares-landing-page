import { useEffect, useRef, useState, type FormEvent } from 'react'
import { TickCircleIcon } from '../icons/ContactIcons.tsx'
import { buttonBase, focusRing } from '../linkStyles.ts'
import { smoothScroll } from '../../motion/useSmoothScroll.ts'
import { CONTACT_DETAILS } from './contactDetails.ts'
import {
  CONTACT_EXTRA,
  CONTACT_FIELDS,
  CONTACT_LIMITS,
  validateContact,
  validateField,
  type ContactField,
  type ContactValues,
} from './contactRules.ts'
import './contact.css'

type Status = 'idle' | 'sending' | 'sent' | 'error'
/** Fields whose error has been shown: from then on they're checked as the reader types. */
type Checked = Partial<Record<ContactField, boolean>>
/** fresh: sent just now (not a ?sent=1 load), so focus moves to the success and it is announced. */
type State = { values: ContactValues; checked: Checked; status: Status; fresh?: boolean }

const ENDPOINT = '/api/contact'
const EMPTY: ContactValues = { name: '', email: '', message: '' }

/** Figma's sample input (11118:114640). */
const SAMPLE: ContactValues = {
  name: 'Jonathan Nathaniel Burrows',
  email: 'joenate@email.com',
  message: 'I have been looking at getting into fractional real estate, what makes your platform better than the rest',
}

/** In Node (the prerender) there's no window: the page is built empty, for no-JS readers too. */
const isServer = typeof window === 'undefined'

/**
 * Where the form starts: empty; sent after a no-JS post that went through (/contact?sent=1). In
 * development, ?state= shows each designed state for checking against Figma: empty, filled, error
 * (11118:115060: the email left empty), error-all (Submit pressed on the empty form), submitted, and
 * the undesigned sending and server-error.
 */
function initialState(): State {
  const state: State = { values: EMPTY, checked: {}, status: 'idle' }
  if (isServer) return state
  const params = new URLSearchParams(window.location.search)
  if (params.get('sent') === '1') return { ...state, status: 'sent' }
  if (!import.meta.env.DEV) return state
  switch (params.get('state')) {
    case 'filled':
      return { ...state, values: SAMPLE }
    case 'error':
      return { ...state, values: { ...SAMPLE, email: '' }, checked: { email: true } }
    case 'error-all':
      return { ...state, checked: { name: true, email: true, message: true } }
    case 'submitted':
      return { ...state, status: 'sent' }
    case 'sending':
      return { ...state, values: SAMPLE, status: 'sending' }
    case 'server-error':
      return { ...state, values: SAMPLE, status: 'error' }
    default:
      return state
  }
}

const FIELDS: Record<ContactField, { label: string; placeholder: string; type?: string; autoComplete: string }> = {
  name: { label: 'Name', placeholder: 'Enter your full name', autoComplete: 'name' },
  email: { label: 'Email', placeholder: 'Enter your email address', type: 'email', autoComplete: 'email' },
  message: { label: 'Your Message', placeholder: 'How can we help you?', autoComplete: 'off' },
}

/**
 * The underline is the field's bottom border (#999), 16px under the text. Focused: #111, and 2px while
 * focus-visible (an inset shadow adds the second pixel, so nothing moves). With an error, the error red.
 * Placeholders in label-faint (#111 at 60%), as on the Glossary: Figma's #999 is 2.8:1.
 */
const control =
  'block w-full appearance-none rounded-none border-0 border-b border-muted bg-transparent p-0 pb-[15px] text-field-input text-strong outline-none transition-colors duration-150 placeholder:text-label-faint focus:border-strong focus-visible:shadow-[inset_0_-1px_0_var(--color-strong)] aria-invalid:border-error aria-invalid:focus-visible:shadow-[inset_0_-1px_0_var(--color-error)] motion-reduce:transition-none read-only:cursor-default'

/**
 * The contact card, Figma 11102:112857 (empty), 11118:114640 (filled), 11118:115060 (error) and
 * 11118:114845 (submitted). 604 wide, white, 50px padding; "Contact us" and its line, 50px, the three
 * fields 32px apart (label, 16px, the text, 16px, the underline), 50px, Submit. 672 tall, growing by
 * 32px for each error.
 *
 * Errors show once a field is left invalid, or on Submit (focus then goes to the first invalid field),
 * and from then on update as the reader types. Rules: contactRules.ts, the same ones the endpoint
 * runs. Submit looks unavailable (#EAEAEA) until all three are valid, but stays a working button
 * (aria-disabled, not disabled) so pressing it explains what's missing.
 *
 * Sending: "Sending…", fields read-only, no second submit. Sent: the form fades out (300ms) and the
 * success fades in, centred in the same card; focus goes to its heading. Failure: the input stays and
 * a message above Submit says so (not designed: FLAGGED, as are "Sending…" and the extra error texts).
 *
 * Below 1024 (Figma 11118:115275): full width less 16px a side, 50px top and bottom, 24px sides; the
 * subtitle 14px, no 65px minimum under the title (Figma's header is 50 there), Submit 48 tall with the
 * 14px label. Field text is 16px at every width (field-input), so iOS doesn't zoom in on focus. Sent
 * (not designed for mobile: FLAGGED): as on desktop, the tick 120 and the title 24 (success-title's
 * mobile size); the card keeps the form's height, since the form stays in it, hidden.
 *
 * Without JS the same form posts to /api/contact (the browser's own checks stop empty or malformed
 * fields first), and the endpoint answers with this page again, errors filled in by their
 * data-contact-* attributes (src/server/contact/renderPage.ts), or redirects to ?sent=1#message-sent.
 */
export function ContactForm() {
  const [{ values, checked, status, fresh }, setState] = useState(initialState)
  const inputs = useRef<Partial<Record<ContactField, HTMLInputElement | HTMLTextAreaElement | null>>>({})
  const honeypot = useRef<HTMLInputElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const successTitle = useRef<HTMLHeadingElement>(null)
  const sending = useRef(false)

  const errorOf = (field: ContactField) => (checked[field] ? validateField(field, values[field]) : undefined)
  const ready = CONTACT_FIELDS.every((f) => !validateField(f, values[f]))
  const sent = status === 'sent'
  const busy = status === 'sending'

  // Sent: focus to the success heading and, if the card's top has scrolled above the screen (on a phone,
  // after Submit at its foot), the card back into view.
  useEffect(() => {
    if (!fresh) return
    successTitle.current?.focus({ preventScroll: true })
    const top = card.current!.getBoundingClientRect().top
    if (top >= 0) return
    const y = window.scrollY + top - 16
    const lenis = smoothScroll()
    if (lenis) lenis.scrollTo(y)
    else window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [fresh])

  const setValue = (field: ContactField, value: string) => setState((s) => ({ ...s, values: { ...s.values, [field]: value } }))

  const onBlur = (field: ContactField) => {
    if (validateField(field, values[field])) setState((s) => ({ ...s, checked: { ...s.checked, [field]: true } }))
  }

  const showErrors = (fields: ContactField[]) => {
    setState((s) => ({ ...s, status: 'idle', checked: { ...s.checked, ...Object.fromEntries(fields.map((f) => [f, true])) } }))
    inputs.current[fields[0]]?.focus()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending.current || sent) return
    const errors = validateContact(values)
    const invalid = CONTACT_FIELDS.filter((f) => errors[f])
    if (invalid.length) return showErrors(invalid)

    sending.current = true
    setState((s) => ({ ...s, status: 'sending' }))
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          ...values,
          [CONTACT_EXTRA.honeypot]: honeypot.current?.value ?? '',
          [CONTACT_EXTRA.elapsed]: Math.round(performance.now()),
          [CONTACT_EXTRA.sourcePage]: window.location.pathname,
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; errors?: Partial<Record<ContactField, string>> } | null
      if (res.ok && data?.ok) {
        setState((s) => ({ ...s, status: 'sent', fresh: true }))
      } else if (res.status === 400 && data?.errors) {
        showErrors(CONTACT_FIELDS.filter((f) => data.errors![f]))
      } else {
        setState((s) => ({ ...s, status: 'error' }))
      }
    } catch {
      setState((s) => ({ ...s, status: 'error' }))
    } finally {
      sending.current = false
    }
  }

  return (
    <div ref={card} className="contact-card relative grid w-[604px] min-w-0 shrink-[2] bg-white p-[50px] max-lg:w-full max-lg:px-6">
      <form
        data-contact-form
        method="post"
        action={ENDPOINT}
        // The browser's own checks only without JS; with it, ours (they match, and show Figma's errors).
        noValidate={!isServer}
        onSubmit={onSubmit}
        inert={sent}
        className={`col-start-1 row-start-1 flex flex-col gap-[50px] transition-[opacity,visibility] duration-300 motion-reduce:transition-none ${sent ? 'invisible opacity-0' : ''}`}
      >
        {/* 65 tall in Figma (11114:114188), more than its text: kept, so the fields sit where drawn. */}
        <div className="flex min-h-[65px] flex-col gap-2 max-lg:min-h-0">
          <h2 className="text-card-title text-strong">Contact us</h2>
          <p className="text-body-sm-tight text-body-faint max-lg:text-[0.875rem]">Send us a message and we’ll reply in 24 hours.</p>
        </div>

        <div className="flex flex-col gap-8">
          {CONTACT_FIELDS.map((field) => {
            const { label, placeholder, type, autoComplete } = FIELDS[field]
            const error = errorOf(field)
            const id = `contact-${field}`
            const shared = {
              id,
              name: field,
              'data-contact-input': field,
              placeholder,
              autoComplete,
              required: true,
              // Without JS only: with it, a longer entry gets the length error instead of being cut off.
              maxLength: isServer ? CONTACT_LIMITS[field] : undefined,
              readOnly: busy,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': error ? `${id}-error` : undefined,
              value: values[field],
              onBlur: () => onBlur(field),
            }
            return (
              // The label turns red from the control's aria-invalid, which the no-JS answer can set too.
              <div key={field} className="group flex flex-col gap-4">
                <label htmlFor={id} className="self-start text-field-label text-label-gray group-has-[[aria-invalid=true]]:text-error">
                  {label}
                </label>
                {field === 'message' ? (
                  // 111px of text, the underline 16px below; scrolls when longer. data-lenis-prevent: the
                  // wheel scrolls it, not the page.
                  <textarea
                    {...shared}
                    ref={(el) => void (inputs.current[field] = el)}
                    onChange={(e) => setValue(field, e.target.value)}
                    data-lenis-prevent
                    className={`${control} h-[127px] resize-none overflow-y-auto`}
                  />
                ) : (
                  <input
                    {...shared}
                    ref={(el) => void (inputs.current[field] = el)}
                    type={type ?? 'text'}
                    onChange={(e) => setValue(field, e.target.value)}
                    className={control}
                  />
                )}
                {/* Below 1024 the longer messages wrap: 125% leading there (desktop keeps Figma's 16px line). */}
                <p id={`${id}-error`} data-contact-error={field} hidden={!error} className="text-field-label text-error max-lg:leading-[1.25]">
                  {error}
                </p>
              </div>
            )
          })}
        </div>

        <div>
          {/* Not designed (FLAGGED): above Submit, in the error style with 140% leading (it wraps).
              role="alert": read out when shown. */}
          <p data-contact-server-error role="alert" hidden={status !== 'error'} className="mb-4 text-field-label leading-[1.4] text-error">
            Something went wrong. Please try again or email{' '}
            <a href={`mailto:${CONTACT_DETAILS.email}`} className={`underline underline-offset-2 ${focusRing}`}>
              {CONTACT_DETAILS.email}
            </a>
            .
          </p>
          <button
            type="submit"
            data-contact-submit
            aria-disabled={!ready && !busy ? true : undefined}
            aria-busy={busy || undefined}
            className={`${buttonBase} h-13 w-full justify-center bg-dark px-[18px] py-[14px] text-white hover:bg-forest aria-disabled:bg-button-disabled aria-disabled:text-strong max-lg:h-12 max-lg:text-button-sm ${focusRing}`}
          >
            {busy ? 'Sending…' : 'Submit'}
          </button>
        </div>

        {/* For no-JS posts: what the script sends with the fields. The honeypot is hidden from people
            (and screen readers); a bot that fills it is turned away. */}
        <input type="hidden" name={CONTACT_EXTRA.sourcePage} value="/contact" />
        <div aria-hidden="true" className="absolute top-0 -left-[10000px] size-px overflow-hidden">
          <label htmlFor="contact-website">Leave this empty</label>
          <input ref={honeypot} id="contact-website" type="text" name={CONTACT_EXTRA.honeypot} tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      </form>

      {/* Sent (Figma 11118:114845): the tick (150), 32px, the title and, 8px under, the line (342 wide),
          centred in the card. Without JS, shown by the #message-sent fragment (contact.css). */}
      <div
        id="message-sent"
        data-contact-success
        // Visible at once when sent (so its heading can take focus), fading in; hidden after the fade.
        className={`col-start-1 row-start-1 flex flex-col items-center gap-8 self-center justify-self-center text-center duration-300 motion-reduce:transition-none ${sent ? 'transition-opacity' : 'invisible opacity-0 transition-[opacity,visibility]'}`}
      >
        <TickCircleIcon className="size-[150px] text-ink-success max-lg:size-[120px]" />
        <div className="flex flex-col items-center gap-2">
          <h2 ref={successTitle} tabIndex={-1} className="text-success-title text-ink-success outline-none">
            Thank you for submitting
          </h2>
          <p className="w-[342px] max-w-full text-body text-gray max-lg:w-full">We have received your message and our team will get back to you within 24 hours</p>
        </div>
      </div>

      {/* Announces the success (focus also moves to its heading). */}
      <p aria-live="polite" className="sr-only">
        {fresh ? 'Thank you for submitting. We have received your message and our team will get back to you within 24 hours.' : ''}
      </p>
    </div>
  )
}
