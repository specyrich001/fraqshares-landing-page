import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import images from '../../generated/images.json'
import { StepCursor } from './StepCursor.tsx'
import { stepControllers, type StepController, type StepGraphicProps } from './stepControllers.ts'
import './listings.css'

gsap.registerPlugin(useGSAP)

/**
 * Step 3 ("Browse Available Listings") micro-animation: an endless carousel of listing cards. Each
 * cycle the cursor grabs the card coming in at the frame's right edge and drags it into the centre;
 * the row moves one slot left with it, then the cursor goes back to rest. Seconds, from the start
 * of a cycle; px are frame px (496 × 588).
 */
const STEP3 = {
  /** Cursor tip at rest: Figma 10826:59975, on the centre card's lower-right corner. */
  rest: { x: 370, y: 419 },
  /** Where it grabs the incoming card: the strip of it showing at the frame's right edge. */
  grab: { x: 462, y: 262 },
  /** Each glide bows this many px sideways at its midpoint. */
  toGrab: { at: 0.3, duration: 0.45, ease: 'power2.inOut', curve: 18 },
  /** The cursor presses (grabs), holds it through the drag, then lets go. */
  press: { scale: 0.85, duration: 0.1, release: 0.12 },
  /** The drag: cursor and row together, one slot (313.12px) left. */
  drag: { duration: 0.6, ease: 'power2.inOut' },
  /** After letting go, back to rest. */
  toRest: { delay: 0.12, duration: 0.5, ease: 'power2.inOut', curve: 14 },
  /** One card per cycle. */
  cycle: 2.4,
  /** Outside the pinned sequence (under 1024px): play while this much of the frame is on screen. */
  visibleThreshold: 0.5,
}

/**
 * Figma 10825:59970: a row of 252 / 305 / 252 cards, 34.62 apart, the side ones at 50%. Slots are
 * offsets from the centre card's place: one slot is 313.12px centre to centre, and a side card is
 * 252 / 305 of the centre one (scaled about its centre, it lands exactly on Figma's side cards).
 */
const SLOT = { step: 313.12, sideScale: 252 / 305, sideOpacity: 0.5 }
const slot = (q: number) => ({ x: q * SLOT.step, scale: q === 0 ? 1 : SLOT.sideScale, opacity: q === 0 ? 1 : SLOT.sideOpacity })

/**
 * Six cards, the three listings twice, cycling through ring positions p 0–5. Each position's slot
 * q: 0 left, 1 centre, 2 right, 3 just off the right edge (next in), 4 parked there too, 5 just off
 * the left edge (just out). Every cycle each card moves one position down: the one just out jumps,
 * unseen, to the parked spot on the right.
 */
const RING = [-1, 0, 1, 2, 2, -2]
const LISTINGS = [images['steps/listing-left'], images['steps/listing-center'], images['steps/listing-right']]
const CARDS = [...LISTINGS, ...LISTINGS]

const MOTION = '(prefers-reduced-motion: no-preference)'
type Point = { x: number; y: number }

/*
 * 3. Browse Available Listings — Figma 10823:86283. The card images and the pointer are as before;
 * all six cards sit in the centre slot and are placed by transform (scale and x about their centre)
 * and opacity only. listings.css places them for the static state (no JS, reduced motion, before the
 * script runs), which is Figma's: centre card, a faded card either side, pointer at rest.
 *
 * Driven like step 1: plays at rest while on screen, freezes as the frame shrinks away, and resets
 * (back to Figma's order) once the frame has collapsed.
 */
