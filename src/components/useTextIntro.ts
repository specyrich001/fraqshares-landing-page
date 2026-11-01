import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { RefObject } from 'react'
import { INTRO_TEXT as I, INTRO_TEXT_MEDIA } from './about/introTiming.ts'
import { revealLines } from './about/revealLines.ts'

gsap.registerPlugin(useGSAP)

/**
 * A page's opening text on load, About's recipe (introTiming.ts): the H1's lines rise out of their
 * masks one after another, then the `rest` elements fade up in turn. Hidden before first paint, played
 * once the font is in, plain text again afterwards. Never with reduced motion.
 *
 * The H1 needs its line masks widened so descenders aren't cut while the lines rise:
 * [&_.intro-line-mask]:overflow-visible! [&_.intro-line-mask]:[clip-path:inset(-0.2em_-0.15em_-0.25em)]
 */
export function useTextIntro(scope: RefObject<HTMLElement | null>, titleSelector: string, restSelector: string) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(INTRO_TEXT_MEDIA, (context) => {
        const title = scope.current!.querySelector<HTMLElement>(titleSelector)!
        const rest = gsap.utils.toArray<HTMLElement>(restSelector, scope.current)
        const text = [title, ...rest]
        // Opacity, not visibility, so screen readers still have the text while it's hidden.
        gsap.set(text, { opacity: 0 })

        let split: SplitText | undefined
        let cancelled = false
        const play = context.add('play', () => {
          if (cancelled) return
          const reveal = revealLines(title, {
            from: { yPercent: I.heading.yPercent },
            mask: true,
            className: 'intro-line',
            duration: I.heading.duration,
            ease: I.heading.ease,
            stagger: I.heading.stagger,
          })
          split = reveal.split
          gsap.set(title, { opacity: 1 })
          const P = I.paragraphs
          gsap
            .timeline({
              delay: I.delay,
              onComplete: () => {
                split?.revert()
                gsap.set(text, { clearProps: 'opacity,transform,translate,rotate,scale' })
              },
            })
            .add(reveal.tween, 0)
            .fromTo(rest, { opacity: 0, y: P.y }, { opacity: 1, y: 0, duration: P.duration, ease: P.ease, stagger: P.stagger }, P.at)
        }) as () => void
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, I.fontTimeoutMs))]).then(() => play())

        return () => {
          cancelled = true
          split?.revert()
          gsap.set(text, { clearProps: 'opacity,transform,translate' })
        }
      })
    },
    { scope },
  )
}
