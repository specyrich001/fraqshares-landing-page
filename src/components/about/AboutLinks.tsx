import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import images from '../../generated/images.json'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { LINKS, LINKS_MEDIA } from './linksTiming.ts'
import { revealLines } from './revealLines.ts'
import './about-links.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Figma 11063:45029's render: the shared green blur (tint 0.63) on #FAFAFA, inside the card's border. */
const glow = images['about/card-glow']

// PLACEHOLDER hrefs: the glossary page doesn't exist yet, and #contact is the homepage FAQ's own
// placeholder.
const CARDS = [
  {
    title: 'FAQs',
    body: 'Find answers about getting started, ownership, fees, returns, and selling your shares.',
    label: 'Explore FAQs',
    href: '/#faq',
  },
  {
    title: 'Glossary',
    body: 'Get familiar with the terms used in fractional investing, from shares and SPVs to distributions and valuations.',
    label: 'Explore Glossary',
    href: '/glossary',
  },
  {
    title: 'Still Have Questions?',
    body: 'We’re here to help you understand how Fraqshares works.',
    label: 'Contact Us',
    href: '#contact',
  },
]

/** DEV: window.linksReplay() plays the entrance again. */
type DevWindow = Window & { linksReplay?: () => void }

/**
 * About section 6, Figma: Desktop - 25 (11063:31700), 1440 × 756, under section 5, above the footer.
 * Timings: linksTiming.ts.
 *
 * 130px above and below: the split-tone H2 (717 wide), 80px, then three link cards (381 × 268, 68px
 * apart). Each card is one link: the link row is the <a>, and its ::after covers the whole card, so the
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
 */
export function AboutLinks() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(LINKS_MEDIA, (context) => {
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

        const play = context.add('play', () => {
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

          const { cards: C, content: T } = L
          cards.forEach((card, i) => {
            if (card.dataset.entering === undefined) return // hovered before it played: already at rest
            const parts = [...card.querySelectorAll<HTMLElement>('[data-card-part]')]
            const tl = gsap.timeline({ delay: C.at + C.stagger * i, onComplete: () => settle(card) })
            tl.fromTo(card, { opacity: 0, y: C.rise }, { opacity: 1, y: 0, duration: C.duration, ease: C.ease }, 0)
            tl.fromTo(
              parts,
              { opacity: 0, y: T.rise },
              { opacity: 1, y: 0, duration: T.duration, ease: T.ease, stagger: T.stagger },
              T.after,
            )
            cardTimelines.set(card, tl)
          })
        }) as () => void
        ScrollTrigger.create({ trigger: section, start: L.start, once: true, onEnter: play })
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
    <section ref={sectionRef} data-links aria-labelledby="links-title" className="relative z-10 bg-soft py-[130px]">
      <div className="page-row">
        {/* One heading, two tones: "Build Your Investment / Portfolio with Fraqshares." at 717 wide. */}
        <h2 id="links-title" data-links-title className="w-[717px] max-w-full text-display-md text-strong">
          <span className="text-muted">Build Your</span> Investment Portfolio with Fraqshares.
        </h2>

        <ul role="list" className="mt-20 grid grid-cols-3 gap-[68px]">
          {CARDS.map((card) => (
            // isolate: the glow's -z-10 stays inside the card. Not positioned content, so the link's
            // ::after (inset 0) spans the card itself.
            <li
              key={card.title}
              data-link-card
              className="relative isolate flex h-[268px] flex-col overflow-hidden border border-border-light px-8 py-10 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-forest"
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
              {/* Figma's box is 315, but Chrome sets "…getting started, ownership," 315.83 wide and would wrap
                  "ownership,"; 316 keeps Figma's lines (0.7px into the padding: the content box is 315.3). */}
              <p data-card-part className="mt-6 w-[316px] text-body-sm-tight text-body-faint">
                {card.body}
              </p>
              <div data-card-part className="mt-auto">
                <a
                  href={card.href}
                  className="inline-flex items-center gap-2.5 text-button text-black outline-none after:absolute after:inset-0 after:content-['']"
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
