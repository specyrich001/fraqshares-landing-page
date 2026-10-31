import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import accessibilityIcon from '../../assets/about/value-accessibility.svg'
import accountabilityIcon from '../../assets/about/value-accountability.svg'
import innovationIcon from '../../assets/about/value-innovation.svg'
import transparencyIcon from '../../assets/about/value-transparency.svg'
import images from '../../generated/images.json'
import { revealLines } from './revealLines.ts'
import { VALUES, VALUES_MEDIA } from './valuesTiming.ts'
import './about-values.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Figma 11051:29346's visible fill: a crop of the 1000 × 1000 original, transparent torn-paper edges. */
const compass = images['about/compass']

// Copy as designed. FLAGGED: Accountability says escrow "ensure[s] accountability", where the FAQ says
// these safeguards "support accountability"; Continuous Innovation has no final period.
const ITEMS = [
  {
    title: 'Transparency',
    icon: transparencyIcon,
    body: 'You should understand what you’re investing in. We aim to make each opportunity’s ownership structure, fees, potential returns, and risks clear, with investment documents and ongoing updates to help you stay informed.',
  },
  {
    title: 'Accessibility',
    icon: accessibilityIcon,
    body: 'A smaller starting point opens the door to more people. Fractional ownership lets you invest without purchasing an entire property, parcel of land, or business. You can start with a share and build from there.',
  },
  {
    title: 'Accountability',
    icon: accountabilityIcon,
    body: 'Shared ownership requires clear responsibilities. Opportunities undergo legal checks, market analysis, and valuation. Professional management and escrow arrangements ensure accountability. These safeguards don’t remove investment risk.',
  },
  {
    title: 'Continuous Innovation',
    icon: innovationIcon,
    body: 'We keep finding ways to make fractional investing simpler. From exploring opportunities to tracking your portfolio, we focus on practical improvements that help you understand and manage your investments',
  },
]

/** DEV, static: ?title=intro (intro played, title in the intro row) or landed (title beside the values). */
function devTitle() {
  if (!import.meta.env.DEV) return null
  const title = new URLSearchParams(window.location.search).get('title')
  return title === 'intro' || title === 'landed' ? title : null
}

/** Document top from layout offsets, so transforms (the title's own travel) don't count. */
function docTop(el: HTMLElement) {
  let y = 0
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop
  return y
}

/**
 * About section 4, Figma: Desktop - 23 (11051:29334), 1440 × 1527, under section 3. Timings:
 * valuesTiming.ts.
 *
 * Intro (plays once, when the intro row is 40% on screen): the compass swings in and settles like a
 * needle finding north, the title's lines rise in with "You!" last, the paragraphs follow.
 *
 * Travel (scrubbed): from when the intro row is centred on screen, the title moves down exactly as far
 * as the page scrolls, so it looks fixed while the compass, paragraphs and divider pass, until the
 * values grid's top reaches it; it has then landed in the empty column beside the values (Figma y 797)
 * and scrolls away with them. A transform, measured from layout and re-measured on refresh, so the
 * title stays the intro row's H2 in the DOM and nothing else moves. z-10 keeps it above the divider.
 * The values then appear in reading order.
 *
 * Reduced motion and no JS: no animation; the Figma frame, everything visible. Only transform and
 * opacity animate. relative z-10 + white: it's the last section, so the footer reveal slides it up off
 * the footer.
 */
