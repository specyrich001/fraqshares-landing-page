import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import flashIcon from '../../assets/icons/flash.svg'
import images from '../../generated/images.json'
import { cardControllers, type CardController } from './cardControllers.ts'
import { featureTiming } from './featureTiming.ts'
import { Visual, type VisualProps } from './FeatureVisuals.tsx'

gsap.registerPlugin(useGSAP)

/**
 * Card 3 ("Premium Real Estate") micro-animation. Seconds; px are screen px.
 * The notification stack builds back to front once per page load; after that the stack stays put
 * and only the lightning bolt pulses, while card 3 is the carousel's active card.
 */
const CARD3 = {
  // Intro, from the first play() (times from its start). Every layer rises from below, growing from its bottom edge.
  layers: { fromY: 28, fromScale: 0.92, origin: '50% 100%' },
  /** 1. Back layer 2 (smallest). */
  back2: { at: 0, duration: 0.45, ease: 'power3.out' },
  /** 2. Back layer 1. */
  back1: { at: 0.12, duration: 0.45, ease: 'power3.out' },
  /** 3. The front card lands on top with a slight bounce (the hero cards' family, softer). */
  front: { at: 0.24, duration: 0.6, ease: 'back.out(1.4)' },
  /** 4. Its content (icon, title, meta) fills in once it has landed. */
  content: { at: 0.4, fromY: 4, duration: 0.3, ease: 'power2.out' },

  // The bolt pulse (times from the start of each carousel window on card 3).
  pulse: {
    /** First pulse this far into the window, then one every `every` while the card stays active. */
    firstAt: 1.0,
    every: 0.9,
    /** No pulse may still be going this close to the carousel moving on; one that would waits until
        the window is over (so with auto-advance the window holds three: 1.0, 1.9, 2.8s). */
    finishBeforeAdvance: 0.3,
    /** The icon swells and settles. */
    icon: { peak: 1.18, up: 0.25, upEase: 'power2.out', down: 0.35, downEase: 'power2.inOut' },
    /** The glow behind it (a blurred copy of the bolt) blooms out and fades, with the icon's swell. */
    glow: { fromScale: 0.8, toScale: 1.7, fromOpacity: 0.6, duration: 0.7, ease: 'power2.out' },
    /** Optional rest after every `afterPulses` pulses, if continuous pulsing feels busy (0 = none). */
    rest: { afterPulses: 2, duration: 0 },
    /** When the carousel moves on, the icon and glow ease back to rest. */
    settle: { duration: 0.2, ease: 'power2.out' },
  },
  /** Without the carousel (fallback): play while this much of the card is on screen. */
  visibleThreshold: featureTiming.visibleThreshold,
}

const house = images['features/house']
const MOTION = '(prefers-reduced-motion: no-preference)'

/** The carousel's window per card, from its own config. */
const WINDOW = featureTiming.intervalMs / 1000
const P = CARD3.pulse
/** One pulse, start to finish (the icon's swell and settle, or the glow's bloom). */
const PULSE = Math.max(P.icon.up + P.icon.down, P.glow.duration)
/** How long after the window ends a deferred pulse waits, so the carousel has moved on first. */
const ADVANCE_GRACE = 0.1

/** Shared by every copy of card 3 (the carousel renders a feature more than once): the intro plays once per page load. */
const shared = {
  introPlayed: false,
  listeners: new Set<(source: object) => void>(),
  emit(source: object) {
    shared.listeners.forEach((l) => l(source))
  },
}

/*
 * Card 3 — Premium Real Estate (Figma 10823:86213). Built to Figma's rendered numbers: the front card's
 * padding, gap and meta follow the base card ×1.2093, but its title (16px = 13.2 base) and icon
 * (40px = 33.1 base) don't, so it isn't a scaled TransactionCard. Figma blurs 8.6 / 10 = CSS 4.3 / 5.
 *
 * Driven by the carousel through `active` / `playing`, like card 1: play at the start of its window,
 * pause while the timer holds, stop pulsing once it moves on (the stack stays). Without them (not in
 * a carousel) it plays while on screen. Starting state comes from features.css before the script runs
 * (only with JS and motion allowed); without JS or with reduced motion it's the final stack, static.
 */
