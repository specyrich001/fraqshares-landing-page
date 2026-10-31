import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { ExpandingPhoto } from './ExpandingPhoto.tsx'
import { INTRO_TEXT as I, INTRO_TEXT_MEDIA } from './introTiming.ts'
import { revealLines } from './revealLines.ts'

gsap.registerPlugin(useGSAP)

/**
 * About section 1, Figma: Desktop - 20 (11049:449), 1440 × 1225, directly under the header.
 * 130px top and bottom, the 1280 row; the intro row (H1 left, paragraphs right, centred against each
 * other) and 100px under it the photo, which opens to the full window width on scroll.
 *
 * Text intro on load (introTiming.ts, the hero's recipe): the H1's lines rise out of their masks, then
 * the paragraphs fade up. The text is hidden before first paint (layout effect), revealed once the font
 * is in, and the split reverted afterwards so the H1 is plain text again. Never with reduced motion.
 *
 * Bottom padding is measured from the photo's 1280 × 628 box. Fully open, the photo reaches ~39px
 * further up and down (at 1440), so the gaps become ~61px above it and ~91px below.
 *
 * relative z-10 + white: the footer reveal slides it up off the footer (SiteFooter), as the FAQ does
 * on the home page. Desktop only so far: below 1024 the row just stacks.
 */
export function AboutIntro() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(INTRO_TEXT_MEDIA, (context) => {
        const section = sectionRef.current!
        const title = section.querySelector<HTMLElement>('#about-title')!
        const paras = gsap.utils.toArray<HTMLElement>('[data-intro-copy] > p', section)
        const text = [title, ...paras]
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
              // Plain text again, no inline styles.
              onComplete: () => {
                split?.revert()
                gsap.set(text, { clearProps: 'opacity,transform,translate,rotate,scale' })
              },
            })
            .add(reveal.tween, 0)
            .fromTo(paras, { opacity: 0, y: P.y }, { opacity: 1, y: 0, duration: P.duration, ease: P.ease, stagger: P.stagger }, P.at)
        }) as () => void
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, I.fontTimeoutMs))]).then(() => play())

        return () => {
          cancelled = true
          split?.revert()
          gsap.set(text, { clearProps: 'opacity,transform,translate' })
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} aria-labelledby="about-title" className="relative z-10 bg-white py-[130px]">
      <div className="page-row">
        <div className="flex items-center justify-between gap-10 max-lg:flex-col max-lg:items-start">
          {/* One element, two tones: "Building wealth / should have a smaller / starting point." The break
              is explicit: Chrome sets "Building wealth should" 695px wide, so it would fit the 698 box.
              Its intro line masks are widened (as on the hero) so descenders aren't cut while rising. */}
          <h1
            id="about-title"
            className="w-[698px] max-w-full text-page-title text-strong [&_.intro-line-mask]:overflow-visible! [&_.intro-line-mask]:[clip-path:inset(-0.2em_-0.15em_-0.25em)]"
          >
            <span className="text-muted">Building wealth</span>
            <br /> should have a smaller starting point.
          </h1>
          {/* Figma separates the two with an empty 18px line: one line height (1.4em, 25.2px).
              Figma's box is 414, but Chrome sets "…you can own a share of an" 415.25px wide and would wrap
              "an"; 416 with the 2px hung into the gutter keeps Figma's lines and its left edge (x 946). */}
          <div data-intro-copy className="-mr-0.5 w-[416px] max-w-full shrink-0 text-intro-body-tight text-body-muted [&>p+p]:mt-[1.4em]">
            <p>
              Fraqshares makes ownership in real estate, land, and businesses more accessible to Africans at home
              and abroad.
            </p>
            <p>
              Through fractional investing, you can own a share of an asset without covering its full purchase
              price or taking on its day-to-day management.
            </p>
          </div>
        </div>

        <ExpandingPhoto className="mt-[100px]" />
      </div>
    </section>
  )
}
