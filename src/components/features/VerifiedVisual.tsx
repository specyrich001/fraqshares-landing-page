import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import verifyIcon from '../../assets/icons/verify.svg'
import images from '../../generated/images.json'
import { cardControllers, type CardController } from './cardControllers.ts'
import { featureTiming } from './featureTiming.ts'
import { Visual, type VisualProps } from './FeatureVisuals.tsx'

gsap.registerPlugin(useGSAP)

/**
 * Card 4 ("Verified Assets") micro-animation. Seconds; px are screen px.
 * The four banners slide in as empty placeholders once per page load (Figma 11014:49441). Then the
 * verification loops while card 4 is the carousel's active card: the middle two morph into the
 * verified cards (10971:74867) one after the other, hold, drop back to placeholders, and verify again.
 * Every turn of the carousel starts from the placeholders.
 */
const CARD4 = {
  /** Intro, once: all four banners slide in, top to bottom (times from the first play()). */
  slide: { from: 'right' as 'right' | 'bottom', distance: 48, duration: 0.5, ease: 'power3.out', stagger: 0.08 },
  /** Optional: a light shimmer sweeps across both placeholders before each verification (from its start). */
  shimmer: { enabled: false, before: 0.3, duration: 0.6, ease: 'power1.inOut', stagger: 0.1 },
  /** The middle banners start verifying at these times into each window (the second 0.5s after the first). */
  morphAt: [1.0, 1.5],
  /** Each banner's morph, times from its start. */
  morph: {
    /** The white fill comes up over the placeholder... */
    fill: { at: 0, duration: 0.35, ease: 'power2.out' },
    /** ...with a subtle pop on the whole banner (scale 1 → peak → 1). */
    pop: { at: 0, peak: 1.02, duration: 0.4, upEase: 'power2.out', downEase: 'power2.inOut' },
    thumb: { at: 0.1, fromScale: 0.9, duration: 0.35, ease: 'power2.out' },
    /** Title, then meta. */
    text: { at: 0.15, fromY: 6, duration: 0.35, ease: 'power3.out', stagger: 0.05 },
    badge: { at: 0.4, fromRotate: -20, duration: 0.45, ease: 'back.out(2)' },
  },
  /** The loop while card 4 stays active: hold verified, fade back to placeholders, pause, verify again. */
  loop: {
    enabled: true,
    hold: 1.6,
    /** Back to placeholders: the content fades, then the white fill. Both banners together. */
    unverify: { content: 0.25, fillAt: 0.1, fill: 0.35, ease: 'power2.in' },
    /** Placeholder beat before verifying again. */
    pending: 0.4,
  },
  /** Nothing may still be moving this close to the carousel moving on; a step that would waits until
      the window is over (so with auto-advance each window holds one verification). */
  finishBeforeAdvance: 0.3,
  /** Once the carousel moves on, back to placeholders after the card has slid out of view. */
  resetDelay: featureTiming.slideMs / 1000,
  /** Without the carousel (fallback): play while this much of the card is on screen. */
  visibleThreshold: featureTiming.visibleThreshold,
}

/** The carousel's window per card, from its own config. */
const WINDOW = featureTiming.intervalMs / 1000
const M = CARD4.morph
/** One verification, first fill to second badge landing. */
const VERIFY = CARD4.morphAt[1] - CARD4.morphAt[0] + M.badge.at + M.badge.duration
const U = CARD4.loop.unverify
const UNVERIFY = Math.max(U.content, U.fillAt + U.fill)
/** How long after the window ends a deferred step waits, so the carousel has moved on first. */
const ADVANCE_GRACE = 0.1

const villa = images['features/villa']
const cars = images['features/cars']
const MOTION = '(prefers-reduced-motion: no-preference)'

/** Shared by every copy of card 4 (the carousel renders a feature more than once): the slide-in plays once per page load. */
const shared = {
  slidIn: false,
  listeners: new Set<(source: object) => void>(),
  emit(source: object) {
    shared.listeners.forEach((l) => l(source))
  },
}

type ItemProps = { image: typeof villa; title: string; meta: string; item: string }

