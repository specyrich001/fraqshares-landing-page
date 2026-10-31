import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, type CSSProperties } from 'react'
import images from '../../generated/images.json'
import { MISSION, MISSION_MEDIA } from './missionTiming.ts'
import './about-mission.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Figma 11053:31690 crops the shared green blur exactly as the Getting Started glow does (same source,
 *  same crop, same 0.63 tint on #0E1711), so it's that image, stretched to 1440 × 230. */
const glow = images['steps/glow']

/** Back to front: each card lands on the one before it, `MISSION.stack.step` lower. Add cards here. */
const CARDS = [
  {
    id: 'mission',
    title: 'Our Mission',
    body: 'To make fractional ownership more accessible to Africans at home and abroad, opening up opportunities to build wealth through real estate, land, and businesses.',
    className: 'bg-olive',
  },
  {
    id: 'vision',
    title: 'Our Vision',
    body: 'A future where more Africans can participate in the ownership and potential value of the properties and businesses around them.',
    className: 'bg-white',
  },
]

/** DEV, static, no pin: ?stack=mission (Mission alone, as the pin starts) or stacked (the end). */
function devStack() {
  if (!import.meta.env.DEV) return null
  const stack = new URLSearchParams(window.location.search).get('stack')
  return stack === 'mission' || stack === 'stacked' ? stack : null
}

/**
 * About section 3, Figma: Desktop - 22 (11050:465), 1440 × 1024, under section 2. Timings:
 * missionTiming.ts. Its dark background comes from the shared backdrop (AboutBackdrop), which
 * fades in from section 2's grey as this section comes up.
 *
 * The section is one screen tall with the stack centred (Figma: 488 × 518, y 253–771). Mission rises in
 * as it arrives; the section pins (1.2 screens), holds on Mission, then Vision slides up from below the
 * screen onto it, 40px lower, and Mission's text dims to read as behind. Hold, unpin. Only transform
 * and opacity animate. Both cards stay in the DOM in reading order, so screen readers get both.
 *
 * Without the scene (no JS, reduced motion): no pin, the cards side by side (about-mission.css).
 */
export function AboutMission() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MISSION_MEDIA, () => {
        const section = sectionRef.current!
        const stackEl = section.querySelector<HTMLElement>('[data-mission-cards]')!
        const cards = gsap.utils.toArray<HTMLElement>('[data-card]', section)
        const contents = cards.map((card) => card.querySelector<HTMLElement>('[data-card-content]')!)
        const frozen = devStack()
        section.dataset.animate = ''

        const { enter: E, pin: P, stack: K } = MISSION

        // Mission rises in while the section comes up.
        const enter = gsap.fromTo(
          cards[0],
          { y: E.rise, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: E.ease,
            paused: !!frozen,
            scrollTrigger: frozen ? undefined : { trigger: section, start: E.start, end: E.end, scrub: E.scrub },
          },
        )
        if (frozen) enter.progress(1)

        // The pinned stack. Each later card waits below the screen: the section is pinned at the top,
        // so a card's resting top on screen is its offset in the section (offsets ignore transforms).
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          paused: !!frozen,
          scrollTrigger: frozen
            ? undefined
            : {
                trigger: section,
                start: P.start,
                end: () => `+=${window.innerHeight * P.length}`,
                pin: true,
                scrub: P.scrub,
                invalidateOnRefresh: true,
              },
        })
        const each = (K.to - K.from) / Math.max(1, cards.length - 1)
        cards.slice(1).forEach((card, i) => {
          const at = K.from + each * i
          tl.fromTo(
            card,
            { y: () => window.innerHeight - (stackEl.offsetTop + card.offsetTop) + K.offscreen },
            { y: 0, duration: each, ease: K.ease },
            at,
          )
          // As it lands, the card it covers dims its text (the colour stays).
          tl.to(contents[i], { opacity: K.behindOpacity, duration: each / 2 }, at + each / 2)
        })
        tl.set({}, {}, 1)
        if (frozen) tl.progress(frozen === 'stacked' ? 1 : 0)

        return () => {
          delete section.dataset.animate
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} data-mission className="relative z-10 overflow-clip bg-dark">
      <div data-mission-stage>
        <div
          data-mission-cards
          style={{ '--count': CARDS.length, '--step': `${MISSION.stack.step}px` } as CSSProperties}
        >
          {CARDS.map((card, i) => (
            // 488 × 478; 64px top and 54px sides. Figma's column (64 + 182 + 112) runs 8px past its 64px
            // bottom padding, so the body sits 56px from the bottom; space-between keeps it there.
            <article
              key={card.id}
              data-card={card.id}
              style={{ '--i': i } as CSSProperties}
              className={`h-[478px] w-[488px] px-[54px] pt-16 pb-14 text-strong ${card.className}`}
            >
              <div data-card-content className="flex h-full w-[380px] flex-col justify-between">
                <h2 className="text-section-h2">{card.title}</h2>
                <p className="text-body-main-tight">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Figma 11053:31690: full width, 230 tall, on the section's bottom edge. */}
      <img
        src={glow.src}
        srcSet={glow.srcset}
        sizes="100vw"
        width={glow.width}
        height={glow.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[230px] w-full max-w-none"
      />
    </section>
  )
}
