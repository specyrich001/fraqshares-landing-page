import { useId } from 'react'
import { ALL, type Glossary } from '../../content/glossary/index.ts'
import { focusRing } from '../linkStyles.ts'

/**
 * The letter squares and the category list, shared by the desktop sidebar (GlossarySidebar) and the
 * mobile filter sheet (GlossaryFilterSheet). They only show the value they're given: the sidebar
 * passes the applied filters, the sheet its staged ones. Letters and categories come from the data;
 * a letter with no terms is disabled, and pressing what is already selected does nothing (back to
 * every term is "All").
 *
 * Below 1024 (the sheet, Figma 11107:113557 / 11107:113614) the squares are 10px apart (7 to a row in
 * 345) and both lists are 18px (the token they use steps to 16 there).
 */

/** 40 × 40 letter square (Figma 11100:112669): label 18px / 110% / tight. */
const square = `grid size-10 place-items-center border text-intro-body-tight leading-[1.1] transition-colors duration-150 motion-reduce:transition-none max-lg:text-[1.125rem] ${focusRing}`
const squareState = {
  active: 'border-transparent bg-olive font-medium text-strong',
  idle: 'border-filter-border text-strong hover:border-strong',
  disabled: 'cursor-default border-filter-border-disabled text-disabled',
}

const label = 'text-label-caps text-label-faint uppercase'

export function LetterFilter({ glossary, value, onChange }: { glossary: Glossary; value: string; onChange: (letter: string) => void }) {
  const id = useId()
  return (
    <div>
      <p id={id} className={label}>
        Sort
      </p>
      <div role="group" aria-labelledby={id} className="mt-6 flex flex-wrap gap-2 max-lg:gap-2.5">
        <button
          type="button"
          aria-pressed={value === ALL}
          onClick={value === ALL ? undefined : () => onChange(ALL)}
          className={`${square} ${value === ALL ? squareState.active : squareState.idle}`}
        >
          All
        </button>
        {glossary.letters.map(({ letter, count }) => {
          const active = value === letter
          const disabled = count === 0
          return (
            <button
              key={letter}
              type="button"
              aria-pressed={active}
              aria-disabled={disabled || undefined}
              onClick={disabled || active ? undefined : () => onChange(letter)}
              className={`${square} ${disabled ? squareState.disabled : active ? squareState.active : squareState.idle}`}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CategoryFilter({ glossary, value, onChange }: { glossary: Glossary; value: string; onChange: (category: string) => void }) {
  const id = useId()
  return (
    <div>
      <p id={id} className={label}>
        Categories
      </p>
      <ul role="list" aria-labelledby={id} className="mt-6 flex flex-col gap-4">
        {glossary.categoryFilters.map(({ id: category, label: name }) => {
          const active = value === category
          return (
            <li key={category}>
              <button
                type="button"
                aria-pressed={active}
                onClick={active ? undefined : () => onChange(category)}
                className={`text-left text-intro-body-tight transition-colors duration-150 motion-reduce:transition-none max-lg:text-[1.125rem] ${focusRing} ${
                  active ? 'font-bold text-olive' : 'text-body-muted hover:text-strong'
                }`}
              >
                {name}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
