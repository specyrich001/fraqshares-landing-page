import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { Glossary } from '../../content/glossary/index.ts'
import { CloseIcon } from '../icons/MenuIcons.tsx'
import { focusRing } from '../linkStyles.ts'
import { smoothScroll } from '../../motion/useSmoothScroll.ts'
import { CategoryFilter, LetterFilter } from './GlossaryFilterControls.tsx'
import type { GlossaryFilters } from './glossaryFilter.ts'

type Staged = Pick<GlossaryFilters, 'letter' | 'category'>

/** History entry pushed while the sheet is open, so the back gesture closes it. */
const SHEET_STATE = 'glossarySheet'
const sheetEntry = () => Boolean((window.history.state as Record<string, unknown> | null)?.[SHEET_STATE])

/**
 * The mobile filter sheet, Figma: Filter Option (11107:113341), 393 × 852. Below 1024 only; opened by
 * the filter bar's button. Full screen, white, 24px sides (560 max on tablets): "Filter" and the close
 * icon 50px from the top, 50px, the letter squares and the categories (40px apart; the middle scrolls
 * if it's taller than the screen), and "Apply Filter" pinned 50px from the bottom. Safe-area insets
 * are added to both ends.
 *
 * Choices here are staged: opening copies the applied letter and category, and only "Apply Filter"
 * applies them (useGlossaryFilters, which also writes the URL and brings the filter bar into view).
 * The close icon, Esc and the back gesture close it and drop the staged choices. Search isn't here;
 * it stays live on the page. Crossing to desktop closes it, keeping what was applied.
 *
 * A modal dialog: rendered into <body> (outside #root, so nothing on the page stacks over it), the
 * page behind is inert and stops scrolling (Lenis too), focus goes to the title and stays inside, and
 * returns to the filter button on close. Slides up from the bottom (300ms, power3.out curve) and back
 * down (250ms); instant with reduced motion. Client-only: the prerendered page has no sheet.
 */
export function GlossaryFilterSheet({
  open,
  glossary,
  filters,
  onApply,
  onClose,
  returnFocus,
}: {
  open: boolean
  glossary: Glossary
  /** The applied filters: copied in each time the sheet opens. */
  filters: GlossaryFilters
  onApply: (staged: Staged) => void
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [staged, setStaged] = useState<Staged>({ letter: filters.letter, category: filters.category })
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  /** What to do once the sheet's history entry is gone: apply these, or (null) just close. */
  const pending = useRef<Staged | null>(null)

  // Opening: start from what's applied.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setStaged({ letter: filters.letter, category: filters.category })
  }

  const settle = useCallback(() => {
    const action = pending.current
    pending.current = null
    if (action) onApply(action)
    onClose()
  }, [onApply, onClose])

  /** Close, applying `action` or not. Through the history entry if there is one, so it's popped. */
  const finish = useCallback(
    (action: Staged | null) => {
      pending.current = action
      if (sheetEntry()) window.history.back()
      else settle()
    },
    [settle],
  )

  useEffect(() => {
    if (!open) return
    // One entry per opening (StrictMode runs this twice; the second sees the first's).
    if (!sheetEntry()) window.history.pushState({ ...(window.history.state as object | null), [SHEET_STATE]: true }, '')

    const root = document.documentElement
    const page = document.getElementById('root')
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    smoothScroll()?.stop()
    if (page) page.inert = true
    titleRef.current?.focus()

    // The back gesture, or history.back() from finish(): the entry is gone, so close.
    const onPop = () => settle()
    window.addEventListener('popstate', onPop)

    const sheet = sheetRef.current!
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        finish(null)
        return
      }
      if (e.key !== 'Tab') return
      const items = [...sheet.querySelectorAll<HTMLElement>('button:not([disabled])')]
      const first = items[0]
      const last = items[items.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === titleRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    // Crossing to desktop: the sheet has no place there. Close; the applied filters stay.
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onDesktop = () => desktop.matches && finish(null)
    desktop.addEventListener('change', onDesktop)

    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onDesktop)
      root.style.overflow = previousOverflow
      smoothScroll()?.start()
      if (page) page.inert = false
      returnFocus.current?.focus()
    }
  }, [open, settle, finish, returnFocus])

  if (!mounted) return null
  return createPortal(
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-glossary-sheet
      // Visibility changes at once on opening (so the title can take focus straight away) and only
      // after the slide on closing.
      // White to the largest viewport height (Safari with its toolbars hidden or floating), so nothing
      // behind shows below it; the content inside fits the height actually visible (dvh, which follows
      // the toolbars), so Apply Filter stays on screen either way.
      className={`fixed inset-x-0 top-0 z-[60] h-lvh bg-white motion-reduce:transition-none lg:hidden ${
        open
          ? 'visible translate-y-0 transition-[translate] duration-300 ease-[cubic-bezier(0.215,0.61,0.355,1)]'
          : 'invisible translate-y-full transition-[translate,visibility] duration-[250ms] ease-[cubic-bezier(0.55,0.055,0.675,0.19)]'
      }`}
    >
      <div className="mx-auto flex h-dvh w-full max-w-[560px] flex-col px-6">
        <div className="flex shrink-0 items-center justify-between pt-[calc(50px+env(safe-area-inset-top))]">
          {/* card-title steps to 20 below 1024; the sheet's title stays 24 (Figma 11107:113553). */}
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="text-card-title text-strong outline-none max-lg:text-[1.5rem]">
            Filter
          </h2>
          {/* The 24px icon in a 40px target, without moving it. */}
          <button type="button" aria-label="Close filters" onClick={() => finish(null)} className={`-m-2 grid size-10 place-items-center text-black ${focusRing}`}>
            <CloseIcon className="size-6" />
          </button>
        </div>

        {/* -mx-1 px-1: room for the focus rings inside the scroll box. */}
        <div data-lenis-prevent className="-mx-1 mt-[50px] flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto overscroll-contain px-1 pb-1">
          <LetterFilter glossary={glossary} value={staged.letter} onChange={(letter) => setStaged((s) => ({ ...s, letter }))} />
          <CategoryFilter glossary={glossary} value={staged.category} onChange={(category) => setStaged((s) => ({ ...s, category }))} />
        </div>

        <div className="shrink-0 pt-6 pb-[calc(50px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => finish(staged)}
            className={`flex h-10 w-full items-center justify-center bg-black text-button-sm text-white transition-colors hover:bg-forest motion-reduce:transition-none ${focusRing}`}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
