import type { RefObject } from 'react'
import { ALL, type Glossary } from '../../content/glossary/index.ts'
import { CloseIcon } from '../icons/MenuIcons.tsx'
import { SortIcon } from '../icons/SortIcon.tsx'
import { focusRing } from '../linkStyles.ts'
import { GlossaryAppliedFilters } from './GlossaryAppliedFilters.tsx'
import { CategoryFilter, LetterFilter } from './GlossaryFilterControls.tsx'
import type { GlossaryFilters } from './glossaryFilter.ts'

type Props = {
  glossary: Glossary
  filters: GlossaryFilters
  input: string
  setInput: (value: string) => void
  setLetter: (letter: string) => void
  setCategory: (category: string) => void
  /** Below 1024: the filter button opens the filter sheet. */
  sheetOpen: boolean
  onOpenSheet: () => void
  sheetButtonRef: RefObject<HTMLButtonElement | null>
}

/**
 * The glossary's filters (Figma 11100:112662), 328 wide: search, the A–Z letter squares and the
 * category list (GlossaryFilterControls), 40px apart. Only renders the state it's given
 * (useGlossaryFilters), which the mobile filter sheet shares, so the filters survive crossing 1024.
 *
 * Sticky, GLOSSARY.topOffset (40px) from the screen's top, so it stays beside the long list; it
 * scrolls on its own if it's taller than the screen (data-lenis-prevent lets the wheel reach it).
 * Without JS it's hidden (glossary.css): every term is listed and there's nothing to filter with.
 *
 * Below 1024 (Figma 11107:113151) it's the filter bar above the list instead: the same search box,
 * flexible, and 20px over, a 40 × 40 filter button, bottom-aligned. The letters and categories move
 * into the filter sheet the button opens. The button is filled olive while a letter or category
 * filter is applied (search alone doesn't count: it isn't in the sheet), following the applied
 * filters, so filters loaded from the URL show at once. The applied filters also show as removable
 * chips, wrapped onto their own line 24px under the bar (GlossaryAppliedFilters).
 */
export function GlossarySidebar({ glossary, filters, input, setInput, setLetter, setCategory, sheetOpen, onOpenSheet, sheetButtonRef }: Props) {
  const filtering = filters.letter !== ALL || filters.category !== ALL
  return (
    <aside
      aria-label="Glossary filters"
      data-glossary-filters
      data-lenis-prevent
      // -m-1 p-1: room for the focus rings inside the scroll box, without moving anything.
      className="sticky top-10 -m-1 flex max-h-[calc(100vh-80px)] w-[336px] shrink-0 flex-col gap-10 overflow-y-auto p-1 max-lg:static max-lg:m-0 max-lg:max-h-none max-lg:w-full max-lg:flex-row max-lg:flex-wrap max-lg:items-end max-lg:gap-x-5 max-lg:gap-y-6 max-lg:overflow-visible max-lg:p-0"
    >
      <div role="search" className="relative max-lg:min-w-0 max-lg:flex-1">
        <label htmlFor="glossary-search" className="sr-only">
          Search all terms
        </label>
        {/* Underlined text (Figma: 23px of text, the 1px line 16px under it; below 1024, 16px text in a
            21px line, the line 18px under it, so the box is the filter button's 40). */}
        <input
          id="glossary-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search all terms"
          autoComplete="off"
          spellCheck={false}
          className="block w-full appearance-none rounded-none border-b border-muted bg-transparent pr-8 pb-4 text-intro-body-tight leading-[23px] text-strong outline-none placeholder:text-label-faint focus:border-strong max-lg:pb-[18px] max-lg:leading-[21px]"
        />
        {input && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setInput('')}
            className={`absolute top-0 right-0 grid size-6 place-items-center text-muted hover:text-strong ${focusRing}`}
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>

      <button
        ref={sheetButtonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        aria-label={filtering ? 'Filter terms (filters active)' : 'Filter terms'}
        onClick={onOpenSheet}
        className={`grid size-10 shrink-0 place-items-center border text-strong transition-[background-color,border-color] duration-200 motion-reduce:transition-none lg:hidden ${focusRing} ${
          filtering ? 'border-transparent bg-olive' : 'border-strong bg-transparent'
        }`}
      >
        <SortIcon />
      </button>

      <GlossaryAppliedFilters
        glossary={glossary}
        filters={filters}
        setLetter={setLetter}
        setCategory={setCategory}
        fallbackFocus={sheetButtonRef}
      />

      <div className="flex flex-col gap-10 max-lg:hidden">
        <LetterFilter glossary={glossary} value={filters.letter} onChange={setLetter} />
        <CategoryFilter glossary={glossary} value={filters.category} onChange={setCategory} />
      </div>
    </aside>
  )
}
