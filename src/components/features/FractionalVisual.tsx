import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import briefcaseIcon from '../../assets/icons/briefcase.svg'
import images from '../../generated/images.json'
import { ProductPill } from '../product/ProductPill.tsx'
import { TransactionCard } from '../product/TransactionCard.tsx'
import { cardControllers, type CardController } from './cardControllers.ts'
import { featureTiming } from './featureTiming.ts'
import { Visual, type VisualProps } from './FeatureVisuals.tsx'

gsap.registerPlugin(useGSAP)

/**
 * Card 1 ("Fractional Ownership") micro-animation. Seconds.
 * The overlays come in once per page load. After that the pill stays put and only the investment
 * cards loop, while card 1 is the carousel's active card: the next investment stacks onto the
 * front, the front card sinks into the back slot, and the old back card recedes away
 * (after paypath.ai's solutions stack).
 */
const CARD1 = {
  // Intro, from the first play() (times from its start).
  /** 1. The pill's olive tile pops in. */
  tile: { at: 0, fromScale: 0.6, duration: 0.35, ease: 'back.out(1.7)' },
  /** 2. Its label reveals from the tile outward (clip-path). */
  label: { at: 0.1, duration: 0.35, ease: 'power3.out' },
  /** 3. The front card slides in from the right (screen px). */
  front: { at: 0.3, fromX: 60, duration: 0.55, ease: 'power3.out' },
  /** 4. The back card settles into its slot from above (screen px). */
  back: { at: 0.4, fromY: -16, duration: 0.5, ease: 'power2.out' },

  // The stacking loop (times from the start of each carousel window on card 1).
  stack: {
    /** First stack this far into the window (just after the intro on the first turn)... */
    firstAt: 1.0,
    /** ...then every this often, start to start, while the card stays active: two stacks per 4s window. */
    every: 1.5,
    /** No stack may land later than this before the carousel moves on; one that would waits
        until the window is over (so it never runs if the carousel advances). */
    minReadBeforeAdvance: 0.8,
    /** The front card sinks into the back slot. */
    toBack: { duration: 0.6, ease: 'power3.inOut' },
    /** Its text fades out as the incoming card covers it (so the two never read on top of each other)... */
    contentFade: { at: 0.04, duration: 0.2, ease: 'power1.out' },
    /** ...and its white face as it sinks, leaving the frosted strip (late, so it's never see-through in front). */
    whiteFade: { at: 0.15, duration: 0.45, ease: 'power2.in' },
    /** The next card stacks on top: settles down from slightly larger and above (screen px), opaque
        within `fade` so the card under it doesn't show through. */
    incoming: { delay: 0.08, fromY: -24, fromScale: 1.06, duration: 0.6, ease: 'power3.out', fade: 0.2, fadeEase: 'power1.out' },
    /** The old back card recedes behind the front one and fades away (screen px from the front slot). */
    exit: { toY: 16, toScale: 0.78, duration: 0.45, ease: 'power2.in' },
    /** The units text pops as the new card lands. */
    unitsAccent: { enabled: true, scale: 1.06, duration: 0.3, ease: 'power2.inOut', beforeLand: 0.05 },
  },
  /** Without the carousel (fallback): play while this much of the card is on screen. */
  visibleThreshold: featureTiming.visibleThreshold,
}

/** The carousel's window per card, from its own config. */
const WINDOW = featureTiming.intervalMs / 1000
const S = CARD1.stack
/** A stack beat, start to landing. */
const BEAT = Math.max(S.toBack.duration, S.whiteFade.at + S.whiteFade.duration, S.incoming.delay + S.incoming.duration)
/** How long after the window ends a deferred beat waits, so the carousel has moved on first. */
const ADVANCE_GRACE = 0.1
/** The latest a beat may land within the window. */
const LAND_BY = WINDOW - S.minReadBeforeAdvance
/** First beat: as configured, pulled earlier if the window is too short for it to land in time. */
const FIRST_AT = Math.max(0, Math.min(S.firstAt, LAND_BY - BEAT))

/** The front card's investments (Figma states 10842:73724 → 11004:16355); the stack cycles them forever. */
const investments = [
  { thumb: images['features/land'], title: '450SQM Parcel Of Land At Harmony Estate (Plot B)', meta: 'New investment', units: '10 Units' },
  { thumb: images['features/oyster'], title: 'OLAR Mabushi', meta: 'New investment', units: '25 Units' },
]
const N = investments.length
const next = (i: number) => (i + 1) % N
const prev = (i: number) => (i - 1 + N) % N

/*
 * Geometry (Figma). Every card is the front card's base (329.84 × 74.41) under its ×1.6038 placement,
 * centred at (314.5, 267.96). The back slot is the same card scaled to the Figma back card's rendered
 * width (455.24 ÷ 528.98) with its bottom edge where Figma's is (350.98), so the strip it shows below
 * the front card matches. Its backdrop blur keeps Figma's rendered 37.9px (25.5 × 1.4877) at the new
 * scale. Offsets are in base px (screen ÷ 1.6038).
 */
