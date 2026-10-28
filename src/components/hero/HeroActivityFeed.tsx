import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import appIcon from '../../assets/icons/fraqshares-app.svg'
import moneyReceiveIcon from '../../assets/icons/money-receive.svg'
import moneySendIcon from '../../assets/icons/money-send.svg'
import { TransactionCard } from '../product/TransactionCard.tsx'
import { HERO_COPY_SHOWN } from './heroEvents.ts'
import './heroFeed.css'

gsap.registerPlugin(useGSAP, CustomEase)

/*
 * Rally's springy pop (getrally.com hero, WhatsApp slide), read from its CSS: a keyframed scale with
 * an overshoot and a dip, every step eased by the same cubic-bezier. CSS applies a timing function
 * to each keyframe interval; GSAP's percentage keyframes with easeEach do the same.
 *   bubbles  rf-pop-el  0.46s  scale .5 → 1.07 (58%) → .98 (80%) → 1, opacity 1 by 45%, origin centre
 *   groups   rf-pop     0.48s  scale .15 → 1.07 (58%) → .975 (80%) → 1
 *   rows     rf-rise    0.28s  translateY(≈4px) → 0, opacity 0 → 1, cubic-bezier(.2, .9, .3, 1.08)
 */
CustomEase.create('rallyPop', 'M0,0 C0.3,0.7 0.35,1 1,1')
CustomEase.create('rallyRise', 'M0,0 C0.2,0.9 0.3,1.08 1,1')

/**
 * Intro micro-animation. Seconds unless marked; positions are from the start of the intro.
 * The dot is the phone in the photo: it pops in with the line climbing out of it, and the cards pop
 * into the stack one after another, bottom to top, as if arriving on the phone. Then (loop) the
 * signal repeats: the cards clear, the line drains back into the dot, the dot leaves, and it pops
 * back in with the line, and the cards arrive again.
 */
const FEED = {
  /** Starts after the hero copy has shown (headline, paragraph, buttons) and the photo has loaded,
   *  plus this, so the copy and then the dot read as one sequence. */
  startDelay: 0.3,
  /** Stop waiting for the copy / photo / fonts after this long (ms). */
  readyTimeoutMs: 4500,

  /** The dot appears first, popping in from nothing; it starts pulsing as it lands. */
  /** Rally's group pop: scale 0.15 → peak → dip → 1 (rf-pop), fading in over the first fadeAt. */
  dot: { duration: 0.48, from: 0.15, peak: 1.07, dip: 0.975, fadeAt: 0.2, ease: 'rallyPop' },
  /** Dot breathing (scale 1 → peak → 1 per period) and the ripple ring, both looping. */
  pulse: { period: 1.6, peak: 1.08, ease: 'sine.inOut' },
  ripple: { period: 1.6, scale: 2.4, opacity: 0.45, ease: 'power2.out' },

  /** The line is revealed from the dot up, starting this long after the dot starts popping in
   *  (0 = together, intro and loop), then its dashes keep flowing toward the cards. */
  line: { at: 0, duration: 0.6, ease: 'power2.inOut' },
  /** Seconds per dash + gap (11.6px) of upward travel. */
  flowPeriod: 1,

  /** Cards, bottom to top: land purchase, wallet funded, notification. Start as the line tops out. */
  cards: {
    stagger: 0.22,
    /**
     * 'rally' = Rally's keyframed pop (below). 'back' / 'elastic' = the earlier eased rise and grow
     * (back.out(1.7) / elastic.out(1, 0.6)), kept for comparison.
     */
    bounce: 'rally' as 'rally' | 'back' | 'elastic',
    rally: { duration: 0.46, from: 0.5, peak: 1.07, dip: 0.98, fadeAt: 0.45, ease: 'rallyPop', origin: '50% 50%' },
    eases: { back: 'back.out(1.7)', elastic: 'elastic.out(1, 0.6)' },
    fromY: 24,
    fromScale: 0.85,
    duration: 0.6,
    fadeDuration: 0.2,
  },
  /** The card's content fills in just after the card lands: Rally's row rise (4px, slight overshoot). */
  settle: { delay: 0.08, y: 4, duration: 0.28, ease: 'rallyRise' },
  /** The notification card's backdrop blur fades in once the card has landed (no blur while scaling). */
  blurIn: { delay: 0.45, duration: 0.3, ease: 'power1.out' },
  /** Amount pulse as each transaction card lands. */
  amountAccent: { enabled: true, at: 0.45, scale: 1.08, duration: 0.3, ease: 'power2.inOut' },
  /** Ghost card ("older notifications"): quieter, no bounce. Starts one stagger after the notification. */
  ghost: { fromY: 8, duration: 0.5, ease: 'power2.out' },

  /**
   * Repeat the whole intro, forever: hold with the cards in place, fade them out top to bottom,
   * drain the line back into the dot, then the dot stops pulsing and shrinks away; after dotGap it
   * pops back in with the line climbing (as in the intro) and the cards pop back in. Stops, with everything shown, while the page is scrolled away from the top; starts
   * again from the hold when it's back.
   */
  loop: true,
  loopHold: 5,
  loopOut: { duration: 0.3, stagger: 0.1, ease: 'power1.in' },
  lineOut: { duration: 0.45, ease: 'power2.in' },
  dotOut: { duration: 0.35, ease: 'power2.in' },
  /** Empty beat between the dot leaving and coming back. */
  dotGap: 0.4,
}

