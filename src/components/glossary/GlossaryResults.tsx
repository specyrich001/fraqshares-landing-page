import type { ReactNode } from 'react'
import type { GlossaryBlock, ResolvedTerm } from '../../content/glossary/index.ts'
import { GLOSSARY } from './glossaryConfig.ts'
import { matchRanges, type TermGroup } from './glossaryFilter.ts'

/** `text` with the search match marked (GLOSSARY.highlightMatches). */
function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = GLOSSARY.highlightMatches ? matchRanges(text, query) : []
  if (!ranges.length) return text
  const parts: ReactNode[] = []
  let at = 0
  for (const [start, end] of ranges) {
    if (start > at) parts.push(text.slice(at, start))
    parts.push(
      <mark key={start} className="glossary-mark">
        {text.slice(start, end)}
      </mark>,
    )
    at = end
  }
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

function Block({ block, query }: { block: GlossaryBlock; query: string }) {
  // A formula stands out in bold #111 at 70% (Figma: Rental Yield), at the definition's size. Notes
  // render as paragraphs for now.
  return (
    <p className={block.type === 'formula' ? 'font-bold text-body-muted' : undefined}>
      <Highlight text={block.text} query={query} />
    </p>
  )
}

/**
 * One term (Figma 11100:112737): 354 wide, the title, 24px, the definition's blocks a blank line apart.
 * Below 1024 (Figma 11107:113115) the column's width, the title 16px and the definition 14px. Set here,
 * not by stepping the tokens: value-title and body-sm-tight keep their sizes elsewhere on mobile.
 */
function Term({ term, query }: { term: ResolvedTerm; query: string }) {
  return (
    <article id={term.slug} data-term className="glossary-term">
      <h3 className="text-value-title text-strong max-lg:text-[1rem]">
        <Highlight text={term.term} query={query} />
      </h3>
      <div className="mt-6 text-body-sm-tight text-body-faint max-lg:text-[0.875rem] [&>p+p]:mt-[1.4em]">
        {term.definition.map((block, i) => (
          <Block key={i} block={block} query={query} />
        ))}
      </div>
    </article>
  )
}

/** 1px #E4E4E4 rules that take no height, as Figma's 0-tall lines do (so the 50px gaps stay 50). */
const rule = <div aria-hidden="true" className="-mb-px border-t border-border-light" />

/**
 * The term list (Figma 11100:112731), 802 wide: each category with matches, 50px apart: its heading,
 * a rule, the terms in two 354px columns (94px apart, rows 50px apart), a closing rule. Below 1024
 * (Figma 11107:113110) one column, the terms 32px apart.
 */
export function GlossaryList({ groups, query }: { groups: TermGroup[]; query: string }) {
  return groups.map(({ category, terms }) => (
    <section key={category.id} aria-labelledby={`glossary-${category.id}`} className="flex flex-col gap-[50px]">
      <h2 id={`glossary-${category.id}`} className="text-category-title text-strong">
        {category.label}
      </h2>
      {rule}
      <div className="grid grid-cols-[354px_354px] items-start gap-x-[94px] gap-y-[50px] max-lg:grid-cols-1 max-lg:gap-y-8">
        {terms.map((t) => (
          <Term key={t.slug} term={t} query={query} />
        ))}
      </div>
      {rule}
    </section>
  ))
}

/**
 * Nothing matches, Figma 11116:114194: "No results found" (24px Bold) and, 10px under, the hint (18px,
 * #111 at 50%), centred in the list column; GlossarySection centres it against the filters. The same
 * for a search or filters with no terms. Below 1024 the title steps to 20 with the token.
 */
export function GlossaryEmpty() {
  return (
    <div className="flex flex-col gap-2.5 text-center">
      <p className="text-category-title text-strong">No results found</p>
      <p className="text-intro-body-tight text-body-faint">Search for other glossary and get educated</p>
    </div>
  )
}