const FRONT_SCALE = 1.6038
const BACK_SLOT = { y: 19.75, scale: 0.8606, opacity: 0.64 }
const centred = 'absolute -translate-y-1/2'

type Role = 'front' | 'back' | 'spare'
type Roles = Record<Role, number>
/** Which of the three card elements plays which part. Static markup always starts here. */
const START_ROLES: Roles = { front: 0, back: 1, spare: 2 }
const roleOf = (roles: Roles, i: number) => (Object.keys(roles) as Role[]).find((r) => roles[r] === i)!
/** What each element shows when `front` is the investment in front. */
const itemsFor = (roles: Roles, front: number) => {
  const items: number[] = []
  items[roles.front] = front
  items[roles.back] = prev(front)
  items[roles.spare] = next(front)
  return items
}

/**
 * Shared by every copy of card 1 (the carousel renders a feature more than once, and mounts new
 * copies as it loops): the intro plays once per page load, and all copies show the same front card.
 */
const deck = {
  introPlayed: false,
  front: 0,
  listeners: new Set<(source: object) => void>(),
  emit(source: object) {
    deck.listeners.forEach((l) => l(source))
  },
}

const MOTION = '(prefers-reduced-motion: no-preference)'

/*
 * Card 1 — Fractional Ownership. Pill ×1.2303 (36 → 44.29) at (50, 140); the cards as above.
 *
 * Driven by the carousel through `active` / `playing`: play at the start of its window, pause while
 * the timer holds, stop stacking once it moves on (no reset: the cards stay as they are). Without
 * them (not in a carousel) it plays while on screen. Starting state comes from features.css before
 * the script runs (only with JS and motion allowed); without JS or with reduced motion it's state 1,
 * static.
 */