/** Pulse / ripple / flow and the optional loop: paused off screen and in background tabs. */
type Ambient = { pause: () => void; resume: () => void; kill: () => void }

declare global {
  interface Window {
    /** DEV only: the feed intro, for tuning in the console. */
    heroFeed?: { timeline: gsap.core.Timeline; replay: () => void; config: typeof FEED }
  }
}

/**
 * DEV ONLY, compiled out of production builds: ?replay=1 adds a button that replays the intro;
 * ?speed=0.5 slows every GSAP animation on the page (gsap.globalTimeline.timeScale) for review.
 */
const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
const showReplay = !!devParams?.has('replay')
const devSpeed = Number(devParams?.get('speed'))
if (devSpeed > 0) gsap.globalTimeline.timeScale(devSpeed)

const LINE_LENGTH = 93
/** Figma spaces 6/6 dashes to fit 93px: 16 half-periods, with a half dash at each end. */
const DASH = LINE_LENGTH / 16
/** Pattern phase that puts a half dash at the bottom (the line is drawn from the dot upward). */
const DASH_PHASE = DASH / 2

/*
 * Figma: Group 2147222581 (10952:46209). Illustrative product UI, so the whole graphic is
 * aria-hidden. Coordinates are relative to the 306px-wide wrapper (Figma left 988, top 103).
 *
 * Intro states: before the script runs, heroFeed.css hides the cards and clips the line (only with
 * JS on and motion allowed), so nothing flashes; without JS or with reduced motion the feed is
 * simply in its final state. Every faded piece is a leaf marked data-feed-fade, which the hero →
 * section-2 scroll transition also fades; the notification card's blur, surface and content are
 * separate leaves so neither fade ever puts opacity on an ancestor of its backdrop-filter.
 */
const cardShadow = 'shadow-[0_4px_24px_rgba(0,0,0,0.15)]'

