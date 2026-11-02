import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect } from 'react'
import { smoothScroll } from './useSmoothScroll.ts'

/** How long to wait for the web fonts before landing anyway. */
const FONT_TIMEOUT_MS = 1500

/**
 * Arriving from another page on a link with a hash (/#faq, /#getting-started): scroll to that section
 * once the page is really laid out. The browser's own jump fires before React renders, so it finds no
 * element and leaves the page at the top. The pinned scenes also add their spacers when they mount, and
 * the font swap changes section heights, so wait for both and refresh ScrollTrigger before measuring.
 * Links within the page are left to the browser, which already finds the section.
 */
export function useLandOnHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    let cancelled = false

    const fonts = Promise.race([
      document.fonts?.ready,
      new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
    ])
    const loaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }))

    void Promise.all([fonts, loaded]).then(() =>
      requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (cancelled || !target) return
        ScrollTrigger.refresh()
        const y = target.getBoundingClientRect().top + window.scrollY
        const lenis = smoothScroll()
        if (lenis) {
          lenis.resize()
          lenis.scrollTo(y, { immediate: true, force: true })
        } else {
          window.scrollTo(0, y)
        }
      }),
    )

    return () => {
      cancelled = true
    }
  }, [])
}
