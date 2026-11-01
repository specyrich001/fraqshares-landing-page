import { MIN_INVESTMENT } from '../../components/minimumInvestment.ts'
import { categories as sourceCategories } from './categories.ts'
import { settings as sourceSettings } from './settings.ts'
import { terms as sourceTerms } from './terms.ts'
import type { GlossaryBlock, GlossaryCategory, GlossarySettings, GlossaryTerm } from './types.ts'

export type { GlossaryBlock, GlossaryCategory, GlossarySettings, GlossaryTerm }

/**
 * The one way in to the glossary's content: components call getGlossary() and never import the
 * data files, so the source can move to a CMS without changing them. Everything derived (letters,
 * counts, the sidebar's category list) is computed here from the data, never written by hand.
 */

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Value of "All" in the letter and category filters. */
export const ALL = 'all'

/** Case- and accent-insensitive form of a string, for search and letters. */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** A term's letter: its first character, accent-stripped and uppercased. */
export const letterOf = (term: string) => fold(term.trim()).charAt(0).toUpperCase()

/** {{name}} placeholders a definition can use. */
const PLACEHOLDERS: Record<string, string> = {
  minInvestment: MIN_INVESTMENT,
}
const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g

export type ResolvedTerm = Omit<GlossaryTerm, 'definition'> & {
  definition: GlossaryBlock[]
  letter: string
  /** Folded term, keywords and definition, for search. */
  searchText: string
}

export type Glossary = {
  categories: GlossaryCategory[]
  /** Grouped by category (in category order), each group in its curated order. */
  terms: ResolvedTerm[]
  settings: GlossarySettings
  /** A–Z, each with how many terms start with it (0: no terms, so the filter is disabled). */
  letters: { letter: string; count: number }[]
  /** The sidebar's category filter: "All", then each category in order, with term counts. */
  categoryFilters: { id: string; label: string; count: number }[]
}

/** Problems with the data, one message each. Empty when the data is valid. */
export function validateGlossary(categories: GlossaryCategory[], terms: GlossaryTerm[]): string[] {
  const errors: string[] = []
  const seen = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i)

  for (const id of new Set(seen(categories.map((c) => c.id)))) errors.push(`Two categories share the id "${id}".`)
  if (categories.some((c) => c.id === ALL)) errors.push(`"${ALL}" is reserved for the "All" filter; use another category id.`)
  for (const slug of new Set(seen(terms.map((t) => t.slug)))) errors.push(`Two terms share the slug "${slug}".`)

  const categoryIds = new Set(categories.map((c) => c.id))
  const slugs = new Set(terms.map((t) => t.slug))
  for (const t of terms) {
    const name = `"${t.term || t.slug}"`
    if (!t.slug.trim()) errors.push(`${name} has no slug.`)
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug)) errors.push(`${name}: slug "${t.slug}" must be lowercase words joined by hyphens.`)
    if (!t.term.trim()) errors.push(`The term with slug "${t.slug}" has no name.`)
    if (!categoryIds.has(t.category)) errors.push(`${name} is in category "${t.category}", which doesn't exist.`)
    if (!t.definition.length || t.definition.every((b) => !b.text.trim())) errors.push(`${name} has an empty definition.`)
    for (const b of t.definition) {
      for (const [, key] of b.text.matchAll(PLACEHOLDER)) {
        if (!(key in PLACEHOLDERS)) errors.push(`${name} uses {{${key}}}, which isn't a known placeholder.`)
      }
    }
    for (const r of t.related ?? []) if (!slugs.has(r)) errors.push(`${name} lists related term "${r}", which doesn't exist.`)
  }
  return errors
}

export class GlossaryDataError extends Error {
  readonly problems: string[]
  constructor(problems: string[]) {
    super(`Glossary data is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'GlossaryDataError'
    this.problems = problems
  }
}

/** Throws a GlossaryDataError listing every problem. */
export function assertValidGlossary(categories = sourceCategories, terms = sourceTerms) {
  const problems = validateGlossary(categories, terms)
  if (problems.length) throw new GlossaryDataError(problems)
}

const resolve = (text: string) => text.replace(PLACEHOLDER, (_, key: string) => PLACEHOLDERS[key])

/** Curated order first (by `order`), then the rest alphabetically. */
function byPosition(a: GlossaryTerm, b: GlossaryTerm) {
  if (a.order != null && b.order != null) return a.order - b.order
  if (a.order != null) return -1
  if (b.order != null) return 1
  return a.term.localeCompare(b.term, 'en')
}

let cached: Glossary | undefined

export function getGlossary(): Glossary {
  if (cached) return cached
  assertValidGlossary()

  const categories = sourceCategories
  const terms: ResolvedTerm[] = categories.flatMap((c) =>
    sourceTerms
      .filter((t) => t.category === c.id)
      .sort(byPosition)
      .map((t) => {
        const definition = t.definition.map((b) => ({ ...b, text: resolve(b.text) }))
        return {
          ...t,
          definition,
          letter: letterOf(t.term),
          searchText: fold([t.term, ...(t.keywords ?? []), ...definition.map((b) => b.text)].join('\n')),
        }
      }),
  )
  const count = (pred: (t: ResolvedTerm) => boolean) => terms.filter(pred).length

  cached = {
    categories,
    terms,
    settings: sourceSettings,
    letters: LETTERS.map((letter) => ({ letter, count: count((t) => t.letter === letter) })),
    categoryFilters: [
      { id: ALL, label: 'All', count: terms.length },
      ...categories.map((c) => ({ id: c.id, label: c.label, count: count((t) => t.category === c.id) })),
    ],
  }
  return cached
}