export function FractionalVisual({ active, playing }: VisualProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<(CardController & { leave: () => void }) | null>(null)
  const roles = useRef<Roles>({ ...START_ROLES })
  // Which investment each of the three card elements shows.
  const [items, setItems] = useState(() => itemsFor(START_ROLES, deck.front))
  const [pending] = useState(() => !deck.introPlayed)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, (context) => {
        const root = rootRef.current!
        const self = {}
        const q = (s: string, from: ParentNode = root) => from.querySelector<HTMLElement>(s)!
        const tile = q('[data-pill-tile]')
        const label = q('[data-pill-label]')
        const slots = [...root.querySelectorAll<HTMLElement>('[data-stack-slot]')]
        const cards = slots.map((s) => q('[data-stack-card]', s))
        const whites = slots.map((s) => q('[data-stack-white]', s))
        const contents = slots.map((s) => q('[data-stack-content]', s))
        const amounts = slots.map((s) => q('[data-tx-amount]', s))
        const F = CARD1.front
        const B = CARD1.back

        // Preload every thumbnail so no card ever lands on a blank image.
        investments.forEach(({ thumb }) => {
          const img = new Image()
          img.sizes = '79px'
          img.srcset = thumb.srcset
          img.src = thumb.src
        })

        /** Every card where its role puts it, at rest. */
        const place = () => {
          const r = roles.current
          slots.forEach((slot, i) => {
            const role = roleOf(r, i)
            gsap.set(slot, { zIndex: role === 'front' ? 3 : role === 'back' ? 2 : 1 })
            if (role === 'front') gsap.set(cards[i], { x: 0, y: 0, scale: 1, autoAlpha: 1 })
            if (role === 'back') gsap.set(cards[i], { x: 0, y: BACK_SLOT.y, scale: BACK_SLOT.scale, autoAlpha: BACK_SLOT.opacity })
            if (role === 'spare') gsap.set(cards[i], { x: 0, y: 0, scale: 1, autoAlpha: 0 })
            gsap.set([whites[i], contents[i]], { opacity: role === 'front' ? 1 : 0 })
            gsap.set(amounts[i], { scale: 1 })
          })
        }
        /** The finished intro: pill and cards in place. */
        const rest = () => {
          gsap.set(tile, { scale: 1, autoAlpha: 1 })
          gsap.set(label, { clipPath: 'none', autoAlpha: 1 })
          place()
        }
        /** Before the intro: pill and cards hidden, each at its starting offset. */
        const hide = () => {
          place()
          const r = roles.current
          gsap.set(tile, { scale: CARD1.tile.fromScale, autoAlpha: 0, transformOrigin: '50% 50%' })
          gsap.set(label, { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 0 })
          gsap.set(cards[r.front], { x: F.fromX / FRONT_SCALE, autoAlpha: 0 })
          gsap.set(cards[r.back], { y: BACK_SLOT.y + B.fromY / FRONT_SCALE, autoAlpha: 0 })
        }

        let intro: gsap.core.Timeline | undefined
        const buildIntro = () => {
          const r = roles.current
          const T = CARD1
          const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
              deck.introPlayed = true
              deck.emit(self)
            },
          })
          tl.to(tile, { scale: 1, autoAlpha: 1, duration: T.tile.duration, ease: T.tile.ease }, T.tile.at)
          tl.to(label, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: T.label.duration, ease: T.label.ease }, T.label.at)
          // Revealed: drop the clip, or it would keep cutting off the label's shadow.
          tl.set(label, { clipPath: 'none' }, T.label.at + T.label.duration)
          tl.to(cards[r.front], { x: 0, autoAlpha: 1, duration: F.duration, ease: F.ease }, F.at)
          tl.to(cards[r.back], { y: BACK_SLOT.y, autoAlpha: BACK_SLOT.opacity, duration: B.duration, ease: B.ease }, B.at)
          return tl
        }

        // Time since this window started (pauses with it), to keep beats inside the window.
        const clock = gsap.to({}, { duration: 1e6, ease: 'none', paused: true })
        let beatTl: gsap.core.Timeline | undefined
        let nextBeat: gsap.core.Tween | undefined
        let state: 'hidden' | 'rest' | 'playing' | 'paused' = 'hidden'

        /** Next beat `delay` from now, unless it would land too close to the window's end. */
        const scheduleBeat = (delay: number) => {
          const now = clock.time()
          let at = now + delay
          // (A beat due right at the window's end counts too: it would start as the carousel slides away.)
          if (at < WINDOW + ADVANCE_GRACE && at + BEAT > LAND_BY) at = WINDOW + ADVANCE_GRACE
          nextBeat = gsap.delayedCall(at - now, beat)
        }

        const beat = context.add('beat', () => {
          const r = roles.current
          const [inc, cur, old] = [r.spare, r.front, r.back]
          const I = S.incoming
          const newFront = next(deck.front)
          gsap.set(slots[inc], { zIndex: 3 })
          gsap.set(slots[cur], { zIndex: 2 })
          gsap.set(slots[old], { zIndex: 1 })
          gsap.set([whites[inc], contents[inc]], { opacity: 1 })

          beatTl = gsap.timeline()
          // The front card sinks into the back slot, turning into the frosted strip.
          beatTl.to(cards[cur], { y: BACK_SLOT.y, scale: BACK_SLOT.scale, autoAlpha: BACK_SLOT.opacity, ...S.toBack }, 0)
          beatTl.to(contents[cur], { opacity: 0, duration: S.contentFade.duration, ease: S.contentFade.ease }, S.contentFade.at)
          beatTl.to(whites[cur], { opacity: 0, duration: S.whiteFade.duration, ease: S.whiteFade.ease }, S.whiteFade.at)
          // The old back card recedes behind it and fades away.
          beatTl.to(cards[old], { y: S.exit.toY / FRONT_SCALE, scale: BACK_SLOT.scale * S.exit.toScale, autoAlpha: 0, duration: S.exit.duration, ease: S.exit.ease }, 0)
          // The next investment stacks on top.
          beatTl.fromTo(
            cards[inc],
            { x: 0, y: I.fromY / FRONT_SCALE, scale: I.fromScale },
            { y: 0, scale: 1, duration: I.duration, ease: I.ease },
            I.delay,
          )
          beatTl.fromTo(cards[inc], { autoAlpha: 0 }, { autoAlpha: 1, duration: I.fade, ease: I.fadeEase }, I.delay)
          if (S.unitsAccent.enabled) {
            const a = S.unitsAccent
            beatTl.to(amounts[inc], { scale: a.scale, duration: a.duration / 2, ease: a.ease, yoyo: true, repeat: 1 }, I.delay + I.duration - a.beforeLand)
          }
          // Landed: rotate the roles; the element now spare (hidden) gets the card after the new front.
          beatTl.call(
            () => {
              roles.current = { front: inc, back: cur, spare: old }
              deck.front = newFront
              setItems(itemsFor(roles.current, newFront))
              deck.emit(self)
            },
            [],
            BEAT,
          )
          scheduleBeat(S.every)
        })

        const startWindow = () => {
          clock.play(0)
          scheduleBeat(FIRST_AT)
        }
        const play = () => {
          if (state === 'playing') return
          if (state === 'paused') {
            clock.resume()
            intro?.resume()
            beatTl?.resume()
            nextBeat?.resume()
          } else {
            if (state === 'hidden') {
              if (deck.introPlayed) rest()
              else (intro ??= buildIntro()).play(0)
            }
            startWindow()
          }
          state = 'playing'
        }
        const pause = () => {
          if (state !== 'playing') return
          clock.pause()
          intro?.pause()
          beatTl?.pause()
          nextBeat?.pause()
          state = 'paused'
        }
        /** The carousel moved on: no new beats; whatever is moving finishes, then the cards stay put. */
        const leave = () => {
          if (state !== 'playing' && state !== 'paused') return
          nextBeat?.kill()
          nextBeat = undefined
          clock.pause()
          intro?.resume()
          beatTl?.resume()
          state = 'rest'
        }
        const hideNow = () => {
          intro?.kill()
          intro = undefined
          beatTl?.kill()
          nextBeat?.kill()
          beatTl = nextBeat = undefined
          clock.pause(0)
          roles.current = { ...START_ROLES }
          setItems(itemsFor(roles.current, deck.front))
          hide()
          state = 'hidden'
        }
        /** Dev / console: back to before the intro, on every copy. */
        const reset = () => {
          deck.introPlayed = false
          deck.front = 0
          deck.emit(self)
          hideNow()
        }
        controller.current = { play, pause, reset, leave }

        // Other copies: follow the shared deck while this one isn't the one moving.
        const onDeck = (source: object) => {
          if (source === self) return
          if (!deck.introPlayed) {
            if (state !== 'hidden') hideNow()
            return
          }
          if (state === 'playing' || state === 'paused') return
          setItems(itemsFor(roles.current, deck.front))
          if (state === 'hidden') {
            rest()
            state = 'rest'
          }
        }
        deck.listeners.add(onDeck)

        if (deck.introPlayed) {
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
          deck.listeners.delete(onDeck)
          intro?.kill()
          clock.kill()
          beatTl?.kill()
          nextBeat?.kill()
          controller.current = null
          // Back to the static markup (features.css places each card by its data-stack-role).
          gsap.set([tile, label, ...slots, ...cards, ...whites, ...contents, ...amounts], {
            clearProps: 'opacity,visibility,transform,translate,rotate,scale,clipPath,transformOrigin,zIndex',
          })
          roles.current = { ...START_ROLES }
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
    cardControllers.set(0, c)
    return () => {
      if (cardControllers.get(0) === c) cardControllers.delete(0)
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
      { threshold: CARD1.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    cardControllers.set(0, c)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      if (cardControllers.get(0) === c) cardControllers.delete(0)
    }
  }, [active])

  // The back slot for the static CSS (features.css), from the same numbers the script uses.
  const backSlot = {
    '--stack-back-y': `${BACK_SLOT.y}px`,
    '--stack-back-scale': BACK_SLOT.scale,
    '--stack-back-opacity': BACK_SLOT.opacity,
  } as CSSProperties

  return (
    <Visual background="var(--color-forest)">
      <div ref={rootRef} data-card1 data-anim={pending ? 'pending' : undefined} className="absolute inset-0" style={backSlot}>
        <ProductPill
          data-feature-pill
          icon={briefcaseIcon}
          label="My Portfolio"
          className="absolute top-[140px] left-[50px] origin-top-left scale-[1.2303]"
        />
        {/* Three card elements trade roles: front (white), back (frosted strip below it), spare (hidden,
            holding the next investment). Front: rendered 529 × 119.33 at (50, 208.29), running past the
            visual's right edge and clipped, as designed. */}
        {items.map((item, i) => {
          const inv = investments[item]
          return (
            <div
              key={i}
              data-stack-slot
              data-stack-role={roleOf(START_ROLES, i)}
              className={`${centred} top-[267.96px] left-[149.58px] h-[74.41px] w-[329.84px] scale-[1.6038]`}
            >
              {/* The card's surface is the frosted back recipe; the white layer makes it the solid front card. */}
              <div
                data-stack-card
                className="relative size-full bg-white/30 shadow-[0_4px_34px_rgba(0,0,0,0.25)] backdrop-blur-[27.5px]"
              >
                <div data-stack-white className="absolute inset-0 bg-white" />
                <TransactionCard
                  data-stack-content
                  media={
                    // Not lazy: the carousel clips off-screen cards, so a lazy image would only load as its card slides in.
                    <img
                      src={inv.thumb.src}
                      srcSet={inv.thumb.srcset}
                      sizes="79px"
                      width={inv.thumb.width}
                      height={inv.thumb.height}
                      alt=""
                      fetchPriority="low"
                      className="size-[49.09px] shrink-0 object-cover"
                    />
                  }
                  title={inv.title}
                  meta={inv.meta}
                  amount={inv.units}
                  amountClassName="product-amount text-forest"
                  surfaceClassName=""
                  shadowClassName=""
                  widthClassName="w-full"
                  paddingClassName="relative h-full pr-4 pl-[11.87px]"
                  gapClassName="gap-[13.89px]"
                  titleClassName="max-w-[162.74px]"
                />
              </div>
            </div>
          )
        })}
      </div>
    </Visual>
  )
}
