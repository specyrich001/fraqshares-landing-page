import { useMemo, useRef } from 'react'
import { getGlossary } from '../../content/glossary/index.ts'
import { filterGlossary } from './glossaryFilter.ts'
import { GlossaryEmpty, GlossaryList } from './GlossaryResults.tsx'
import { GlossarySidebar } from './GlossarySidebar.tsx'
import { useGlossaryFilters } from './useGlossaryFilters.ts'
import './glossary.css'

/**
 * The Glossary's main section, Figma: Desktop - 27 (11100:112660), 1440 × 4892, under the intro.
 * White, 130px top and bottom, the 1280 row: the sticky filters (328) and, 150px over, the term list
 * (802), then the disclaimer 50px under the last category. Desktop only so far.
 *
 * Everything comes from getGlossary(). Filters combine (AND) and live in the URL; see
 * useGlossaryFilters. Results fade in quickly when the filters change (not on load); a polite live
 * region says how many terms are showing.
 *
 * The page is prerendered (vite.config.ts, glossaryPrerender) with no filters, so every term is in the
 * HTML without JS. relative z-10 + white: the last section, so the footer reveal slides it up off the
 * footer. A filter can leave one term, so it's at least a screen tall plus 90px: with the list's top
 * brought to GLOSSARY.topOffset (40px) from the screen's top, the section starts 90px above the screen
 * (130px padding − 40) and still covers it to the bottom; the footer only comes as the reader scrolls on.
 */
export function GlossarySection() {
  const glossary = getGlossary()
  const listRef = useRef<HTMLDivElement>(null)
  const { filters, input, setInput, setLetter, setCategory, clear } = useGlossaryFilters(glossary, listRef)
  const groups = useMemo(() => filterGlossary(glossary, filters), [glossary, filters])
  const count = groups.reduce((n, g) => n + g.terms.length, 0)

  // Fade only once the filters have changed from what the page loaded with.
  const initial = useRef(filters)
  const changed = filters !== initial.current
  const key = `${filters.query}|${filters.letter}|${filters.category}`

  return (
    <section aria-label="Glossary terms" className="relative z-10 min-h-[calc(100vh+90px)] bg-white py-[130px]">
      <div className="page-row flex items-start gap-[150px]">
        <GlossarySidebar
          glossary={glossary}
          filters={filters}
          input={input}
          setInput={setInput}
          setLetter={setLetter}
          setCategory={setCategory}
        />

        <div ref={listRef} className="flex w-[802px] min-w-0 flex-col gap-[50px]">
          <p role="status" className="sr-only">
            {count ? `Showing ${count} ${count === 1 ? 'term' : 'terms'}` : 'No terms found'}
          </p>
          <div key={key} data-glossary-results={changed ? 'changed' : undefined} className="flex flex-col gap-[50px]">
            {count ? (
              <GlossaryList groups={groups} query={filters.query} />
            ) : (
              <GlossaryEmpty query={filters.query} onClear={clear} />
            )}
          </div>
          {/* Figma: 18px Medium (the brief said 16), 780 wide, one sentence a line. */}
          <p className="w-[780px] text-intro-body-tight font-medium text-strong">
            {glossary.settings.disclaimer.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
