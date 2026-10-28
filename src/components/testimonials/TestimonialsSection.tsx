import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import './testimonials.css'
import {
  cardStates,
  FIT_MEDIA,
  REST,
  TESTIMONIALS_MEDIA,
  TESTIMONIALS_MOBILE_MEDIA,
  testimonialsMobile as M,
  testimonialsTiming as T,
} from './testimonialsTiming.ts'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Card = { id: keyof typeof cardStates; quote: string; name: string; card: string; quoteColor: string; nameColor: string }

/** Back to front: A, B, C (DOM order is the paint order). */
const cards: Card[] = [
  {
    id: 'a',
    quote: '“I\'m excited about owning real estate, it always seemed out of reach”',
    name: 'Chisom',
    card: 'bg-(--card-a-bg)',
    quoteColor: 'text-black',
    nameColor: 'text-secondary',
  },
  {
    id: 'b',
    quote: '“Easy to get started and to use. I highly recommend it.”',
    name: 'Onome',
    card: 'bg-forest',
    quoteColor: 'text-white',
    nameColor: 'text-(--card-b-name)',
  },
  {
    id: 'c',
    quote: '“I was skeptical at first, but I was impressed by how simple it was to start investing.”',
    name: 'Tobi',
    card: 'bg-olive',
    quoteColor: 'text-black',
    nameColor: 'text-(--card-c-name)',
  },
]

/** Tolerance in progress units (~2px of scroll at 820px tall). */
const EPS = 0.002
const HALF_CARD = 463.838 / 2

/**
 * Figma: Testimonial (10815:83133 heading only, 10821:86101 split) and Desktop - 18 (10815:83135
 * stacked), each 1440 × 820.
 *
 * Static by default (no JS, reduced motion): the heading, then the three cards in Figma's split row.
 * With motion at 1024px and up, `data-staged` makes the section a tall track with a sticky 100vh
 * stage; heading and cards are centred on the stage, and every state is a transform of the cards from
 * that centre. One scrubbed timeline runs heading → stack → split.
 *
 * Mobile, below 1024px (Figma 11004:16327 heading, 11004:16343 split, 393 × 1311): no stack and no
 * pin; the split is a vertical column of base-size cards that scrolls. Static, the heading sits above
 * it. With motion (`data-staged-mobile`) the heading is sticky on the screen's centre, behind the
 * column: it scrolls in alone (16327), card A scrolls up over it while it dims to 10%, and it releases
 * between A and B, where 16343 has it, to scroll away with the column.
 */
