import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { Glossary } from '../../content/glossary/index.ts'
import { smoothScroll } from '../../motion/useSmoothScroll.ts'
import { GLOSSARY } from './glossaryConfig.ts'
import { NO_FILTERS, readFilters, revealing, writeFilters, type GlossaryFilters } from './glossaryFilter.ts'

/**
 * The glossary's filter state, apart from any UI (the sidebar now, a mobile drawer later):
 *  - `input` is the search box as typed; `filters.query` follows it after GLOSSARY.searchDebounceMs.
 *  - The filters live in the URL (?q=&letter=&category=), replaced (not pushed) as they change, and
 *    are restored from it on load.
 *  - A term link (/glossary#slug), on load or in-page: the filters that would hide that term are
 *    cleared, then it's scrolled to and briefly highlighted (data-flash, glossary.css).
 *  - Filtering changes the page's length a lot (29 terms to 1), so after every change the smooth
 *    scroll and the footer reveal's trigger re-measure. And when the reader changes a filter while
 *    scrolled past the top of the results (`topRef`: the row of filters and list, whose top is the
 *    list's on desktop and the filter bar's below 1024), that top is brought back into view, so the
 *    results are read from their start instead of the page ending under them. Applying the mobile
 *    filter sheet always brings it to the top.
 */
export function useGlossaryFilters(glossary: Glossary, topRef: RefObject<HTMLElement | null>) {
  const [filters, setFilters] = useState<GlossaryFilters>(() =>
    typeof window === 'undefined' ? NO_FILTERS : readFilters(window.location.search, glossary),
  )
  const [input, setInputState] = useState(filters.query)
  /** A term waiting to be scrolled to once the list has re-rendered. */
  const [target, setTarget] = useState<string | null>(null)
  const debounce = useRef<number | undefined>(undefined)
  const current = useRef(filters)
  current.current = filters
  /** The next filter change came from the reader (not a term link): bring the results' top into view
   *  if it's above the screen ('above'), or to the top whatever (the sheet's 'apply'). */
  const byReader = useRef<false | 'above' | 'apply'>(false)

  const setInput = useCallback((value: string) => {
    setInputState(value)
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => {
      byReader.current = 'above'
      setFilters((f) => ({ ...f, query: value }))
    }, GLOSSARY.searchDebounceMs)
  }, [])
  const setLetter = useCallback((letter: string) => {
    byReader.current = 'above'
    setFilters((f) => ({ ...f, letter }))
  }, [])
  const setCategory = useCallback((category: string) => {
    byReader.current = 'above'
    setFilters((f) => ({ ...f, category }))
  }, [])
  /** The mobile filter sheet's "Apply Filter": both at once (a new object, so it scrolls even unchanged). */
  const applyFilters = useCallback(({ letter, category }: Pick<GlossaryFilters, 'letter' | 'category'>) => {
    byReader.current = 'apply'
    setFilters((f) => ({ ...f, letter, category }))
  }, [])

  // After each change (not on load): re-measure, then, if the reader changed it, show the list's top.
  const loaded = useRef(false)
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true
      return
    }
    const frame = requestAnimationFrame(() => {
      const lenis = smoothScroll()
      lenis?.resize()
      ScrollTrigger.refresh()
      const mode = byReader.current
      if (!mode) return
      byReader.current = false
      const el = topRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      if (mode === 'above' && top >= GLOSSARY.topOffset) return
      const y = top + window.scrollY - GLOSSARY.topOffset
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo(0, y)
    })
    return () => cancelAnimationFrame(frame)
  }, [filters, topRef])
  useEffect(() => () => window.clearTimeout(debounce.current), [])

  // URL: replace, so filtering doesn't fill the history.
  useEffect(() => {
    const { pathname, search, hash } = window.location
    const next = writeFilters(search, filters)
    if (next !== search) window.history.replaceState(window.history.state, '', `${pathname}${next}${hash}`)
  }, [filters])

  // Term links: reveal the term (clearing only what hides it), then scroll to it once rendered.
  useEffect(() => {
    const open = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1))
      const term = glossary.terms.find((t) => t.slug === slug)
      if (!term) return
      window.clearTimeout(debounce.current)
      byReader.current = false
      const next = revealing(term, current.current)
      setFilters(next)
      setInputState(next.query)
      setTarget(slug)
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [glossary])

  useEffect(() => {
    if (!target) return
    let frame = 0
    let cancelled = false
    // After fonts (they change the layout) and a frame (so the page's smooth scroll is running).
    void document.fonts.ready.then(() => {
      if (cancelled) return
      frame = requestAnimationFrame(() => {
        const el = document.getElementById(target)
        setTarget(null)
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY - GLOSSARY.topOffset
        const lenis = smoothScroll()
        // The list may just have grown (a filter cleared to reveal the term): re-measure first, or the
        // smooth scroll stops at the old page's end.
        lenis?.resize()
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true })
        else window.scrollTo(0, top)
        el.removeAttribute('data-flash')
        void el.offsetWidth // restart the animation if it's the same term again
        el.setAttribute('data-flash', '')
        el.addEventListener('animationend', () => el.removeAttribute('data-flash'), { once: true })
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [target])

  return { filters, input, setInput, setLetter, setCategory, applyFilters }
}