/**
 * A middle banner, to Figma's rendered numbers (title 16.51 = 13.65 base, so not a scaled base card),
 * in layers for the morph: the placeholder base (white 30%), the white fill over it, then the content.
 * At rest (fill and content shown) it's the plain white card.
 */
function VerifiedItem({ image, title, meta, item }: ItemProps) {
  return (
    <div data-feature-feed-item={item} data-verify-banner className="relative h-[107.964px] w-full shrink-0 bg-white/30">
      {CARD4.shimmer.enabled && (
        <div className="absolute inset-0 overflow-hidden">
          <div data-verify-shimmer className="h-full w-1/2 -translate-x-full bg-linear-to-r from-white/0 via-white/35 to-white/0" />
        </div>
      )}
      <div data-verify-fill className="absolute inset-0 bg-white" />
      <div className="relative flex h-full items-center justify-between px-3 py-[13.93px]">
        <div className="flex items-center gap-[14px]">
          {/* Not lazy: the carousel clips off-screen cards, so a lazy image would only load as its card slides in. */}
          <img
            data-verify-thumb
            src={image.src}
            srcSet={image.srcset}
            sizes="95px"
            width={image.width}
            height={image.height}
            alt=""
            fetchPriority="low"
            className="h-[80.104px] w-[94.3px] shrink-0 object-cover"
          />
          <div className="flex w-[137.855px] flex-col gap-[2.419px] leading-[1.4]">
            <p data-verify-text className="text-[16.51px] font-bold whitespace-nowrap text-black">
              {title}
            </p>
            <p data-verify-text className="text-[12.093px] font-light text-meta">
              {meta}
            </p>
          </div>
        </div>
        <img data-verify-badge src={verifyIcon} width={28} height={28} alt="" className="shrink-0" />
      </div>
    </div>
  )
}

/*
 * Card 4 — Verified Assets. A 350px column centred in the visual at (93.5, 5.07) (Figma has it at
 * x 111, 17.5px right of centre; centred on request): ghost banners top and bottom (identical in both
 * Figma states), the two verified banners between them, 108px each with 16px gaps.
 *
 * Driven by the carousel through `active` / `playing`, like cards 1 and 3: play at the start of its
 * window, pause while the timer holds, stop once it moves on. Without them (not in a carousel) it plays
 * while on screen. Starting state comes from features.css before the script runs (only with JS and
 * motion allowed); without JS or with reduced motion it's the verified state (state 2), static.
 */