export function TestimonialsSection() {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const root = rootRef.current!
      const group = root.querySelector<HTMLElement>('[data-testimonial-cards]')!

      // The split row is ~1180 wide: scale the card group to fit between 1024 and 1280 (static or pinned).
      mm.add(FIT_MEDIA, () => {
        const fit = () => group.style.setProperty('--cards-scale', String(Math.min(1, document.documentElement.clientWidth / T.fitWidth)))
        fit()
        window.addEventListener('resize', fit)
        return () => {
          window.removeEventListener('resize', fit)
          group.style.removeProperty('--cards-scale')
        }
      })

      mm.add(TESTIMONIALS_MEDIA, () => {
        const track = root.querySelector<HTMLElement>('[data-testimonials-track]')!
        const title = root.querySelector<HTMLElement>('[data-testimonials-title]')!
        const el = Object.fromEntries(cards.map(({ id }) => [id, root.querySelector<HTMLElement>(`[data-testimonial="${id}"]`)!])) as Record<
          Card['id'],
          HTMLElement
        >
        const all = Object.values(el)

        root.dataset.staged = ''
        track.style.height = `${T.trackVh}vh`

        // Start fully below the stage, in the group's (possibly scaled) px.
        const scale = () => Math.min(1, document.documentElement.clientWidth / T.fitWidth)
        const enterY = () => (window.innerHeight / 2 + T.enterClearancePx) / scale() + HALF_CARD * 1.1
        const enterRotation = (id: Card['id']) => {
          const r = cardStates[id].stacked
          return r + (r > 0 ? T.enterExtraRotation : -T.enterExtraRotation)
        }

        const tl = gsap.timeline({
          defaults: { ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: track,
            start: 'top top',
            end: 'bottom bottom',
            scrub: T.scrub,
            invalidateOnRefresh: true,
            snap: T.snap
              ? {
                  // Inside a hold already is rest; in a transition, go to the next rest in the scroll
                  // direction. No inertia: a flick moves one state, not past it.
                  snapTo: (value, self) => {
                    const holds: [number, number][] = [[0, REST[0]], [T.enter.end, REST[1]], [T.split.end, REST[2]]]
                    if (holds.some(([a, b]) => value >= a - EPS && value <= b + EPS)) return value
                    const forward = (self?.direction ?? 1) > 0
                    return forward ? REST.find((r) => r > value)! : [...REST].reverse().find((r) => r < value)!
                  },
                  inertia: false,
                  duration: T.snapDuration,
                  delay: T.snapDelay,
                  ease: 'power1.inOut',
                }
              : undefined,
            onToggle: (self) => all.forEach((c) => (c.style.willChange = self.isActive ? 'transform' : '')),
          },
        })

        // State 1, applied now: the stage is on screen before its trigger starts.
        const now = { immediateRender: true }
        tl.set(title, { opacity: 1, ...now }, 0)
        cards.forEach(({ id }) => tl.set(el[id], { x: 0, y: enterY, rotation: enterRotation(id), ...now }, 0))

        // Cards rise in back to front and settle into the stack; the heading dims meanwhile.
        const e = T.enter
        const enterDuration = e.end - e.start - e.stagger * (cards.length - 1)
        cards.forEach(({ id }, i) => {
          tl.fromTo(
            el[id],
            { y: enterY, rotation: enterRotation(id) },
            { y: 0, rotation: cardStates[id].stacked, duration: enterDuration, ease: e.ease },
            e.start + i * e.stagger,
          )
        })
        tl.fromTo(title, { opacity: 1 }, { opacity: T.headingDimmed, duration: e.end - e.start }, e.start)

        // The stack splits into the row.
        const s = T.split
        cards.forEach(({ id }) => {
          const c = cardStates[id]
          tl.fromTo(el[id], { x: 0, rotation: c.stacked }, { x: c.x, rotation: c.split, duration: s.end - s.start, ease: s.ease }, s.start)
        })
        tl.set({}, {}, 1)

        return () => {
          delete root.dataset.staged
          track.style.height = ''
          gsap.set(title, { clearProps: 'opacity' })
          gsap.set(all, { clearProps: 'transform,translate,rotate,scale,willChange' })
        }
      })

      mm.add(TESTIMONIALS_MOBILE_MEDIA, () => {
        const title = root.querySelector<HTMLElement>('[data-testimonials-title]')!
        root.dataset.stagedMobile = ''

        // The heading dims to Figma's 10% as card A scrolls up over it.
        const fade = gsap.fromTo(
          title,
          { opacity: 1 },
          {
            opacity: T.headingDimmed,
            ease: 'none',
            scrollTrigger: {
              trigger: root.querySelector('[data-testimonial="a"]'),
              start: M.fade.start,
              end: M.fade.end,
              scrub: T.scrub,
              invalidateOnRefresh: true,
            },
          },
        )

        return () => {
          fade.scrollTrigger?.kill()
          fade.kill()
          delete root.dataset.stagedMobile
          gsap.set(title, { clearProps: 'opacity' })
        }
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      id="testimonials"
      aria-labelledby="testimonials-title"
      data-testimonials
      className="relative overflow-x-clip bg-white"
    >
      <div data-testimonials-track>
        <div
          data-testimonials-stage
          className="flex flex-col items-center gap-[100px] py-[130px] max-lg:mx-auto max-lg:max-w-[560px] max-lg:gap-[50px] max-lg:px-6 max-lg:py-[100px]"
        >
          {/* 623px at 62px, kept in em so the three-line wrap survives the token's smaller sizes. Mobile:
              Figma's 345px, allowed past the 24px padding on narrower phones so it keeps three lines. The
              wrapper is the mobile heading's sticky range (testimonials.css); desktop has no box for it. */}
          <div data-testimonials-heading className="lg:contents max-lg:flex max-lg:w-full max-lg:items-start max-lg:justify-center">
            <h2
              id="testimonials-title"
              data-testimonials-title
              className="w-[10.048em] max-w-full text-center text-testimonial-intro text-muted max-lg:w-[min(345px,calc(100vw-30px))] max-lg:max-w-none max-lg:shrink-0 max-lg:text-section-h2-mobile"
            >
              Join our pool of <span className="text-strong">investors and start building your portfolio</span>
            </h2>
          </div>

          <ul role="list" data-testimonial-cards className="flex flex-wrap items-center justify-center">
            {cards.map(({ id, quote, name, card, quoteColor, nameColor }) => (
              <li key={id} data-testimonial-slot={id}>
                <figure data-testimonial={id} className={`testimonial-card m-0 ${card}`}>
                  <blockquote className="m-0">
                    <p className={`testimonial-quote ${quoteColor}`}>{quote}</p>
                  </blockquote>
                  <figcaption className={`testimonial-name ${nameColor}`}>{name}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