export function AboutValues() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(VALUES_MEDIA, (context) => {
        const section = sectionRef.current!
        const row = section.querySelector<HTMLElement>('[data-values-intro]')!
        const title = section.querySelector<HTMLElement>('[data-values-title]')!
        const compassEl = section.querySelector<HTMLElement>('[data-compass]')!
        const paras = gsap.utils.toArray<HTMLElement>('[data-values-copy] > p', section)
        const grid = section.querySelector<HTMLElement>('[data-values-grid]')!
        const items = gsap.utils.toArray<HTMLElement>('[data-value]', section)
        const distance = () => docTop(grid) - docTop(title)

        const frozen = devTitle()
        if (frozen) {
          gsap.set([compassEl, title, ...paras], { opacity: 1 })
          gsap.set(title, { y: frozen === 'landed' ? distance() : 0 })
          return
        }

        // Intro. Split when it plays (fonts are in by then) and back to plain text once it's done. Added to
        // the matchMedia context, so a revert also reverts what it made.
        const { compass: C, title: T, paragraph: P } = VALUES.intro
        const play = context.add('play', () => {
          const { split, tween: lines } = revealLines(title, {
            from: { y: T.rise, opacity: 0 },
            duration: T.duration,
            ease: T.ease,
            stagger: T.stagger,
          })
          const you = title.querySelector<HTMLElement>('[data-you]')!
          gsap.set(title, { opacity: 1 })
          const tl = gsap.timeline({ onComplete: () => split.revert() })
          tl.fromTo(
            compassEl,
            { opacity: 0, scale: C.fromScale, rotate: C.fromRotate },
            { opacity: 1, scale: 1, rotate: 0, duration: C.duration, ease: C.ease },
            C.at,
          )
          tl.to(compassEl, { keyframes: { rotate: C.wobble, easeEach: C.wobbleEase }, duration: C.wobbleDuration, ease: 'none' })
          tl.add(lines, T.at)
          tl.fromTo(you, { opacity: 0, scale: T.youScale }, { opacity: 1, scale: 1, duration: T.duration, ease: T.ease }, T.at + T.youDelay)
          tl.fromTo(paras, { y: P.rise, opacity: 0 }, { y: 0, opacity: 1, duration: P.duration, ease: P.ease, stagger: P.stagger }, P.at)
        }) as () => void
        ScrollTrigger.create({ trigger: row, start: VALUES.intro.start, once: true, onEnter: play })

        // Travel: as far as the page scrolls, for exactly the distance to the grid, so it reads as fixed.
        gsap.fromTo(
          title,
          { y: 0 },
          {
            y: distance,
            ease: 'none',
            scrollTrigger: {
              trigger: row,
              start: VALUES.travel.start,
              end: () => `+=${distance()}`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )

        const R = VALUES.reveal
        if (R.enabled) {
          gsap.fromTo(
            items,
            { opacity: 0, y: R.rise },
            { opacity: 1, y: 0, duration: R.duration, ease: R.ease, stagger: R.stagger, scrollTrigger: { trigger: grid, start: R.start, once: true } },
          )
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} data-values aria-labelledby="values-title" className="relative z-10 bg-white pt-[130px]">
      <div className="page-row flex flex-col gap-[130px]">
        {/* 407 tall, items centred, spread across the row (Figma: 81px gaps; title 80, compass 534.5,
            paragraphs 983). */}
        <div data-values-intro className="flex h-[407px] items-center justify-between gap-[81px]">
          {/* "Our true / north: You!" at 351 wide. */}
          <h2 id="values-title" data-values-title className="relative z-10 w-[351px] shrink-0 text-display-lg text-strong">
            Our true north:{' '}
            <span data-you className="inline-block text-olive">
              You!
            </span>
          </h2>
          <img
            data-compass
            src={compass.src}
            srcSet={compass.srcset}
            sizes="345px"
            width={345}
            height={407}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[407px] w-[345px] shrink-0"
          />
          {/* One empty 18px line between the paragraphs (1.4em). */}
          <div data-values-copy className="w-[377px] shrink-0 text-intro-body-tight text-body-muted [&>p+p]:mt-[1.4em]">
            <p>
              We put investors at the centre of how we build Fraqshares. That means making ownership easier to
              understand, providing clear information about each opportunity, and helping you stay informed throughout
              your investment journey.
            </p>
            <p>
              From your first share to a growing portfolio, our focus is on giving you the clarity and support to make
              your own investment decisions.
            </p>
          </div>
        </div>

        {/* 1px rules that take no height, as in Figma (its lines are 0 tall, so the gaps stay 130). */}
        <div aria-hidden="true" className="-mb-px border-t border-border-light" />

        {/* x 572 to 1360 (492px in from the row's left): the empty column on the left is where the title lands. */}
        <div data-values-grid className="ml-auto grid w-[788px] grid-cols-[354px_354px] gap-20">
          {/* Figma's value frames are 260 tall: its 5-line body box is 110, Chrome's 112, so the height is
              fixed to keep the second row at y 1137. */}
          {ITEMS.map((item) => (
            <div key={item.title} data-value className="h-[260px]">
              <img src={item.icon} width={64} height={64} alt="" className="size-16" />
              <h3 className="mt-10 text-value-title text-strong">{item.title}</h3>
              <p className="mt-6 w-[354px] text-body-sm-tight text-body-faint">{item.body}</p>
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="border-t border-border-light" />
      </div>
    </section>
  )
}
