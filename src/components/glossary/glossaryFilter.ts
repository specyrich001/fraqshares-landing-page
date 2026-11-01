import { ALL, fold, LETTERS, type Glossary, type GlossaryCategory, type ResolvedTerm } from '../../content/glossary/index.ts'

/**
 * The glossary's filter state and the pure functions over it: no React, no DOM, so any UI (the
 * desktop sidebar now, a mobile drawer later) can drive the same state.
 */
export type GlossaryFilters = {
  /** Search text as typed ('' for none). */
  query: string
  /** A–Z, or ALL. */
  letter: string
  /** A category id, or ALL. */
  category: string
}

export const NO_FILTERS: GlossaryFilters = { query: '', letter: ALL, category: ALL }

export const isFiltered = (f: GlossaryFilters) => f.query.trim() !== '' || f.letter !== ALL || f.category !== ALL

export const matchesQuery = (term: ResolvedTerm, query: string) => {
  const q = fold(query.trim())
  return q === '' || term.searchText.includes(q)
}

/** Every filter combined (AND). */
export const matches = (term: ResolvedTerm, f: GlossaryFilters) =>
  matchesQuery(term, f.query) && (f.letter === ALL || term.letter === f.letter) && (f.category === ALL || term.category === f.category)

export type TermGroup = { category: GlossaryCategory; terms: ResolvedTerm[] }

/** The matching terms by category, in category order; categories with none are left out. */
export function filterGlossary(glossary: Glossary, f: GlossaryFilters): TermGroup[] {
  return glossary.categories
    .map((category) => ({ category, terms: glossary.terms.filter((t) => t.category === category.id && matches(t, f)) }))
    .filter((g) => g.terms.length > 0)
}

/** Where `query` occurs in `text`, ignoring case and accents, as [start, end) offsets into `text`. */
export function matchRanges(text: string, query: string): [number, number][] {
  const q = fold(query.trim())
  if (!q) return []
  // Fold character by character, remembering which original character each folded one came from.
  let folded = ''
  const from: number[] = []
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i])
    folded += f
    for (let k = 0; k < f.length; k++) from.push(i)
  }
  const ranges: [number, number][] = []
  for (let at = folded.indexOf(q); at !== -1; at = folded.indexOf(q, at + q.length)) {
    ranges.push([from[at], from[at + q.length - 1] + 1])
  }
  return ranges
}

/** Filters from a URL's query string (?q=&letter=&category=); unknown values are ignored. */
export function readFilters(search: string, glossary: Glossary): GlossaryFilters {
  const params = new URLSearchParams(search)
  const letter = (params.get('letter') ?? '').toUpperCase()
  const category = params.get('category') ?? ''
  return {
    query: params.get('q') ?? '',
    letter: LETTERS.includes(letter) ? letter : ALL,
    category: glossary.categories.some((c) => c.id === category) ? category : ALL,
  }
}

/** The query string for `f` ('' when nothing is filtered), keeping any other params in `search`. */
export function writeFilters(search: string, f: GlossaryFilters): string {
  const params = new URLSearchParams(search)
  const set = (key: string, value: string, empty: string) => (value && value !== empty ? params.set(key, value) : params.delete(key))
  set('q', f.query.trim(), '')
  set('letter', f.letter, ALL)
  set('category', f.category, ALL)
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** The filters with whichever of them would hide `term` cleared. */
export function revealing(term: ResolvedTerm, f: GlossaryFilters): GlossaryFilters {
  return {
    query: matchesQuery(term, f.query) ? f.query : '',
    letter: f.letter === ALL || f.letter === term.letter ? f.letter : ALL,
    category: f.category === ALL || f.category === term.category ? f.category : ALL,
  }
}