export function HeroActivityFeed({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [replay, setReplay] = useState<(() => void) | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current!
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', (context) => {
        // Hidden below 1200px (no layout box): nothing to animate, show the final state.
        if (!root.getClientRects().length) {
          root.dataset.intro = 'done'
          return
        }
        const q = <E extends Element = HTMLElement>(s: string) => root.querySelector<E>(s)!
        const card = (name: string) => q(`[data-feed-card="${name}"]`)
        const landCard = card('transaction-out')
        const walletCard = card('transaction-in')
        const notification = card('notification')
        const ghost = card('ghost')
        const surface = q('[data-feed-surface]')
        const blur = q('[data-feed-blur]')
        const notificationContent = q('[data-feed-content]')
        const dot = q('[data-feed-dot]')
        const ripple = q('[data-feed-ripple]')
        const line = q('[data-feed-line]')
        const dashes = q<SVGLineElement>('[data-feed-dashes]')

        // Each popping card: what transforms, what fades in, what settles, the amount to accent.
        const popCards = [
          { el: landCard, fade: [landCard], content: [...landCard.children], amount: landCard.lastElementChild },
          { el: walletCard, fade: [walletCard], content: [...walletCard.children], amount: walletCard.lastElementChild },
          { el: notification, fade: [surface], content: [notificationContent], amount: null },
        ]
        const C = FEED.cards
        const R = C.rally
        const rally = C.bounce === 'rally'
        const cardEase = rally ? R.ease : C.eases[C.bounce as 'back' | 'elastic']
        /** Where a card starts: Rally's pop is a pure scale from the centre; back/elastic also rise. */
        const cardStart = rally
          ? { y: 0, scale: R.from, transformOrigin: R.origin }
          : { y: C.fromY, scale: C.fromScale, transformOrigin: '50% 100%' }
        /** A keyframed pop (scale from → peak at 58% → dip at 80% → 1), each step eased, as Rally's CSS. */
        const popKeyframes = (from: number, peak: number, dip: number, ease: string) => ({
          keyframes: { '0%': { scale: from }, '58%': { scale: peak }, '80%': { scale: dip }, '100%': { scale: 1 }, easeEach: ease },
          ease: 'none',
        })

        const LINE_HIDDEN = 'inset(100% 0% 0% 0%)'
        const LINE_SHOWN = 'inset(0% 0% 0% 0%)'
        const fadeIns = [landCard, walletCard, surface, notificationContent, blur, ghost]
        /** The intro's starting state: no dot, no line, no cards. */
        const hideAll = () => {
          gsap.set([landCard, walletCard, notification], cardStart)
          gsap.set(ghost, { y: FEED.ghost.fromY })
          gsap.set(fadeIns, { autoAlpha: 0 })
          gsap.set(dot, { scale: FEED.dot.from, autoAlpha: 0, transformOrigin: '50% 50%' })
          gsap.set(line, { clipPath: LINE_HIDDEN })
        }
        // The CSS initial state hands over to these inline values (identical) before first paint.
        hideAll()
        root.dataset.intro = 'running'

        /** The cards pop in bottom to top, then the ghost. Built fresh for the intro and each loop. */
        const cardsIn = (immediateRender = true) => {
          const tl = gsap.timeline({ defaults: { immediateRender } })
          popCards.forEach(({ el, fade, content, amount }, i) => {
            const at = i * C.stagger
            if (rally) {
              tl.set(el, { y: 0, transformOrigin: R.origin }, at)
              tl.to(el, { ...popKeyframes(R.from, R.peak, R.dip, R.ease), duration: R.duration }, at)
              // Opaque by 45% of the pop (Rally), on the same per-step ease.
              tl.fromTo(fade, { autoAlpha: 0 }, { autoAlpha: 1, duration: R.duration * R.fadeAt, ease: R.ease }, at)
            } else {
              tl.fromTo(el, { y: C.fromY, scale: C.fromScale }, { y: 0, scale: 1, duration: C.duration, ease: cardEase }, at)
              tl.fromTo(fade, { autoAlpha: 0 }, { autoAlpha: 1, duration: C.fadeDuration, ease: 'none' }, at)
            }
            tl.fromTo(
              content,
              { autoAlpha: 0, y: FEED.settle.y },
              { autoAlpha: 1, y: 0, duration: FEED.settle.duration, ease: FEED.settle.ease },
              at + FEED.settle.delay,
            )
            if (el === notification) {
              tl.fromTo(blur, { autoAlpha: 0 }, { autoAlpha: 1, duration: FEED.blurIn.duration, ease: FEED.blurIn.ease }, at + FEED.blurIn.delay)
            }
            if (amount && FEED.amountAccent.enabled) {
              const a = FEED.amountAccent
              tl.to(amount, { scale: a.scale, duration: a.duration / 2, ease: a.ease, yoyo: true, repeat: 1 }, at + a.at)
            }
          })
          const g = FEED.ghost
          tl.fromTo(ghost, { autoAlpha: 0, y: g.fromY }, { autoAlpha: 1, y: 0, duration: g.duration, ease: g.ease }, popCards.length * C.stagger)
          return tl
        }

        // --- Ambient loops (pulse, ripple, line flow, optional replay loop) -------------------------
        const loops: gsap.core.Animation[] = []
        const ambient: Ambient = {
          pause: () => loops.forEach((l) => l.pause()),
          resume: () => loops.forEach((l) => l.resume()),
          kill: () => loops.forEach((l) => l.kill()),
        }
        let pulsing: gsap.core.Animation[] = []
        const startPulse = () => {
          if (pulsing.length) return
          const p = FEED.pulse
          const r = FEED.ripple
          pulsing = [
            gsap.to(dot, { scale: p.peak, transformOrigin: '50% 50%', duration: p.period / 2, ease: p.ease, yoyo: true, repeat: -1 }),
            gsap.fromTo(ripple, { scale: 1, autoAlpha: r.opacity }, { scale: r.scale, autoAlpha: 0, duration: r.period, ease: r.ease, repeat: -1 }),
          ]
          loops.push(...pulsing)
          if (!(onScreen && document.visibilityState === 'visible')) pulsing.forEach((l) => l.pause())
        }
        /** Stop the breathing and the ripple (the loop takes the dot away), leaving the dot as it is. */
        const stopPulse = () => {
          pulsing.forEach((l) => {
            l.kill()
            loops.splice(loops.indexOf(l), 1)
          })
          pulsing = []
          gsap.set(ripple, { autoAlpha: 0 })
        }
        let flowing = false
        const startFlow = () => {
          if (flowing) return
          flowing = true
          // The pattern repeats every dash + gap, so moving the offset by one period loops seamlessly.
          loops.push(gsap.fromTo(dashes, { strokeDashoffset: DASH_PHASE }, { strokeDashoffset: DASH_PHASE - 2 * DASH, duration: FEED.flowPeriod, ease: 'none', repeat: -1 }))
        }
        const L = FEED.line
        const D = FEED.dot
        /** The dot's entrance: Rally's group pop, fading in over its first fadeAt. */
        const dotPop = (tl: gsap.core.Timeline, at: number) => {
          tl.set(dot, { scale: D.from, autoAlpha: 0 }, at)
          tl.to(dot, { ...popKeyframes(D.from, D.peak, D.dip, D.ease), duration: D.duration }, at)
          tl.to(dot, { autoAlpha: 1, duration: D.duration * D.fadeAt, ease: 'power1.out' }, at)
        }
        // Landed cards drop their (identity) transforms: an inline translate/scale keeps them on their own
        // compositor layer, which renders their text differently from the static feed.
        const landed = [landCard, walletCard, notification, ghost, notificationContent, ...popCards.flatMap((c) => [...c.content, c.amount])].filter(
          (el): el is Element => !!el,
        )
        const settleLanded = () => gsap.set(landed, { clearProps: 'transform,translate,rotate,scale' })

        // --- Loop: one cycle at a time, each built fresh, so it can stop cleanly at any point ----------
        let looping = false
        let cycle: gsap.core.Timeline | undefined
        const atRest = () => window.scrollY <= 0
        const runCycle = () => {
          const o = FEED.loopOut
          const lo = FEED.lineOut
          const topToBottom = [[ghost], [surface, notificationContent, blur], [walletCard], [landCard]]
          const tl = gsap.timeline({
            defaults: { immediateRender: false },
            onComplete: () => {
              settleLanded()
              runCycle()
            },
          })
          const outAt = FEED.loopHold
          topToBottom.forEach((targets, i) => tl.to(targets, { autoAlpha: 0, duration: o.duration, ease: o.ease }, outAt + i * o.stagger))
          const drainAt = tl.duration()
          tl.fromTo(line, { clipPath: LINE_SHOWN }, { clipPath: LINE_HIDDEN, duration: lo.duration, ease: lo.ease }, drainAt)
          // The dot leaves (from wherever its breathing has it) and comes back as in the intro.
          const dotOutAt = drainAt + lo.duration
          tl.call(stopPulse, [], dotOutAt)
          tl.to(dot, { scale: 0, autoAlpha: 0, duration: FEED.dotOut.duration, ease: FEED.dotOut.ease }, dotOutAt)
          const dotInAt = dotOutAt + FEED.dotOut.duration + FEED.dotGap
          dotPop(tl, dotInAt)
          tl.call(startPulse, [], dotInAt + D.duration)
          const climbAt = dotInAt + L.at
          tl.fromTo(line, { clipPath: LINE_HIDDEN }, { clipPath: LINE_SHOWN, duration: L.duration, ease: L.ease }, climbAt)
          tl.add(cardsIn(false), climbAt + L.duration)
          cycle = tl
          if (!(onScreen && document.visibilityState === 'visible')) tl.pause()
        }
        /** Stop the loop with everything in place (cards shown, line up), e.g. when the page scrolls. */
        const stopCycle = () => {
          if (!cycle) return
          cycle.kill()
          cycle = undefined
          gsap.set(fadeIns, { autoAlpha: 1 })
          gsap.set(line, { clipPath: LINE_SHOWN })
          gsap.set(dot, { scale: 1, autoAlpha: 1 })
          startPulse()
          settleLanded()
        }
        const startLoop = () => {
          if (!FEED.loop) return
          looping = true
          if (atRest()) runCycle()
        }

        // --- The intro ------------------------------------------------------------------------------
        const intro = gsap.timeline({
          paused: true,
          onComplete: () => {
            root.dataset.intro = 'done'
            settleLanded()
            startLoop()
          },
        })
        dotPop(intro, 0)
        intro.call(startPulse, [], D.duration)
        intro.fromTo(line, { clipPath: LINE_HIDDEN }, { clipPath: LINE_SHOWN, duration: L.duration, ease: L.ease }, L.at)
        intro.call(startFlow, [], L.at + L.duration)
        intro.add(cardsIn(), L.at + L.duration)

        /** Straight to the end state, firing the calls on the way (pulse, flow, loop start). */
        const finish = () => {
          if (intro.progress() < 1) intro.progress(1, false)
        }

        // Scrolling away from the top: finish the intro and stop the loop with the cards in place, so
        // the scroll fade-out starts clean and nothing else animates their opacity meanwhile. Back at
        // the top, the loop starts again from its hold.
        const onScroll = () => {
          if (!atRest()) {
            finish()
            stopCycle()
          } else if (looping && !cycle) runCycle()
        }
        window.addEventListener('scroll', onScroll, { passive: true })

        // Pause the ambient motion and the loop off screen and in background tabs.
        let onScreen = true
        const sync = () => {
          const live = onScreen && document.visibilityState === 'visible'
          if (live) {
            ambient.resume()
            cycle?.resume()
          } else {
            ambient.pause()
            cycle?.pause()
          }
        }
        const io = new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting
          sync()
        })
        io.observe(root)
        document.addEventListener('visibilitychange', sync)

        // Start once the hero copy has shown and the photo has loaded (or after the timeout).
        const hero = root.closest<HTMLElement>('[data-hero]')
        const photo = hero?.querySelector<HTMLImageElement>('[data-hero-photo]')
        const photoReady = photo ? photo.decode().catch(() => {}) : Promise.resolve()
        const copyShown = new Promise<void>((resolve) => {
          if (!hero || hero.dataset.copy === 'shown') return resolve()
          hero.addEventListener(HERO_COPY_SHOWN, () => resolve(), { once: true })
        })
        const timeout = new Promise((r) => setTimeout(r, FEED.readyTimeoutMs))
        let cancelled = false
        let delayed: gsap.core.Tween | undefined
        const begin = context.add('begin', () => {
          if (cancelled) return
          if (window.scrollY > 0) finish()
          else delayed = gsap.delayedCall(FEED.startDelay, () => intro.play(0))
          sync()
        })
        Promise.race([Promise.all([document.fonts.ready, photoReady, copyShown]), timeout]).then(() => begin())

        const replayIntro = context.add('replay', () => {
          cycle?.kill()
          cycle = undefined
          looping = false
          ambient.kill()
          loops.length = 0
          pulsing = []
          flowing = false
          hideAll()
          intro.restart()
        })
        if (import.meta.env.DEV) window.heroFeed = { timeline: intro, replay: () => replayIntro(), config: FEED }
        if (showReplay) setReplay(() => () => replayIntro())

        return () => {
          cancelled = true
          delayed?.kill()
          window.removeEventListener('scroll', onScroll)
          document.removeEventListener('visibilitychange', sync)
          io.disconnect()
          cycle?.kill()
          ambient.kill()
          intro.kill()
          root.dataset.intro = 'done'
          gsap.set([landCard, walletCard, notification, ghost, surface, blur, notificationContent, dot, ripple, line, dashes, ...popCards.flatMap((c) => [...c.content, c.amount])].filter(Boolean), {
            clearProps: 'opacity,visibility,transform,translate,rotate,scale,clipPath,strokeDashoffset',
          })
          if (import.meta.env.DEV) delete window.heroFeed
          if (showReplay) setReplay(null)
        }
      })
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} aria-hidden="true" data-feed data-intro="pending" className={`product-ui w-[306px] ${className}`}>
      <div data-feed-stack className="flex flex-col gap-2">
        {/* Older notifications fading up the stack. */}
        <div
          data-feed-card="ghost"
          data-feed-fade
          className={`h-[72px] bg-linear-to-b from-white/0 from-40% to-white/5 ${cardShadow}`}
        />

        {/* Figma "background blur 44" = CSS blur(22px): Figma's value is twice the CSS radius.
            Blur, surface and content are separate layers (see above); the content box matches the
            card's so "Now" keeps its position relative to the card. */}
        <div data-feed-card="notification" className="relative h-[125px] text-white">
          <div data-feed-blur data-feed-fade className="absolute inset-0 backdrop-blur-[22px]" />
          <div data-feed-surface data-feed-fade className={`absolute inset-0 bg-white/10 ${cardShadow}`} />
          <div data-feed-content data-feed-fade className="absolute inset-0 px-4 pt-[13px]">
            <div className="flex items-center gap-2">
              <img src={appIcon} width={24} height={24} alt="" />
              <p className="product-app">Fraqshares</p>
            </div>
            <p className="product-time absolute top-[19px] left-[266px]">Now</p>
            <p className="product-title mt-[21px]">New Property Listing</p>
            <p className="product-detail mt-1 max-w-[236px]">
              We have found new properties for you to add to your portfolio.
            </p>
          </div>
        </div>

        <TransactionCard
          data-feed-card="transaction-in"
          data-feed-fade
          media={<img src={moneyReceiveIcon} width={32} height={32} alt="" className="shrink-0" />}
          title="Wallet successfully funded"
          meta="10 minutes ago"
          amount="+₦250,000"
          amountClassName="product-amount text-money-in"
        />
        <TransactionCard
          data-feed-card="transaction-out"
          data-feed-fade
          media={<img src={moneySendIcon} width={32} height={32} alt="" className="shrink-0" />}
          title="1 unit of 450sqm of land purchased"
          meta="2 hours ago"
          amount="-₦360,000"
          amountClassName="product-amount text-money-out"
        />
      </div>

      {/* Connector: line runs y 359→452 and the dot centres at (153, 479) in wrapper space
          (section 1141, 462→555 and 582). The dot's 7px ring sits fully outside it (Figma: r 11 → 18). */}
      <div data-feed-connector data-feed-fade className="absolute top-[359px] left-[135px] h-[138px] w-9">
        {/* 2px white, 6/6 dashes fitted to 93px with half dashes at both ends (as Figma). Drawn from
            the dot upward, so a falling stroke-dashoffset carries the dashes toward the cards. */}
        <svg
          data-feed-line
          xmlns="http://www.w3.org/2000/svg"
          width="2"
          height={LINE_LENGTH}
          viewBox={`0 0 2 ${LINE_LENGTH}`}
          fill="none"
          className="absolute top-0 left-[17px]"
        >
          <line
            data-feed-dashes
            x1="1"
            y1={LINE_LENGTH}
            x2="1"
            y2="0"
            stroke="white"
            strokeWidth="2"
            strokeDasharray={`${DASH} ${DASH}`}
            strokeDashoffset={DASH_PHASE}
          />
        </svg>
        {/* Ripple: a 2px ring the size of the dot, expanding behind it (the dot's own ring is untouched). */}
        <span data-feed-ripple className="absolute top-[109px] left-[7px] size-[22px] rounded-full border-2 border-white opacity-0" />
        <svg
          data-feed-dot
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className="absolute top-[102px] left-0"
        >
          <circle data-feed-dot-ring cx="18" cy="18" r="14.5" stroke="white" strokeOpacity="0.2" strokeWidth="7" />
          <circle cx="18" cy="18" r="11" fill="white" />
        </svg>
      </div>

      {import.meta.env.DEV &&
        replay &&
        createPortal(
          <button
            type="button"
            onClick={replay}
            className="fixed bottom-4 left-4 z-50 bg-white px-3 py-2 text-button text-black shadow-lg"
          >
            Replay feed intro
          </button>,
          document.body,
        )}
    </div>
  )
}
