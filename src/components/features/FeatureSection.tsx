import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { useMediaQuery } from '../../motion/useMediaQuery.ts'
import { ArrowIcon } from '../icons/ArrowIcon.tsx'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { buttonBase, focusRing } from '../linkStyles.ts'
import { SIGNUP_URL } from '../siteLinks.ts'
import './features.css'
import { featureTiming as F } from './featureTiming.ts'
import { FractionalVisual } from './FractionalVisual.tsx'
import { type VisualProps } from './FeatureVisuals.tsx'
import { PortfolioVisual } from './PortfolioVisual.tsx'
import { RealEstateVisual } from './RealEstateVisual.tsx'
import { VerifiedVisual } from './VerifiedVisual.tsx'

type Feature = { tab: string; title: string; body: string; Visual: ComponentType<VisualProps> }

const features: Feature[] = [
  {
    tab: 'Fractional Ownership',
    title: 'Fractional Ownership. A Smaller Starting Point.',
    body: 'Buy shares in premium real estate and businesses without covering the full purchase price. Start with a share and build from there.',
    Visual: FractionalVisual,
  },
  {
    tab: 'One Portfolio',
    title: 'One Portfolio. More Possibilities.',
    body: 'Diversify across properties, land, and businesses, spreading your investments beyond a single asset or market.',
    Visual: PortfolioVisual,
  },
  {
    tab: 'Premium Real Estate',
    title: 'Premium Real Estate. Income-Generating Businesses.',
    body: 'Access luxury properties and revenue-generating businesses through fractional investing, with opportunities to match your investment goals.',
    Visual: RealEstateVisual,
  },
  {
    tab: 'Verified Assets',
    title: 'Verified Assets. Professional Management.',
    body: 'Explore independently verified properties and businesses, with professional management to oversee operations and keep you informed.',
    Visual: VerifiedVisual,
  },
]

const COUNT = features.length
/** Card width + gap: one step of the track. Desktop 537 + 32. */
const CARD_PITCH = 537 + 32
/**
 * Mobile (Figma 11004:15574): 320px cards 24 apart from x 24, the next one peeking 25px at 393. On
 * narrower phones the card narrows to keep that peek (100vw − 24 − 24 − 25); the pitch is measured.
 */
const MOBILE_GAP = 24
const mobileCardWidth = 'max-lg:w-[min(320px,calc(100vw-73px))]'
/** Cards rendered on each side of the active one: covers the peek and a two-card tab jump. */
const WINDOW = 3
/** Wraps any (possibly negative) track position onto a feature index. */
const wrap = (v: number) => ((v % COUNT) + COUNT) % COUNT

/**
 * Mobile swipe. A drag decides its axis after `slop` px: vertical stays a page scroll (the viewport is
 * touch-action: pan-y), horizontal moves the track with the finger. On release it snaps to the card
 * the drag plus `momentum` ms of its speed lands nearest, at most WINDOW cards away. Short of that,
 * a flick (over `flick` px/ms, at least `minFlick` px) or a drag past `distance` of a card still
 * moves one card; anything less snaps back.
 */
const SWIPE = { slop: 8, momentum: 180, flick: 0.3, minFlick: 20, distance: 0.25 }

// Live media/visibility values (useSyncExternalStore: no state syncing inside effects).
const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}

/**
 * Figma: Desktop - 13 (10801:25312), 1440 × 1108. Tabbed feature carousel, looping endlessly.
 *
 * `position` is a track position that only ever counts on (or back one for "previous"); the
 * active feature is position wrapped onto 0–3. Cards are laid out by position, so after card 4
 * comes card 1 again as the blurred peek, and the track keeps sliding forward. Only the cards
 * within WINDOW of the active one are rendered; new ones mount off screen right, old ones
 * unmount off screen left.
 *
 * The timer IS the active tab's progress line: a CSS animation filling over F.intervalMs whose
 * animationend advances one card. It runs continuously (no hover/focus pause). It only holds
 * while the carousel is mostly off screen or the page is hidden, so it starts on the card you
 * left. Reduced motion: no auto-advance and no slide; tabs switch cards instantly.
 * Each visual gets `active` (this copy is the active card: a feature can be rendered more than once
 * inside the window) and `playing` (the timer is running), and runs its micro-animation from them.
 *
 * Mobile, below 1024px (Figma 11004:15574): the header centred, the track from 24px with 320px cards
 * (visuals as scaled artboards) and the next one peeking blurred at the right edge; no tabs. Under
 * the track, four dashes, the active one carrying the same timer (the hidden tab's animation doesn't
 * run), then the previous / next arrows. Swipe moves the track. Arrows and swipes restart the timer.
 * Tablets: the column caps at 560px and the track is clipped at its edge.
 */
