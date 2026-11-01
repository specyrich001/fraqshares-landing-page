// The no-JS answer to a post that can't go through: the /contact page as built (prerendered, see
// vite.config.ts), with the reader's input put back and the errors shown. It edits the HTML by the
// form's data-contact-* attributes (ContactForm) instead of rendering React here, and the form shows
// errors from attributes alone (aria-invalid, hidden), so the edits need nothing else.

import type { ContactErrors, ContactValues } from '../../components/contact/contactRules.js'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[c]!)

/** The opening tag carrying `marker` (React escapes ">" in attribute values, so the first ">" ends it). */
function findTag(html: string, marker: string) {
  const at = html.indexOf(marker)
  if (at < 0) throw new Error(`Contact page: ${marker} not found`)
  const start = html.lastIndexOf('<', at)
  const end = html.indexOf('>', at) + 1
  return { start, end, tag: html.slice(start, end) }
}

/** Sets (or, with null, removes) attributes on the tag carrying `marker`, then inserts `content` after it. */
function editTag(html: string, marker: string, attrs: Record<string, string | null>, content = '') {
  const { start, end, tag } = findTag(html, marker)
  let next = tag
  for (const [name, value] of Object.entries(attrs)) {
    next = next.replace(new RegExp(`\\s${name}(="[^"]*")?(?=[\\s/>])`), '')
    if (value !== null) next = next.replace(/\s*\/?>$/, (close) => ` ${name}="${escapeHtml(value)}"${close}`)
  }
  return html.slice(0, start) + next + content + html.slice(end)
}

export type PageState = { values: ContactValues; errors: ContactErrors; serverError: boolean }

export function renderContactPage(html: string, { values, errors, serverError }: PageState): string {
  let page = html
  for (const field of ['name', 'email', 'message'] as const) {
    const error = errors[field]
    const invalid: Record<string, string> = error ? { 'aria-invalid': 'true', 'aria-describedby': `contact-${field}-error` } : {}
    page =
      field === 'message'
        ? editTag(page, `data-contact-input="${field}"`, invalid, escapeHtml(values[field]))
        : editTag(page, `data-contact-input="${field}"`, { value: values[field], ...invalid })
    if (error) page = editTag(page, `data-contact-error="${field}"`, { hidden: null }, escapeHtml(error))
  }
  if (serverError) page = editTag(page, 'data-contact-server-error', { hidden: null })
  // The input is valid when only the server failed: Submit in its ready style.
  if (!Object.keys(errors).length) page = editTag(page, 'data-contact-submit', { 'aria-disabled': null })
  return page
}
