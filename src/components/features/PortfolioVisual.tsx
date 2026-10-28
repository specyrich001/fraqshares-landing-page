import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import images from '../../generated/images.json'
import { cardControllers, type CardController } from './cardControllers.ts'
import { featureTiming } from './featureTiming.ts'
import { Visual, type VisualProps } from './FeatureVisuals.tsx'

gsap.registerPlugin(useGSAP)

/**
 * Card 2 ("One Portfolio") micro-animation. Seconds; px are screen px; times are from play().
 * The phone slides up out of the bottom of the visual into place, on every turn of the carousel.
 */
const CARD2 = {
  /** From just below the visual's bottom edge (490 − the phone's top, 46) into place. */
  phone: { at: 0.1, fromY: 444, duration: 0.9, ease: 'power3.out' },
  /** Once the carousel moves on, back below the edge after the card has slid out of view. */
  resetDelay: featureTiming.slideMs / 1000,
  /** Without the carousel (fallback): play while this much of the card is on screen. */
  visibleThreshold: featureTiming.visibleThreshold,
}

const phone = images['features/phone']
const MOTION = '(prefers-reduced-motion: no-preference)'

/*
 * Card 2 — One Portfolio. Phone mockup 290 × 591 at (124, 46), cropped by the visual's bottom.
 *
 * Driven by the carousel through `active` / `playing`, like the other cards: play at the start of its
 * window, pause while the timer holds, reset out of sight once it has slid away. Without them (not in
 * a carousel) it plays while on screen. Starting state comes from features.css before the script runs
 * (only with JS and motion allowed); without JS or with reduced motion the phone is in place, static.
 */
export function PortfolioVisual({ active, playing }: VisualProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<(CardController & { leave: () => void }) | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        const root = rootRef.current!
        const device = root.querySelector<HTMLElement>('[data-feature-phone]')!
        const P = CARD2.phone
        const hide = () => gsap.set(device, { y: P.fromY })
        hide()

        let tl: gsap.core.Tween | undefined
        let pendingReset: gsap.core.Tween | undefined
        let state: 'hidden' | 'playing' | 'paused' | 'done' = 'hidden'
        const play = () => {
          pendingReset?.kill()
          pendingReset = undefined
          if (state === 'playing' || state === 'done') return
          if (state === 'paused') tl?.resume()
          else {
            tl = gsap.to(device, {
              y: 0,
              delay: P.at,
              duration: P.duration,
              ease: P.ease,
              onComplete: () => {
                state = 'done'
              },
            })
          }
          state = 'playing'
        }
        const pause = () => {
          if (state !== 'playing') return
          tl?.pause()
          state = 'paused'
        }
        const reset = () => {
          pendingReset?.kill()
          pendingReset = undefined
          tl?.kill()
          tl = undefined
          hide()
          state = 'hidden'
        }
        /** The carousel moved on: finish if mid-way, then back below the edge once out of view. */
        const leave = () => {
          if (state === 'hidden') return
          tl?.resume()
          pendingReset = gsap.delayedCall(CARD2.resetDelay, reset)
        }
        controller.current = { play, pause, reset, leave }

        // Pause in a hidden tab (the carousel's `playing` covers this too).
        const onVisibility = () => {
          if (document.visibilityState === 'hidden') pause()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
          document.removeEventListener('visibilitychange', onVisibility)
          tl?.kill()
          pendingReset?.kill()
          controller.current = null
          gsap.set(device, { clearProps: 'transform,translate' })
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
    cardControllers.set(1, c)
    return () => {
      if (cardControllers.get(1) === c) cardControllers.delete(1)
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
      { threshold: CARD2.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    cardControllers.set(1, c)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      if (cardControllers.get(1) === c) cardControllers.delete(1)
    }
  }, [active])

  return (
    <Visual background="var(--color-olive)">
      <div ref={rootRef} data-card2 className="absolute inset-0">
        {/* Not lazy: the carousel clips off-screen cards, so a lazy image would only load as its card slides in. */}
        <img
          data-feature-phone
          src={phone.src}
          srcSet={phone.srcset}
          sizes="290px"
          width={phone.width}
          height={phone.height}
          alt=""
          fetchPriority="low"
          className="absolute top-[46px] left-[124px] h-[591px] w-[290px] object-cover"
        />
      </div>
    </Visual>
  )
}
