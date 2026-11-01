import { useCallback, useMemo, useRef, useState } from 'react'
import { getGlossary } from '../../content/glossary/index.ts'
import { filterGlossary } from './glossaryFilter.ts'
import { GlossaryFilterSheet } from './GlossaryFilterSheet.tsx'
import { GlossaryEmpty, GlossaryList } from './GlossaryResults.tsx'
import { GlossarySidebar } from './GlossarySidebar.tsx'
import { useGlossaryFilters } from './useGlossaryFilters.ts'
import './glossary.css'

/**
 * The Glossary's main section, Figma: Desktop - 27 (11100:112660), 1440 × 4892, under the intro.
 * White, 130px top and bottom, the 1280 row: the sticky filters (328) and, 150px over, the term list
 * (802), then the disclaimer 50px under the last category.
 *
 * Below 1024 (Figma 11107:113029, 393 wide): 100px top and bottom, 24px sides (560 max on tablets).
 * The filter bar (GlossarySidebar's mobile form, its button opening GlossaryFilterSheet), 50px, then
 * the list in one column. The disclaimer
 * runs on as one paragraph at 18px (larger than the 16px body around it, as designed).
 *
 * Everything comes from getGlossary(). Filters combine (AND) and live in the URL; see
 * useGlossaryFilters. Results fade in quickly when the filters change (not on load); a polite live
 * region says how many terms are showing.
 *
 * The page is prerendered (vite.config.ts, glossaryPrerender) with no filters, so every term is in the
 * HTML without JS. relative z-10 + white: the footer waits a screen up behind the page's end for its
 * reveal, further than the closing link cards (756 tall) reach, so this section covers it too.
 * A filter can leave one term; the closing link cards still follow it, so
 * the page reaches well past the screen with the list's top brought to GLOSSARY.topOffset, and the
 * footer only comes as the reader scrolls on.
 */
export function GlossarySection() {
  const glossary = getGlossary()
  const rowRef = useRef<HTMLDivElement>(null)
  const { filters, input, setInput, setLetter, setCategory, applyFilters, clear } = useGlossaryFilters(glossary, rowRef)
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetButtonRef = useRef<HTMLButtonElement>(null)
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const groups = useMemo(() => filterGlossary(glossary, filters), [glossary, filters])
  const count = groups.reduce((n, g) => n + g.terms.length, 0)

  // Fade only once the filters have changed from what the page loaded with.
  const initial = useRef(filters)
  const changed = filters !== initial.current
  const key = `${filters.query}|${filters.letter}|${filters.category}`

  return (
    <section aria-label="Glossary terms" className="relative z-10 bg-white py-[130px] max-lg:py-[100px]">
      <div ref={rowRef} className="page-row flex items-start gap-[150px] max-lg:max-w-[560px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[50px] max-lg:px-6">
        <GlossarySidebar
          glossary={glossary}
          filters={filters}
          input={input}
          setInput={setInput}
          setLetter={setLetter}
          setCategory={setCategory}
          sheetOpen={sheetOpen}
          onOpenSheet={() => setSheetOpen(true)}
          sheetButtonRef={sheetButtonRef}
        />

        <div className="flex w-[802px] min-w-0 flex-col gap-[50px] max-lg:w-full">
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
          {/* Figma: 18px Medium (the brief said 16), 780 wide, one sentence a line. Below 1024 18px too
              (the token steps to 16), full width, the sentences running on. */}
          <p className="w-[780px] text-intro-body-tight font-medium text-strong max-lg:w-full max-lg:text-[1.125rem]">
            {glossary.settings.disclaimer.map((line, i) => (
              <span key={i} className="lg:block">
                {i > 0 && ' '}
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
      <GlossaryFilterSheet
        open={sheetOpen}
        glossary={glossary}
        filters={filters}
        onApply={applyFilters}
        onClose={closeSheet}
        returnFocus={sheetButtonRef}
      />
    </section>
  )
}