export function RealEstateVisual({ active, playing }: VisualProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<(CardController & { leave: () => void }) | null>(null)
  const [pending] = useState(() => !shared.introPlayed)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, (context) => {
        const root = rootRef.current!
        const self = {}
        const q = (s: string) => root.querySelector<HTMLElement>(s)!
        const back2 = q('[data-feature-stack-layer="2"]')
        const back1 = q('[data-feature-stack-layer="1"]')
        const front = q('[data-feature-stack-layer="front"]')
        const layers = [back2, back1, front]
        const content = [...root.querySelectorAll<HTMLElement>('[data-stack-content]')]
        const icon = q('[data-bolt-icon]')
        const glow = q('[data-bolt-glow]')
        const L = CARD3.layers

        const hide = () => {
          gsap.set(layers, { y: L.fromY, scale: L.fromScale, autoAlpha: 0, transformOrigin: L.origin })
          gsap.set(content, { y: CARD3.content.fromY, autoAlpha: 0 })
          gsap.set(icon, { scale: 1 })
          gsap.set(glow, { scale: P.glow.fromScale, opacity: 0 })
        }
        const rest = () => {
          gsap.set(layers, { y: 0, scale: 1, autoAlpha: 1, transformOrigin: L.origin })
          gsap.set(content, { y: 0, autoAlpha: 1 })
          gsap.set(icon, { scale: 1 })
          gsap.set(glow, { scale: P.glow.fromScale, opacity: 0 })
        }

        let intro: gsap.core.Timeline | undefined
        const buildIntro = () => {
          const T = CARD3
          const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
              shared.introPlayed = true
              shared.emit(self)
            },
          })
          const rise = { y: 0, scale: 1, autoAlpha: 1 }
          tl.to(back2, { ...rise, duration: T.back2.duration, ease: T.back2.ease }, T.back2.at)
          tl.to(back1, { ...rise, duration: T.back1.duration, ease: T.back1.ease }, T.back1.at)
          tl.to(front, { ...rise, duration: T.front.duration, ease: T.front.ease }, T.front.at)
          tl.to(content, { y: 0, autoAlpha: 1, duration: T.content.duration, ease: T.content.ease }, T.content.at)
          return tl
        }

        // Time since this window started (pauses with it), to keep pulses inside the window.
        const clock = gsap.to({}, { duration: 1e6, ease: 'none', paused: true })
        let pulses = 0
        let pulseTl: gsap.core.Timeline | undefined
        let nextPulse: gsap.core.Tween | undefined
        let settle: gsap.core.Timeline | undefined
        let state: 'hidden' | 'rest' | 'playing' | 'paused' = 'hidden'

        /** Next pulse `delay` from now, unless it would still be going too close to the window's end. */
        const schedulePulse = (delay: number) => {
          const now = clock.time()
          let at = now + delay
          if (at < WINDOW + ADVANCE_GRACE && at + PULSE > WINDOW - P.finishBeforeAdvance) at = WINDOW + ADVANCE_GRACE
          nextPulse = gsap.delayedCall(at - now, pulse)
        }
        // Created later (from delayed calls), so added to the context to be reverted with everything else.
        const pulse = context.add('pulse', () => {
          const I = P.icon
          const G = P.glow
          pulseTl = gsap.timeline()
          pulseTl.fromTo(icon, { scale: 1 }, { scale: I.peak, duration: I.up, ease: I.upEase }, 0)
          pulseTl.to(icon, { scale: 1, duration: I.down, ease: I.downEase }, I.up)
          pulseTl.fromTo(glow, { scale: G.fromScale, opacity: G.fromOpacity }, { scale: G.toScale, opacity: 0, duration: G.duration, ease: G.ease }, 0)
          pulses++
          const resting = P.rest.duration > 0 && pulses % P.rest.afterPulses === 0
          schedulePulse(P.every + (resting ? P.rest.duration : 0))
        })
        const stopPulse = () => {
          pulseTl?.kill()
          nextPulse?.kill()
          pulseTl = nextPulse = undefined
          clock.pause()
        }

        const play = () => {
          if (state === 'playing') return
          if (state === 'paused') {
            intro?.resume()
            clock.resume()
            pulseTl?.resume()
            nextPulse?.resume()
            settle?.resume()
          } else {
            if (state === 'hidden') {
              if (shared.introPlayed) rest()
              else (intro ??= buildIntro()).play(0)
            }
            settle?.progress(1)
            clock.play(0)
            pulses = 0
            schedulePulse(P.firstAt)
          }
          state = 'playing'
        }
        const pause = () => {
          if (state !== 'playing') return
          intro?.pause()
          clock.pause()
          pulseTl?.pause()
          nextPulse?.pause()
          settle?.pause()
          state = 'paused'
        }
        /** The carousel moved on: the intro (if mid-way) finishes, the pulse eases back to rest, the stack stays. */
        const leave = () => {
          if (state !== 'playing' && state !== 'paused') return
          stopPulse()
          intro?.resume()
          const S = P.settle
          settle = gsap.timeline()
          settle.to(icon, { scale: 1, duration: S.duration, ease: S.ease }, 0)
          settle.to(glow, { opacity: 0, duration: S.duration, ease: S.ease }, 0)
          state = 'rest'
        }
        const hideNow = () => {
          intro?.kill()
          intro = undefined
          settle?.kill()
          stopPulse()
          hide()
          state = 'hidden'
        }
        /** Back to before the intro, on every copy (dev / console). */
        const reset = () => {
          shared.introPlayed = false
          shared.emit(self)
          hideNow()
        }
        controller.current = { play, pause, reset, leave }

        // Other copies: show the built stack once the intro has played somewhere (or hide on reset).
        const onShared = (source: object) => {
          if (source === self) return
          if (!shared.introPlayed) {
            if (state !== 'hidden') hideNow()
          } else if (state === 'hidden') {
            rest()
            state = 'rest'
          }
        }
        shared.listeners.add(onShared)

        if (shared.introPlayed) {
          rest()
          state = 'rest'
        } else hide()

        // Pause in a hidden tab (the carousel's `playing` covers this too).
        const onVisibility = () => {
          if (document.visibilityState === 'hidden') pause()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
          document.removeEventListener('visibilitychange', onVisibility)
          shared.listeners.delete(onShared)
          intro?.kill()
          settle?.kill()
          stopPulse()
          clock.kill()
          controller.current = null
          gsap.set([...layers, ...content, icon, glow], {
            clearProps: 'opacity,visibility,transform,translate,rotate,scale,transformOrigin',
          })
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
    cardControllers.set(2, c)
    return () => {
      if (cardControllers.get(2) === c) cardControllers.delete(2)
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
      { threshold: CARD3.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    cardControllers.set(2, c)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      if (cardControllers.get(2) === c) cardControllers.delete(2)
    }
  }, [active])

  return (
    <Visual background="var(--color-forest)">
      <div ref={rootRef} data-card3 data-anim={pending ? 'pending' : undefined} className="absolute inset-0">
        <img
          data-feature-photo
          src={house.src}
          srcSet={house.srcset}
          sizes="537px"
          width={house.width}
          height={house.height}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
        <div data-feature-stack>
          <div
            data-feature-stack-layer="2"
            className="absolute top-[251px] left-[125.14px] h-[57px] w-[286.73px] bg-white/50 backdrop-blur-[4.318px]"
          />
          <div
            data-feature-stack-layer="1"
            className="absolute top-[230px] left-[103px] h-[66px] w-[332px] bg-white/50 backdrop-blur-[5px]"
          />
          <div
            data-feature-stack-layer="front"
            className="absolute top-[208px] left-[83.98px] flex h-[74.013px] w-[370.04px] items-center gap-[9.674px] bg-white px-[19.348px] shadow-[0_4.837px_51.11px_rgba(0,0,0,0.55)]"
          >
            {/* The bolt, with its glow behind it: a copy of the bolt under a static blur. Only the glow's
                transform and opacity animate, never the blur. */}
            <span data-stack-content className="relative size-10 shrink-0">
              <img data-bolt-glow src={flashIcon} width={40} height={40} alt="" className="absolute inset-0 opacity-0 blur-[8px]" />
              <img data-bolt-icon src={flashIcon} width={40} height={40} alt="" className="relative" />
            </span>
            <div data-stack-content className="flex flex-col gap-[2.419px] leading-[1.4]">
              <p className="text-[16px] font-bold whitespace-nowrap text-black">Top property on the platform</p>
              <p className="text-[12.093px] font-light text-meta">Luxury property</p>
            </div>
          </div>
        </div>
      </div>
    </Visual>
  )
}
