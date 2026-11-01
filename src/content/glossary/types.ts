/**
 * The glossary's content model. Components read it only through getGlossary() (./index.ts), so the
 * source can move to a CMS later without touching them.
 */

/** A piece of a definition. Text may contain {{minInvestment}}, resolved by getGlossary(). */
export type GlossaryBlock =
  | { type: 'paragraph'; text: string }
  /** Set apart in bold, e.g. Rental Yield's equation. */
  | { type: 'formula'; text: string }
  /** Reserved; renders like a paragraph for now. */
  | { type: 'note'; text: string }

export type GlossaryCategory = {
  /** Unique; used in ?category= and to group terms. */
  id: string
  label: string
}

export type GlossaryTerm = {
  /** Unique; the term's anchor id (/glossary#slug). */
  slug: string
  term: string
  /** A GlossaryCategory id. */
  category: string
  /** Position within its category; terms without one follow, alphabetically. */
  order?: number
  definition: GlossaryBlock[]
  /** Extra search terms (abbreviations, spellings). */
  keywords?: string[]
  /** Slugs of related terms. Reserved: not displayed yet. */
  related?: string[]
  /** ISO date. */
  updatedAt?: string
}

/** Page-level text that isn't a term. */
export type GlossarySettings = {
  /** Shown after the last category, one line each. */
  disclaimer: string[]
}
