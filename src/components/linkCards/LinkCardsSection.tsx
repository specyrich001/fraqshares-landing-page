import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, type ReactNode } from 'react'
import images from '../../generated/images.json'
import { revealLines } from '../about/revealLines.ts'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { LINKS, LINKS_MEDIA, LINKS_MOBILE } from './linksTiming.ts'
import './link-cards.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Figma 11063:45029's render: the shared green blur (tint 0.63) on #FAFAFA, inside the card's border. */
const glow = images['about/card-glow']

export type LinkCard = { title: string; body: string; label: string; href: string }

/** DEV: window.linksReplay() plays the entrance again. */
type DevWindow = Window & { linksReplay?: () => void }

/**
 * A page's closing section: a split-tone heading and three link cards, above the footer. About section 6
 * (Figma: Desktop - 25, 11063:31700) and the Glossary's last section (Desktop - 25, 11100:112333), both
 * 1440 × 756; the pages pass their own heading and cards. Timings: linksTiming.ts.
 *
 * 130px above and below: the H2 (its width from `headingClassName`: 717 on About, 575 on Glossary),
 * 80px, then three link cards (381 × 268, 68px apart). Each card is one link: the link row is the <a>, and its ::after covers the whole card, so the
 * card is clickable while screen readers hear just "Explore FAQs" and so on. Focus on the link outlines
 * the whole card. Hover / focus (pointers that can hover): the green glow rises in at the bottom, the
 * arrow nudges right, the border darkens (about-links.css).
 *
 * Entrance, once, when the section is 35% on screen: the heading's words slide up out of their masks,
 * then the cards rise in left to right, each one's title, text and link following it. A card keeps
 * data-entering (no hover effects) until it has arrived; hovering it before then finishes its entrance
 * at once, so the hover wins. Reduced motion and no JS: at rest from the start, the glow appearing in
 * place. Only transform and opacity animate (plus the border colour on hover).
 *
 * relative z-10 + bg-soft: the last section, so the footer reveal slides it up off the footer.
 *
 * Below 1024 (About: Figma 11074:79176, Glossary: 11107:113154, both 393 × 1255): 100px above, 148
 * below; the heading (40px) centred and 6px wider than the column on each side, as in Figma (357 at
 * 393), 50px over the cards, which stack 24px apart, full width (24px sides, 560 max on tablets),
 * 40px top and bottom, 24px sides. The link row sits a fixed 40px under the text (per the brief: the
 * frames draw every card 271 tall with the link at the bottom), so the cards are as tall as their
 * text. The heading and each card play their entrance as they reach the screen (LINKS_MOBILE).
 * Touch screens have no hover, so no glow there.
 */
