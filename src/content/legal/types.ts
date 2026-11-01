// The shape of a legal page's text (Privacy Policy, Terms and Conditions), rendered by LegalPage.
// Text is as supplied; "\n" in it is a line break, "\n\n" a blank line.

export type LegalLink = {
  /** Words in the block's text that become the link (their first occurrence). */
  text: string
  href: string
  /** Underlined only on hover and focus (an email address); otherwise always underlined. */
  plain?: boolean
}

export type LegalBlock =
  /** Prose: Regular, #111 at 70%. */
  | { text: string; link?: LegalLink }
  /** A numbered sub-clause ("4.1. …"): Medium, #111. */
  | { clause: string }
  /** A list, numbered unless `bullets`; items in the prose style. */
  | { list: string[]; bullets?: boolean }

export type LegalSection = { title: string; blocks: LegalBlock[] }

export type LegalDocument = {
  /** The H1's id. */
  id: string
  /** The H1: the olive words, then the white ones ("Privacy" "policy"). */
  title: [olive: string, white: string]
  /** "Last Updated: December, 2024"; `dateTime` is its machine-readable form. */
  updated: { label: string; dateTime: string }
  /** Prose above the first section. */
  intro?: string
  sections: LegalSection[]
}
