// The contact form's validation rules, shared by the form (ContactForm) and the endpoint
// (src/server/contact), so both accept and reject exactly the same input. No imports: the server code
// loads it as plain TypeScript.

export const CONTACT_FIELDS = ['name', 'email', 'message'] as const
export type ContactField = (typeof CONTACT_FIELDS)[number]
export type ContactValues = Record<ContactField, string>
export type ContactErrors = Partial<Record<ContactField, string>>

export const CONTACT_LIMITS = { name: 100, email: 254, message: 2000 } as const

export const CONTACT_MESSAGES = {
  /** As in Figma (11118:115273). */
  required: 'Please complete this required field.',
  // Not designed (FLAGGED): the three below.
  email: 'Please enter a valid email address.',
  nameLength: 'Please keep your name under 100 characters.',
  messageLength: 'Please keep your message under 2,000 characters.',
} as const

/** Something@something.something, no spaces: catches typos without rejecting real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The field's error, or undefined if it's valid. Values are checked trimmed. */
export function validateField(field: ContactField, raw: string): string | undefined {
  const value = raw.trim()
  if (!value) return CONTACT_MESSAGES.required
  if (field === 'name' && value.length > CONTACT_LIMITS.name) return CONTACT_MESSAGES.nameLength
  if (field === 'email' && (value.length > CONTACT_LIMITS.email || !EMAIL.test(value))) return CONTACT_MESSAGES.email
  if (field === 'message' && value.length > CONTACT_LIMITS.message) return CONTACT_MESSAGES.messageLength
  return undefined
}

/** Every field's error (empty when the form is valid). */
export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {}
  for (const field of CONTACT_FIELDS) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  return errors
}

/** What the form sends besides the fields. */
export const CONTACT_EXTRA = {
  /** The honeypot: hidden from people, so anything in it came from a bot. Not "company" or the like,
   *  which browsers may autofill for real people. */
  honeypot: 'website',
  /** Milliseconds from the page loading to Submit (set by the script; no-JS posts don't have it). */
  elapsed: 'elapsedMs',
  /** The page the form was sent from. */
  sourcePage: 'sourcePage',
} as const
