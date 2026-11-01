// Fraqshares' contact details, in one place: the Contact page shows them, and the footer or other
// pages can reuse them. No imports, so the server code (src/server/contact) can use it too.

const ADDRESS_LINES = ['ICAN Office, 82 MM Way,', 'Ebutte Metta, Lagos State'] as const

export const CONTACT_DETAILS = {
  email: 'support@fraqshares.com',
  phone: {
    /** As shown (Figma 11116:114557). */
    display: '+234(0)813 013 9597',
    /** The tel: number: international, no trunk 0 or spaces. */
    tel: '+2348130139597',
  },
  /** As shown, one line each (Figma 11116:114592). */
  addressLines: ADDRESS_LINES,
  /** A Google Maps search for the address (opens in a new tab). */
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_LINES.join(' '))}`,
} as const