export function FeatureSection() {
  const [position, setPosition] = useState(0)
  const [inView, setInView] = useState(false)
  const [dragging, setDragging] = useState(false)
  /** Bumped by arrows and swipes: remounts the progress lines, restarting the timer. */
  const [timerKey, setTimerKey] = useState(0)
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches)
  const pageVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === 'visible')
  const desktop = useMediaQuery('(min-width: 1024px)')
  const playing = !reduced && inView && pageVisible && !dragging
  const activeIndex = wrap(position)
  const [mobileCard, setMobileCard] = useState(320)
  const pitch = desktop ? CARD_PITCH : mobileCard + MOBILE_GAP

  const rowRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: F.visibleThreshold,
    })
    io.observe(row)
    return () => io.disconnect()
  }, [])

  // Mobile pitch: the cards' rendered width (they narrow on small phones).
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(() => {
      const card = track.querySelector<HTMLElement>('[data-feature-card]')
      if (card) setMobileCard(card.offsetWidth)
    })
    ro.observe(track)
    return () => ro.disconnect()
  }, [])

  const next = useCallback(() => setPosition((p) => p + 1), [])
  const restartTimer = () => setTimerKey((k) => k + 1)

  /** Shortest way to a tab: forward one or two cards, or back one for the previous tab. */
  const goTo = (target: number) => {
    const ahead = wrap(target - activeIndex)
    if (ahead === 0) return
    setPosition((p) => p + (ahead === COUNT - 1 ? -1 : ahead))
  }
  const step = (by: number) => {
    setPosition((p) => p + by)
    restartTimer()
  }

  // Vertical tablist keys (WAI-ARIA tabs, automatic activation): arrows wrap, Home/End jump.
  const onTabKeyDown = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    let target: number | null = null
    if (e.key in steps) target = wrap(activeIndex + steps[e.key])
    else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = COUNT - 1
    if (target === null) return
    e.preventDefault()
    goTo(target)
    tabRefs.current[target]?.focus()
  }

  const slide = reduced ? undefined : `${F.slideMs}ms ${F.slideEase}`
  const slots = Array.from({ length: WINDOW * 2 + 1 }, (_, i) => position - WINDOW + i)
  const trackX = -position * pitch

  // --- Mobile swipe (SWIPE). The track follows the finger directly (no React render per move). ----
  const drag = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null; dx: number; samples: [number, number][] } | null>(null)
  const onPointerDown = (e: PointerEvent) => {
    if (desktop || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, dx: 0, samples: [[e.timeStamp, e.clientX]] }
  }
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.axis) {
      if (Math.abs(dx) < SWIPE.slop && Math.abs(dy) < SWIPE.slop) return
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (d.axis === 'y') {
        drag.current = null
        return
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    d.dx = dx
    d.samples = [...d.samples.filter(([t]) => e.timeStamp - t < 100), [e.timeStamp, e.clientX]]
    const track = trackRef.current!
    track.style.transition = 'none'
    track.style.transform = `translateX(${trackX + dx}px)`
  }
  const endDrag = (e: PointerEvent, cancelled = false) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    if (d.axis !== 'x') return
    const [[t0, x0]] = d.samples
    const velocity = e.timeStamp > t0 ? (e.clientX - x0) / (e.timeStamp - t0) : 0 // px per ms
    let by = Math.max(-WINDOW, Math.min(WINDOW, Math.round(-(d.dx + velocity * SWIPE.momentum) / pitch)))
    const flicked = Math.abs(velocity) > SWIPE.flick && Math.sign(velocity) === Math.sign(d.dx) && Math.abs(d.dx) >= SWIPE.minFlick
    if (by === 0 && (flicked || Math.abs(d.dx) > pitch * SWIPE.distance)) by = -Math.sign(d.dx)
    if (cancelled) by = 0
    // Snap from where the finger left it; React then renders the same values for the new position.
    const track = trackRef.current!
    track.style.transition = slide ? `transform ${slide}` : ''
    track.style.transform = `translateX(${-(position + by) * pitch}px)`
    setDragging(false)
    step(by)
  }

  /** The timer line: fills over the interval; reaching the end advances the carousel. */
  const progress = (selected: boolean) => (
    <span
      key={timerKey}
      data-tab-progress
      className="absolute inset-0 origin-left bg-forest"
      style={
        !selected
          ? { transform: 'scaleX(0)' }
          : reduced
            ? { transform: 'scaleX(1)' }
            : {
                animation: `feature-progress ${F.intervalMs}ms linear forwards`,
                animationPlayState: playing ? 'running' : 'paused',
              }
      }
      onAnimationEnd={selected ? next : undefined}
    />
  )

  return (
    <section
      id="ways-to-invest"
      aria-labelledby="ways-to-invest-title"
      // relative: paints over the pinned hero/section-2 stage as it scrolls up over it.
      className="relative overflow-x-clip bg-white pt-[130px] pb-[136px] max-lg:py-[100px]"
    >
      <div className="page-row max-lg:max-w-[560px] max-lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-8 max-lg:flex-col max-lg:gap-10">
          <h2
            id="ways-to-invest-title"
            className="w-[679px] max-w-full text-section-h2 text-strong max-lg:w-[321px] max-lg:text-center max-lg:text-section-h2-mobile max-lg:leading-[1.1]"
          >
            <span className="text-muted">More ways to invest.</span>
            <br />
            {/* Mobile breaks before "to grow." (Figma). */}
            <span>
              More possibilities <br className="lg:hidden" />
              to grow.
            </span>
          </h2>
          {/* Outline variant of the hero button. 17px + 1px border = Figma's 18px inset; 10px to the
              arrow (Figma), which makes the 180px width: 18 + 110 + 10 + 24 + 18. Mobile: 162 × 48,
              14px label, 20px arrow. */}
          <a
            href={SIGNUP_URL}
            className={`${buttonBase} h-13 gap-2.5 border border-black px-[17px] text-black hover:bg-black hover:text-white max-lg:h-12 max-lg:text-button-sm ${focusRing}`}
          >
            Start Investing
            <ArrowRightIcon className="shrink-0 max-lg:size-5" />
          </a>
        </div>

        <div
          ref={rowRef}
          data-feature-carousel
          data-playing={playing}
          className="mt-[100px] flex gap-[150px] max-lg:mt-20 max-lg:flex-col max-lg:gap-10"
        >
          {/* Tabs on top, previous / next pinned to the bottom of the column (Figma 11004:15611: the column
              runs the cards' full height, justify-between). Mobile: under the track, no tabs; the dashes,
              then the arrows 50px below. */}
          <div className="flex w-[299px] max-w-full shrink-0 flex-col justify-between gap-12 max-lg:order-last max-lg:w-full max-lg:items-center max-lg:gap-[50px]">
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Ways to invest"
              onKeyDown={onTabKeyDown}
              className="flex flex-col gap-5 max-lg:hidden"
            >
              {features.map((f, i) => {
                const selected = i === activeIndex
                return (
                  <button
                    key={f.tab}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`feature-tab-${i + 1}`}
                    aria-selected={selected}
                    aria-controls="feature-panel"
                    tabIndex={selected ? 0 : -1}
                    data-feature-tab={i + 1}
                    onClick={() => goTo(i)}
                    className={`group flex flex-col gap-5 text-left ${focusRing}`}
                  >
                    <span
                      className={`text-tab transition-colors duration-200 motion-reduce:transition-none ${
                        selected ? 'text-black' : 'font-normal text-tab-inactive group-hover:text-strong'
                      }`}
                    >
                      {f.tab}
                    </span>
                    <span className="relative block h-px w-full bg-black/8">{progress(selected)}</span>
                  </button>
                )
              })}
            </div>

            {/* Mobile progress dashes (Figma 11004:16291): 33.25 wide, 10 apart, 8% black; the active one
                fills forest with the timer. Decorative: the arrows and the card's own text carry it. */}
            <div aria-hidden="true" data-feature-dashes className="flex gap-2.5 lg:hidden">
              {features.map((f, i) => (
                <span key={f.tab} className="relative block h-px w-[33.25px] bg-black/8">
                  {progress(i === activeIndex)}
                </span>
              ))}
            </div>

            {/* Figma 11004:15652: 52px squares, 1px #111 border, 10px apart; mobile (11004:16189) 40px with
                18.5px arrows. The carousel loops, so both always work: previous from the first card goes
                to the last. */}
            <div className="flex gap-2.5">
              {(
                [
                  ['left', 'Previous card', -1],
                  ['right', 'Next card', 1],
                ] as const
              ).map(([direction, label, by]) => (
                <button
                  key={direction}
                  type="button"
                  aria-label={label}
                  aria-controls="feature-panel"
                  data-feature-nav={direction}
                  onClick={() => step(by)}
                  className={`flex size-13 items-center justify-center border border-strong text-strong transition-colors duration-150 hover:bg-strong hover:text-white motion-reduce:transition-none max-lg:size-10 ${focusRing}`}
                >
                  <ArrowIcon direction={direction} className="max-lg:size-[18.5px]" />
                </button>
              ))}
            </div>
          </div>

          {/* Viewport: starts at x 529, clips at its left edge and bleeds past the 1280 row to the
              viewport's right edge (negative margin = the gutter beyond the row). Auto-advance
              isn't announced; tab-driven changes are. Mobile: bleeds into the right padding so the
              peek reaches the screen edge; swipeable (vertical drags stay a page scroll). */}
          <div
            data-feature-viewport
            aria-live={playing ? 'off' : 'polite'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endDrag(e)}
            onPointerCancel={(e) => endDrag(e, true)}
            className="min-w-0 flex-1 overflow-x-clip lg:mr-[calc((100%-100vw)/2)] max-lg:-mr-6 max-lg:touch-pan-y max-lg:select-none"
          >
            {/* All cards share one grid cell (so the track keeps the cards' height) and sit at
                position × pitch; the track slides by the active position. */}
            <div
              ref={trackRef}
              data-feature-track
              className="grid"
              style={{
                transform: `translateX(${trackX}px)`,
                transition: slide && `transform ${slide}`,
              }}
            >
              {slots.map((slot) => {
                const index = wrap(slot)
                const { title, body, Visual } = features[index]
                const active = slot === position
                return (
                  <div
                    key={slot}
                    {...(active
                      ? {
                          role: 'tabpanel',
                          id: 'feature-panel',
                          'aria-labelledby': `feature-tab-${index + 1}`,
                        }
                      : { 'aria-hidden': true, inert: true })}
                    data-feature-card={index + 1}
                    data-state={active ? 'active' : 'inactive'}
                    // Figma blur 30 = CSS 15px, on the whole card (visual + text); mobile Figma 20 = 10px.
                    className={`col-start-1 row-start-1 w-[537px] max-w-full ${mobileCardWidth} max-lg:max-w-none ${active ? 'blur-none' : 'blur-[15px] max-lg:blur-[10px]'}`}
                    style={{ transform: `translateX(${slot * pitch}px)`, transition: slide && `filter ${slide}` }}
                  >
                    <Visual active={active} playing={playing} />
                    <div className="mt-10 max-lg:mt-6">
                      <h3 className="text-feature-subtitle text-black max-lg:text-feature-subtitle-mobile">{title}</h3>
                      <p className="mt-2 text-body text-secondary max-lg:text-feature-body-mobile">{body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