export function VerifiedVisual({ active, playing }: VisualProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<(CardController & { leave: () => void }) | null>(null)
  const [pending] = useState(() => !shared.slidIn)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, (context) => {
        const root = rootRef.current!
        const self = {}
        const banners = [...root.querySelectorAll<HTMLElement>('[data-feature-feed-item]')]
        const middles = [...root.querySelectorAll<HTMLElement>('[data-verify-banner]')].map((b) => ({
          banner: b,
          fill: b.querySelector<HTMLElement>('[data-verify-fill]')!,
          thumb: b.querySelector<HTMLElement>('[data-verify-thumb]')!,
          text: [...b.querySelectorAll<HTMLElement>('[data-verify-text]')],
          badge: b.querySelector<HTMLElement>('[data-verify-badge]')!,
          shimmer: b.querySelector<HTMLElement>('[data-verify-shimmer]'),
        }))
        const fills = middles.map((m) => m.fill)
        const content = middles.flatMap((m) => [m.thumb, ...m.text, m.badge])
        const shimmers = middles.flatMap((m) => (m.shimmer ? [m.shimmer] : []))
        const SL = CARD4.slide
        const offset = SL.from === 'right' ? { x: SL.distance } : { y: SL.distance }

        /** The middle banners as placeholders: no fill, content hidden at its starting offsets. */
        const unverified = () => {
          gsap.set(middles.map((m) => m.banner), { scale: 1 })
          gsap.set(fills, { opacity: 0 })
          middles.forEach((m) => {
            gsap.set(m.thumb, { scale: M.thumb.fromScale, opacity: 0 })
            gsap.set(m.text, { y: M.text.fromY, opacity: 0 })
            gsap.set(m.badge, { scale: 0, rotation: M.badge.fromRotate, opacity: 0 })
          })
          if (shimmers.length) gsap.set(shimmers, { xPercent: -100 })
          verified = false
        }
        /** Before the slide-in: everything hidden. */
        const hide = () => {
          gsap.set(banners, { x: 0, y: 0, ...offset, autoAlpha: 0 })
          unverified()
        }
        /** All four banners in place, the middle two as placeholders. */
        const placeholders = () => {
          gsap.set(banners, { x: 0, y: 0, autoAlpha: 1 })
          unverified()
        }

        // Time since this window started (pauses with it), to keep each step inside the window.
        const clock = gsap.to({}, { duration: 1e6, ease: 'none', paused: true })
        let running: gsap.core.Timeline | undefined
        let slideTl: gsap.core.Timeline | undefined
        let next: gsap.core.Tween | undefined
        let pendingReset: gsap.core.Tween | undefined
        let verified = false
        let state: 'hidden' | 'idle' | 'playing' | 'paused' = 'hidden'

        /** Run `step` in `delay`, unless it would still be going (for `length`) too close to the window's end. */
        const schedule = (step: () => void, delay: number, length: number) => {
          const now = clock.time()
          let at = now + delay
          if (at < WINDOW + ADVANCE_GRACE && at + length > WINDOW - CARD4.finishBeforeAdvance) at = WINDOW + ADVANCE_GRACE
          next = gsap.delayedCall(at - now, step)
        }

        // Created later (from delayed calls), so added to the context to be reverted with everything else.
        const verify = context.add('verify', () => {
          const t = gsap.timeline({
            onComplete: () => {
              verified = true
              if (CARD4.loop.enabled) schedule(unverify, CARD4.loop.hold, UNVERIFY)
            },
          })
          const SH = CARD4.shimmer
          middles.forEach((m, i) => {
            const at = CARD4.morphAt[i] - CARD4.morphAt[0]
            if (m.shimmer) t.fromTo(m.shimmer, { xPercent: -100 }, { xPercent: 200, duration: SH.duration, ease: SH.ease }, Math.max(0, at - SH.before) + i * SH.stagger)
            t.to(m.fill, { opacity: 1, duration: M.fill.duration, ease: M.fill.ease }, at + M.fill.at)
            t.to(m.banner, { scale: M.pop.peak, duration: M.pop.duration / 2, ease: M.pop.upEase }, at + M.pop.at)
            t.to(m.banner, { scale: 1, duration: M.pop.duration / 2, ease: M.pop.downEase }, at + M.pop.at + M.pop.duration / 2)
            t.to(m.thumb, { scale: 1, opacity: 1, duration: M.thumb.duration, ease: M.thumb.ease }, at + M.thumb.at)
            t.to(m.text, { y: 0, opacity: 1, duration: M.text.duration, ease: M.text.ease, stagger: M.text.stagger }, at + M.text.at)
            t.to(m.badge, { scale: 1, rotation: 0, opacity: 1, duration: M.badge.duration, ease: M.badge.ease }, at + M.badge.at)
          })
          running = t
        }) as () => void
        const unverify = context.add('unverify', () => {
          const t = gsap.timeline({
            onComplete: () => {
              unverified()
              schedule(verify, CARD4.loop.pending, VERIFY)
            },
          })
          t.to(content, { opacity: 0, duration: U.content, ease: U.ease }, 0)
          t.to(fills, { opacity: 0, duration: U.fill, ease: U.ease }, U.fillAt)
          running = t
        }) as () => void

        const stopAll = () => {
          next?.kill()
          running?.kill()
          next = running = undefined
          clock.pause()
        }
        /** A new window on card 4: verify from the placeholders (or, back before the reset, carry on). */
        const startWindow = () => {
          clock.play(0)
          if (verified) schedule(unverify, CARD4.loop.hold, UNVERIFY)
          else schedule(verify, CARD4.morphAt[0], VERIFY)
        }

        const play = () => {
          if (state === 'playing') return
          if (state === 'paused') {
            clock.resume()
            slideTl?.resume()
            running?.resume()
            next?.resume()
            state = 'playing'
            return
          }
          if (pendingReset) {
            pendingReset.kill()
            pendingReset = undefined
            running?.progress(1)
          }
          if (state === 'hidden') {
            if (shared.slidIn) placeholders()
            else {
              slideTl = gsap.timeline({
                onComplete: () => {
                  shared.slidIn = true
                  shared.emit(self)
                },
              })
              slideTl.to(banners, { x: 0, y: 0, autoAlpha: 1, duration: SL.duration, ease: SL.ease, stagger: SL.stagger }, 0)
            }
          }
          startWindow()
          state = 'playing'
        }
        const pause = () => {
          if (state !== 'playing') return
          clock.pause()
          slideTl?.pause()
          running?.pause()
          next?.pause()
          state = 'paused'
        }
        /** The carousel moved on: nothing new starts; once the card has slid out of view, back to placeholders. */
        const leave = () => {
          if (state !== 'playing' && state !== 'paused') return
          next?.kill()
          next = undefined
          clock.pause()
          slideTl?.resume()
          running?.resume()
          state = 'idle'
          pendingReset = gsap.delayedCall(CARD4.resetDelay, () => {
            pendingReset = undefined
            slideTl?.progress(1)
            stopAll()
            placeholders()
          })
        }
        const hideNow = () => {
          pendingReset?.kill()
          pendingReset = undefined
          slideTl?.kill()
          slideTl = undefined
          stopAll()
          hide()
          state = 'hidden'
        }
        /** Back to before the slide-in, on every copy (dev / console). */
        const reset = () => {
          shared.slidIn = false
          shared.emit(self)
          hideNow()
        }
        controller.current = { play, pause, reset, leave }

        // Other copies: show the placeholders once the slide-in has played somewhere (or hide on reset).
        const onShared = (source: object) => {
          if (source === self) return
          if (!shared.slidIn) {
            if (state !== 'hidden') hideNow()
          } else if (state === 'hidden') {
            placeholders()
            state = 'idle'
          }
        }
        shared.listeners.add(onShared)

        if (shared.slidIn) {
          placeholders()
          state = 'idle'
        } else hide()

        // Pause in a hidden tab (the carousel's `playing` covers this too).
        const onVisibility = () => {
          if (document.visibilityState === 'hidden') pause()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
          document.removeEventListener('visibilitychange', onVisibility)
          shared.listeners.delete(onShared)
          slideTl?.kill()
          pendingReset?.kill()
          stopAll()
          clock.kill()
          controller.current = null
          gsap.set([...banners, ...fills, ...content, ...shimmers], { clearProps: 'opacity,visibility,transform,translate,rotate,scale' })
        }
      })
    },
    { scope: rootRef },
  )

  // The carousel drives the card: active + playing → play; active but held → pause; inactive → leave.
  useEffect(() => {
    if (active === undefined) return
    const c = controller.current
    if (!c) return
    if (active && playing) c.play()
    else if (active) c.pause()
    else c.leave()
    if (!active) return
    cardControllers.set(3, c)
    return () => {
      if (cardControllers.get(3) === c) cardControllers.delete(3)
    }
  }, [active, playing])

  // Fallback outside the carousel: play while on screen and the tab is visible.
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
      { threshold: CARD4.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    cardControllers.set(3, c)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      if (cardControllers.get(3) === c) cardControllers.delete(3)
    }
  }, [active])

  return (
    <Visual background="var(--color-forest)">
      <div
        ref={rootRef}
        data-card4
        data-anim={pending ? 'pending' : undefined}
        className="absolute top-[5.07px] left-[93.5px] h-[479.86px] w-[350px]"
      >
        <div data-feature-feed-track className="flex flex-col gap-4">
          <div data-feature-feed-item="ghost-top" className="h-[107.964px] w-full shrink-0 bg-linear-to-t from-white/30 to-white/0" />
          <VerifiedItem item="property" image={villa} title="Property Verified" meta="New listed property" />
          <VerifiedItem item="business" image={cars} title="Business Verified" meta="New listed business" />
          <div data-feature-feed-item="ghost-bottom" className="h-[107.964px] w-full shrink-0 bg-linear-to-b from-white/30 to-white/0" />
        </div>
      </div>
    </Visual>
  )
}
