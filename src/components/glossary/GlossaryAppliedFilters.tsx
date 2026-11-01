import { useId, useRef, type RefObject } from 'react'
import { ALL, type Glossary } from '../../content/glossary/index.ts'
import { CloseIcon } from '../icons/MenuIcons.tsx'
import { focusRing } from '../linkStyles.ts'
import type { GlossaryFilters } from './glossaryFilter.ts'

/**
 * Below 1024, under the filter bar (Figma 11113:113846): "Filter:" and a chip for each applied
 * letter or category filter, so one can be dropped without opening the sheet. Category first, then
 * the letter. Each chip is a button (olive at 20%, 10px padding, 14px text at 70%, the 18px X):
 * pressing it removes that filter at once. The category name is cut to 115px with an ellipsis, as in
 * Figma; the button's label has it in full. Nothing renders while neither filter is applied (search
 * isn't shown here: its box is right above).
 *
 * Removing a chip that has focus moves focus to the next chip, or to the filter button when none is
 * left, so the keyboard isn't dropped back to the top of the page.
 */
export function GlossaryAppliedFilters({
  glossary,
  filters,
  setLetter,
  setCategory,
  fallbackFocus,
}: {
  glossary: Glossary
  filters: GlossaryFilters
  setLetter: (letter: string) => void
  setCategory: (category: string) => void
  fallbackFocus: RefObject<HTMLButtonElement | null>
}) {
  const id = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const chips = [
    filters.category !== ALL && {
      key: 'category',
      text: glossary.categories.find((c) => c.id === filters.category)?.label ?? filters.category,
      label: 'category',
      remove: () => setCategory(ALL),
    },
    filters.letter !== ALL && { key: 'letter', text: filters.letter, label: 'letter', remove: () => setLetter(ALL) },
  ].filter((chip) => chip !== false)
  if (!chips.length) return null

  const remove = (chip: (typeof chips)[number], button: HTMLButtonElement) => {
    const hadFocus = document.activeElement === button
    chip.remove()
    if (!hadFocus) return
    requestAnimationFrame(() => (listRef.current?.querySelector('button') ?? fallbackFocus.current)?.focus())
  }

  return (
    <div className="flex basis-full items-center gap-4 lg:hidden">
      <p id={id} className="shrink-0 text-[0.875rem] leading-[1.4] text-label-faint">
        Filter:
      </p>
      <ul ref={listRef} role="list" aria-labelledby={id} className="flex min-w-0 items-center gap-4">
        {chips.map((chip) => (
          <li key={chip.key} className="min-w-0">
            <button
              type="button"
              aria-label={`Remove ${chip.label} filter: ${chip.text}`}
              onClick={(e) => remove(chip, e.currentTarget)}
              className={`flex max-w-full items-center gap-2.5 bg-olive/20 p-2.5 text-[0.875rem] leading-[1.4] tracking-(--ls-tight-body) text-body-muted transition-colors hover:bg-olive/35 motion-reduce:transition-none ${focusRing}`}
            >
              <span className="max-w-[115px] truncate">{chip.text}</span>
              <CloseIcon className="size-[18px] shrink-0 text-black" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