export function LinkCardsSection({
  id,
  heading,
  headingClassName,
  cards: CARDS,
}: {
  /** The heading's id (the section is labelled by it). */
  id: string
  heading: ReactNode
  /** Its desktop width: Figma's text box, which sets where it wraps. */
  headingClassName: string
  cards: LinkCard[]
}) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(LINKS_MEDIA, (context) => {
        const { desktop } = context.conditions as { desktop: boolean }
        const section = sectionRef.current!
        const heading = section.querySelector<HTMLElement>('[data-links-title]')!
        const cards = gsap.utils.toArray<HTMLElement>('[data-link-card]', section)
        const L = LINKS
        cards.forEach((card) => (card.dataset.entering = ''))

        // One timeline per card, so hovering a card early can finish just that one.
        const cardTimelines = new Map<HTMLElement, gsap.core.Timeline>()
        // At rest: drop the entrance's leftover transforms. A transformed part would become the containing
        // block of the link's ::after and shrink the card's hit area to the link row. Opacity stays inline
        // (the CSS pre-hide would hide the card again).
        const settle = (card: HTMLElement) => {
          gsap.set([card, ...card.querySelectorAll('[data-card-part]')], { clearProps: 'transform,translate,rotate,scale' })
          delete card.dataset.entering
        }
        const finish = (card: HTMLElement) => {
          cardTimelines.get(card)?.progress(1)
          settle(card)
        }
        const onEnter = (e: PointerEvent) => {
          const card = e.currentTarget as HTMLElement
          if (card.dataset.entering !== undefined) finish(card)
        }
        cards.forEach((card) => card.addEventListener('pointerenter', onEnter))

        const playHeading = context.add('playHeading', () => {
          const { split, tween: words } = revealLines(heading, {
            type: 'words',
            from: { yPercent: 100 },
            mask: true,
            duration: L.heading.duration,
            ease: L.heading.ease,
            stagger: L.heading.stagger,
          })
          gsap.set(heading, { opacity: 1 })
          gsap.timeline({ onComplete: () => split.revert() }).add(words, L.heading.at)
        }) as () => void

        // One card's entrance, after `delay` seconds.
        const { cards: C, content: T } = L
        const playCard = context.add('playCard', (card: HTMLElement, delay: number) => {
          if (card.dataset.entering === undefined) return // hovered before it played: already at rest
          const parts = [...card.querySelectorAll<HTMLElement>('[data-card-part]')]
          const tl = gsap.timeline({ delay, onComplete: () => settle(card) })
          tl.fromTo(card, { opacity: 0, y: C.rise }, { opacity: 1, y: 0, duration: C.duration, ease: C.ease }, 0)
          tl.fromTo(
            parts,
            { opacity: 0, y: T.rise },
            { opacity: 1, y: 0, duration: T.duration, ease: T.ease, stagger: T.stagger },
            T.after,
          )
          cardTimelines.set(card, tl)
        }) as (card: HTMLElement, delay: number) => void

        // Desktop: everything from one trigger, the cards left to right. Mobile: the heading and each
        // card as they reach the screen.
        const play = () => {
          playHeading()
          cards.forEach((card, i) => playCard(card, C.at + C.stagger * i))
        }
        if (desktop) {
          ScrollTrigger.create({ trigger: section, start: L.start, once: true, onEnter: play })
        } else {
          ScrollTrigger.create({ trigger: heading, start: LINKS_MOBILE.start, once: true, onEnter: playHeading })
          cards.forEach((card) =>
            ScrollTrigger.create({ trigger: card, start: LINKS_MOBILE.start, once: true, onEnter: () => playCard(card, 0) }),
          )
        }
        if (import.meta.env.DEV) {
          ;(window as DevWindow).linksReplay = () => {
            cards.forEach((card) => (card.dataset.entering = ''))
            play()
          }
        }

        return () => {
          cards.forEach((card) => {
            card.removeEventListener('pointerenter', onEnter)
            delete card.dataset.entering
          })
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} data-links aria-labelledby={id} className="relative z-10 bg-soft py-[130px] max-lg:pt-[100px] max-lg:pb-[148px]">
      <div className="page-row max-lg:max-w-[560px] max-lg:px-6">
        {/* One heading, two tones (the muted part in a span). Below 1024 centred, 6px past the column. */}
        <h2
          id={id}
          data-links-title
          className={`max-w-full text-display-md text-strong max-lg:-mx-1.5 max-lg:w-auto max-lg:max-w-none max-lg:text-center ${headingClassName}`}
        >
          {heading}
        </h2>

        <ul role="list" className="mt-20 grid grid-cols-3 gap-[68px] max-lg:mt-[50px] max-lg:grid-cols-1 max-lg:gap-6">
          {CARDS.map((card) => (
            // isolate: the glow's -z-10 stays inside the card. Not positioned content, so the link's
            // ::after (inset 0) spans the card itself.
            <li
              key={card.title}
              data-link-card
              className="relative isolate flex h-[268px] flex-col overflow-hidden border border-border-light px-8 py-10 max-lg:h-auto max-lg:px-6 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-forest"
            >
              <img
                data-card-glow
                src={glow.src}
                srcSet={`${glow.src} 1x, ${glow.src2x} 2x`}
                width={glow.width}
                height={glow.height}
                alt=""
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[108px] w-full max-w-none"
              />
              <h3 data-card-part className="text-card-title text-strong">
                {card.title}
              </h3>
              {/* Figma's box is 315, but Chrome sets the FAQs card's "…getting started, ownership," 315.83 wide
                  and would wrap "ownership,"; 316 keeps Figma's lines (0.7px into the padding: the content box is 315.3).
                  Below 1024 it fills the card (295 at 393). */}
              <p data-card-part className="mt-6 w-[316px] text-body-sm-tight text-body-faint max-lg:w-auto">
                {card.body}
              </p>
              <div data-card-part className="mt-auto max-lg:mt-10">
                <a
                  href={card.href}
                  className="inline-flex items-center gap-2.5 text-button text-black outline-none after:absolute after:inset-0 after:content-[''] max-lg:text-button-sm"
                >
                  {card.label}
                  <span data-link-arrow className="inline-flex">
                    <ArrowRightIcon className="shrink-0" />
                  </span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