export function ListingsGraphic({ active, playing }: StepGraphicProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<StepController | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, (context) => {
        const root = rootRef.current!
        const cards = [...root.querySelectorAll<HTMLElement>('[data-listing-card]')]
        const cursor = root.querySelector<HTMLElement>('[data-listings-cursor]')!
        const pointer = cursor.querySelector<HTMLElement>('[data-cursor-pointer]')!
        const S = STEP3
        /** Cursor offsets are from its rest point (where the element sits). */
        const rel = (p: Point) => ({ x: p.x - S.rest.x, y: p.y - S.rest.y })
        const ring = (i: number, k: number) => (((i - k) % RING.length) + RING.length) % RING.length

        /** k: how many cards have gone by. */
        let k = 0
        const place = context.add('place', () => {
          cards.forEach((card, i) => gsap.set(card, slot(RING[ring(i, k)])))
          gsap.set(cursor, { x: 0, y: 0 })
          gsap.set(pointer, { scale: 1 })
        }) as () => void
        place()

        /** Cursor glide between two frame points along a shallow quadratic curve. */
        const glide = (tl: gsap.core.Timeline, at: number, from: Point, to: Point, { duration, ease, curve }: { duration: number; ease: string; curve: number }) => {
          const a = rel(from)
          const b = rel(to)
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
          const c = { x: (a.x + b.x) / 2 - ((b.y - a.y) / len) * curve, y: (a.y + b.y) / 2 + ((b.x - a.x) / len) * curve }
          const p = { t: 0 }
          tl.to(
            p,
            {
              t: 1,
              duration,
              ease,
              onUpdate: () => {
                const t = p.t
                const u = 1 - t
                gsap.set(cursor, { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y })
              },
            },
            at,
          )
        }

        /** One cycle: to the incoming card, grab, drag it to the centre, let go, back to rest. */
        const build = context.add('build', () => {
          const tl = gsap.timeline({
            onComplete: () => {
              k++
              current = build()
            },
          })
          const grabAt = S.toGrab.at + S.toGrab.duration
          const dragAt = grabAt + S.press.duration
          const releaseAt = dragAt + S.drag.duration
          const dropped = { x: S.grab.x - SLOT.step, y: S.grab.y }

          glide(tl, S.toGrab.at, S.rest, S.grab, S.toGrab)
          tl.to(pointer, { scale: S.press.scale, duration: S.press.duration, ease: 'power1.out' }, grabAt)
          cards.forEach((card, i) => {
            const q = RING[ring(i, k)]
            const next = RING[ring(i, k + 1)]
            if (q === next) return
            // The card that went out on the left last cycle: across to the parked spot, unseen.
            if (q < next) tl.set(card, slot(next), dragAt)
            else tl.to(card, { ...slot(next), duration: S.drag.duration, ease: S.drag.ease }, dragAt)
          })
          tl.to(cursor, { ...rel(dropped), duration: S.drag.duration, ease: S.drag.ease }, dragAt)
          tl.to(pointer, { scale: 1, duration: S.press.release, ease: 'power1.out' }, releaseAt)
          glide(tl, releaseAt + S.toRest.delay, dropped, S.rest, S.toRest)
          tl.set({}, {}, S.cycle)
          return tl
        }) as () => gsap.core.Timeline

        let current: gsap.core.Timeline | undefined
        let state: 'idle' | 'playing' | 'paused' = 'idle'
        const play = () => {
          if (state === 'playing') return
          if (state === 'paused') current?.resume()
          else current = build()
          state = 'playing'
        }
        const pause = () => {
          if (state !== 'playing') return
          current?.pause()
          state = 'paused'
        }
        const reset = () => {
          current?.kill()
          current = undefined
          k = 0
          place()
          state = 'idle'
        }
        const c = { play, pause, reset }
        controller.current = c
        stepControllers.set(2, c)

        const onVisibility = () => {
          if (document.visibilityState === 'hidden') pause()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
          document.removeEventListener('visibilitychange', onVisibility)
          current?.kill()
          controller.current = null
          if (stepControllers.get(2) === c) stepControllers.delete(2)
        }
      })
    },
    { scope: rootRef },
  )

  // The scroll sequence drives it: at rest and on screen → play; leaving or off screen → pause;
  // collapsed or not yet grown → reset.
  useEffect(() => {
    if (active === undefined) return
    const c = controller.current
    if (!c) return
    if (active && playing) c.play()
    else if (active) c.pause()
    else c.reset()
  }, [active, playing])

  // Outside the pinned sequence: play while on screen and the tab is visible.
  useEffect(() => {
    if (active !== undefined) return
    const root = rootRef.current
    const c = controller.current
    if (!root || !c) return
    let inView = false
    const update = () => (inView && document.visibilityState === 'visible' ? c.play() : c.pause())
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        update()
      },
      { threshold: STEP3.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [active])

  return (
    <div ref={rootRef} data-listings className="absolute inset-0">
      {CARDS.map((image, i) => (
        <img
          key={i}
          data-listing-card
          data-listing-slot={RING[i]}
          src={image.src}
          srcSet={image.srcset}
          sizes="305px"
          width={image.width}
          height={image.height}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute top-[140.73px] left-[96px] h-[305.99px] w-[305px] max-w-none object-cover"
        />
      ))}
      <StepCursor data-listings-cursor className="top-[419px] left-[370px]" />
    </div>
  )
}
