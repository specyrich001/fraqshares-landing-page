import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import images from '../../generated/images.json'
import { StepCursor } from './StepCursor.tsx'
import { stepControllers, type StepController, type StepGraphicProps } from './stepControllers.ts'
import './dashboard.css'

gsap.registerPlugin(useGSAP)

/**
 * Step 5 ("Monitor & Manage Portfolio") micro-animation: the three dashboard cards keep stacking.
 * Every beat the pointer taps, a card drops onto the front of the stack, the other two step back a
 * slot, and the one at the back fades out behind them (it's the next to drop). Seconds; px are
 * frame px (496 × 588).
 */
const STEP5 = {
  /** First card onto the stack, from play(); then one every `every`. */
  firstAt: 0.6,
  every: 1.2,
  /** The pointer taps just before each card lands. */
  tap: { before: 0.14, scale: 0.85, duration: 0.12 },
  /** The new front card drops in from slightly above and larger, solid fast so the two fronts' text never shows through each other. */
  drop: { fromY: -20, fromScale: 1.04, duration: 0.35, ease: 'power3.out', fade: 0.05 },
  /** The front and middle cards step back one slot. */
  step: { duration: 0.35, ease: 'power2.inOut' },
  /** The back card fades out behind the one taking its place. */
  out: { duration: 0.2 },
  /** Outside the pinned sequence (under 1024px): play while this much of the frame is on screen. */
  visibleThreshold: 0.5,
}

/**
 * Figma 10827:60195: front 366 × 191 at (65.5, 161), middle 327 × 171 at (85, 226), back 299 × 156
 * at (99, 271), all centred on x 248.5. Every card sits in the front slot and is placed by scale and
 * y about its centre; Figma's shadows are 0 4 34 at 12% (front), 15% (middle) and none (back).
 */
const SLOTS = [
  { y: 0, scale: 1, opacity: 1, shadow: 0.8 },
  { y: 55, scale: 327 / 366, opacity: 1, shadow: 1 },
  { y: 92.52, scale: 299 / 366, opacity: 1, shadow: 0 },
]
/** Out of the stack: at the back, hidden. */
const HIDDEN = { ...SLOTS[2], opacity: 0 }

/**
 * Six cards, the three twice, going round ring positions p 0–5: 0 front, 1 middle, 2 back, 3–5
 * hidden. Each beat every card moves on one position, and 5 (the card that left the back three beats
 * ago, the same card as the one leaving now) drops onto the front.
 */
const RING = 6
const DASHBOARDS = [images['steps/dashboard-front'], images['steps/dashboard-middle'], images['steps/dashboard-back']]
const CARDS = [...DASHBOARDS, ...DASHBOARDS]

const MOTION = '(prefers-reduced-motion: no-preference)'

/*
 * 5. Monitor & Manage Portfolio — Figma 10823:86323. dashboard.css places the cards for the static
 * state (no JS, reduced motion, and before the script runs), which is Figma's stack with the pointer
 * at rest. Only transform and opacity animate (each card's shadow is its own layer, faded).
 *
 * Driven like steps 1 and 3: plays at rest while on screen, freezes as the frame shrinks away, and
 * resets (back to Figma's order) once the frame has collapsed.
 */
export function DashboardGraphic({ active, playing }: StepGraphicProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<StepController | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, (context) => {
        const root = rootRef.current!
        const cards = [...root.querySelectorAll<HTMLElement>('[data-dash-card]')]
        const shadows = cards.map((card) => card.querySelector<HTMLElement>('[data-dash-shadow]')!)
        const pointer = root.querySelector<HTMLElement>('[data-dash-cursor] [data-cursor-pointer]')!
        const S = STEP5

        /** k: how many cards have dropped. Card i is at ring position (i + k) mod 6. */
        let k = 0
        const pos = (i: number) => (i + k) % RING
        const slotOf = (p: number) => (p < 3 ? SLOTS[p] : HIDDEN)
        const set = (i: number, p: number) => {
          const { shadow, ...vars } = slotOf(p)
          gsap.set(cards[i], { ...vars, zIndex: p < 3 ? 3 - p : 0 })
          gsap.set(shadows[i], { opacity: shadow })
        }
        const place = context.add('place', () => {
          cards.forEach((_, i) => set(i, pos(i)))
          gsap.set(pointer, { scale: 1 })
        }) as () => void
        place()

        /** One beat: tap, a card onto the stack, the rest back a slot. */
        const build = context.add('build', (first: boolean) => {
          const moving = Math.max(S.drop.duration, S.step.duration)
          // Each beat ends as its card lands, so the next drop comes `every` after this one.
          const at = first ? S.firstAt : S.every - moving
          const tl = gsap.timeline({
            onComplete: () => {
              k++
              place()
              current = build(false)
            },
          })
          const half = { duration: S.tap.duration / 2, ease: 'power1.inOut', yoyo: true, repeat: 1 }
          tl.to(pointer, { scale: S.tap.scale, ...half }, at - S.tap.before)
          cards.forEach((card, i) => {
            const p = pos(i)
            const shadow = shadows[i]
            if (p === 5) {
              // Onto the front, from slightly above and larger.
              const { shadow: s, ...front } = SLOTS[0]
              tl.set(card, { zIndex: 4 }, at)
              tl.fromTo(
                card,
                { y: S.drop.fromY, scale: S.drop.fromScale, opacity: 0 },
                { y: front.y, scale: front.scale, duration: S.drop.duration, ease: S.drop.ease, immediateRender: false },
                at,
              )
              tl.to(card, { opacity: 1, duration: S.drop.fade, ease: 'power1.out' }, at)
              tl.set(shadow, { opacity: s }, at)
            } else if (p < 2) {
              const { shadow: s, ...next } = SLOTS[p + 1]
              tl.to(card, { ...next, duration: S.step.duration, ease: S.step.ease }, at)
              tl.to(shadow, { opacity: s, duration: S.step.duration, ease: S.step.ease }, at)
            } else if (p === 2) {
              tl.to(card, { opacity: 0, duration: S.out.duration, ease: 'power1.in' }, at)
            }
          })
          tl.set({}, {}, at + moving)
          return tl
        }) as (first: boolean) => gsap.core.Timeline

        let current: gsap.core.Timeline | undefined
        let state: 'idle' | 'playing' | 'paused' = 'idle'
        const play = () => {
          if (state === 'playing') return
          if (state === 'paused') current?.resume()
          else current = build(true)
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
        stepControllers.set(4, c)

        const onVisibility = () => {
          if (document.visibilityState === 'hidden') pause()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
          document.removeEventListener('visibilitychange', onVisibility)
          current?.kill()
          controller.current = null
          if (stepControllers.get(4) === c) stepControllers.delete(4)
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
      { threshold: STEP5.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [active])

  return (
    <div ref={rootRef} data-dashboard className="absolute inset-0">
      {CARDS.map((image, i) => (
        <div key={i} data-dash-card data-dash-slot={i} className="absolute top-[161px] left-[65.5px] h-[191px] w-[366px]">
          <div data-dash-shadow className="absolute inset-0 shadow-[0_4px_34px_rgba(0,0,0,0.15)]" />
          <img
            src={image.src}
            srcSet={image.srcset}
            sizes="366px"
            width={image.width}
            height={image.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="relative block size-full max-w-none object-cover"
          />
        </div>
      ))}
      {/* Figma 10827:60200, tip at (420, 297): on the front card's right edge. */}
      <StepCursor data-dash-cursor className="top-[297px] left-[420px] z-10" />
    </div>
  )
}
