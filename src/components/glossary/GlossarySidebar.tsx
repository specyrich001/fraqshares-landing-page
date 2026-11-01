import { ALL, type Glossary } from '../../content/glossary/index.ts'
import { CloseIcon } from '../icons/MenuIcons.tsx'
import { focusRing } from '../linkStyles.ts'
import type { GlossaryFilters } from './glossaryFilter.ts'

type Props = {
  glossary: Glossary
  filters: GlossaryFilters
  input: string
  setInput: (value: string) => void
  setLetter: (letter: string) => void
  setCategory: (category: string) => void
}

/** 40 × 40 letter square (Figma 11100:112669): label 18px / 110% / tight. */
const square = `grid size-10 place-items-center border text-intro-body-tight leading-[1.1] transition-colors duration-150 motion-reduce:transition-none ${focusRing}`
const squareState = {
  active: 'border-transparent bg-olive font-medium text-strong',
  idle: 'border-filter-border text-strong hover:border-strong',
  disabled: 'cursor-default border-filter-border-disabled text-disabled',
}

/**
 * The glossary's filters (Figma 11100:112662), 328 wide: search, the A–Z letter squares and the
 * category list, 40px apart. Only renders the state it's given (useGlossaryFilters), so a mobile
 * drawer can reuse the same state. Letters and categories come from the data: a letter with no
 * terms is disabled.
 *
 * Sticky, GLOSSARY.topOffset (40px) from the screen's top, so it stays beside the long list; it
 * scrolls on its own if it's taller than the screen (data-lenis-prevent lets the wheel reach it).
 * Without JS it's hidden (glossary.css): every term is listed and there's nothing to filter with.
 */
export function GlossarySidebar({ glossary, filters, input, setInput, setLetter, setCategory }: Props) {
  return (
    <aside
      aria-label="Glossary filters"
      data-glossary-filters
      data-lenis-prevent
      // -m-1 p-1: room for the focus rings inside the scroll box, without moving anything.
      className="sticky top-10 -m-1 flex max-h-[calc(100vh-80px)] w-[336px] shrink-0 flex-col gap-10 overflow-y-auto p-1"
    >
      <div role="search" className="relative">
        <label htmlFor="glossary-search" className="sr-only">
          Search all terms
        </label>
        {/* Underlined text (Figma: 23px of text, the 1px line 16px under it). */}
        <input
          id="glossary-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search all terms"
          autoComplete="off"
          spellCheck={false}
          className="block w-full appearance-none rounded-none border-b border-muted bg-transparent pr-8 pb-4 text-intro-body-tight leading-[23px] text-strong outline-none placeholder:text-muted focus:border-strong"
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

      <div>
        <p id="glossary-sort-label" className="text-label-caps text-label-faint uppercase">
          Sort
        </p>
        <div role="group" aria-labelledby="glossary-sort-label" className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filters.letter === ALL}
            onClick={() => setLetter(ALL)}
            className={`${square} ${filters.letter === ALL ? squareState.active : squareState.idle}`}
          >
            All
          </button>
          {glossary.letters.map(({ letter, count }) => {
            const active = filters.letter === letter
            const disabled = count === 0
            return (
              <button
                key={letter}
                type="button"
                aria-pressed={active}
                aria-disabled={disabled || undefined}
                onClick={disabled ? undefined : () => setLetter(active ? ALL : letter)}
                className={`${square} ${disabled ? squareState.disabled : active ? squareState.active : squareState.idle}`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p id="glossary-categories-label" className="text-label-caps text-label-faint uppercase">
          Categories
        </p>
        <ul role="list" aria-labelledby="glossary-categories-label" className="mt-6 flex flex-col gap-4">
          {glossary.categoryFilters.map(({ id, label }) => {
            const active = filters.category === id
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(id)}
                  className={`text-left text-intro-body-tight transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                    active ? 'font-bold text-olive' : 'text-body-muted hover:text-strong'
                  }`}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
