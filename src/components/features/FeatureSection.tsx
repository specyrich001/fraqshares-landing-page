import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type KeyboardEvent,
} from 'react'
import { ArrowIcon } from '../icons/ArrowIcon.tsx'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { buttonBase, focusRing } from '../linkStyles.ts'
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
/** Card width + gap: one step of the track. */
const CARD_PITCH = 537 + 32
/** Cards rendered on each side of the active one: covers the peek and a two-card tab jump. */
const WINDOW = 3
/** Wraps any (possibly negative) track position onto a feature index. */
const wrap = (v: number) => ((v % COUNT) + COUNT) % COUNT

/**
 * DEV ONLY — remove before launch. ?card=2…4 starts the carousel on that card so each one can be
 * checked against Figma. Compiled out of production builds.
 */
function devStartPosition() {
  if (!import.meta.env.DEV) return 0
  const n = Number(new URLSearchParams(window.location.search).get('card'))
  return n >= 1 && n <= COUNT ? n - 1 : 0
}

/**
 * DEV ONLY — remove before launch. ?hold=1 stops auto-advance after the first window (the timer
 * line still fills once), so a card's own loop can be watched. Compiled out of production builds.
 */
const devHold = import.meta.env.DEV && new URLSearchParams(window.location.search).has('hold')

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
 */
export function FeatureSection() {
  const [position, setPosition] = useState(devStartPosition)
  const [inView, setInView] = useState(false)
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches)
  const pageVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === 'visible')
  const playing = !reduced && inView && pageVisible
  const activeIndex = wrap(position)

  const rowRef = useRef<HTMLDivElement>(null)
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

  const next = useCallback(() => {
    if (!devHold) setPosition((p) => p + 1)
  }, [])

  /** Shortest way to a tab: forward one or two cards, or back one for the previous tab. */
  const goTo = (target: number) => {
    const ahead = wrap(target - activeIndex)
    if (ahead === 0) return
    setPosition((p) => p + (ahead === COUNT - 1 ? -1 : ahead))
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

  return (
    <section
      id="ways-to-invest"
      aria-labelledby="ways-to-invest-title"
      // relative: paints over the pinned hero/section-2 stage as it scrolls up over it.
      className="relative overflow-x-clip bg-white pt-[130px] pb-[136px]"
    >
      <div className="page-row">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <h2 id="ways-to-invest-title" className="w-[679px] max-w-full text-section-h2 text-strong">
            <span className="text-muted">More ways to invest.</span>
            <br />
            <span>More possibilities to grow.</span>
          </h2>
          {/* Outline variant of the hero button. 17px + 1px border = Figma's 18px inset; 10px to the
              arrow (Figma), which makes the 180px width: 18 + 110 + 10 + 24 + 18. */}
          <a
            href="#get-started"
            className={`${buttonBase} h-13 gap-2.5 border border-black px-[17px] text-black hover:bg-black hover:text-white ${focusRing}`}
          >
            Start Investing
            <ArrowRightIcon className="shrink-0" />
          </a>
        </div>

        <div
          ref={rowRef}
          data-feature-carousel
          data-playing={playing}
          className="mt-[100px] flex gap-[150px] max-lg:flex-col max-lg:gap-12"
        >
          {/* Tabs on top, previous / next pinned to the bottom of the column (Figma 11004:15611: the column
              runs the cards' full height, justify-between). */}
          <div className="flex w-[299px] max-w-full shrink-0 flex-col justify-between gap-12">
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Ways to invest"
              onKeyDown={onTabKeyDown}
              className="flex flex-col gap-5"
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
                    <span className="relative block h-px w-full bg-black/8">
                      {/* The timer: fills over the interval; reaching the end advances the carousel. */}
                      <span
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
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Figma 11004:15652: 52px squares, 1px #111 border, 10px apart. The carousel loops, so both
                always work: previous from the first card goes to the last. */}
            <div className="flex gap-2.5">
              {(
                [
                  ['left', 'Previous', () => goTo(wrap(activeIndex - 1))],
                  ['right', 'Next', () => goTo(wrap(activeIndex + 1))],
                ] as const
              ).map(([direction, label, onClick]) => (
                <button
                  key={direction}
                  type="button"
                  aria-label={`${label} way to invest`}
                  aria-controls="feature-panel"
                  data-feature-nav={direction}
                  onClick={onClick}
                  className={`flex size-13 items-center justify-center border border-strong text-strong transition-colors duration-150 hover:bg-strong hover:text-white motion-reduce:transition-none ${focusRing}`}
                >
                  <ArrowIcon direction={direction} />
                </button>
              ))}
            </div>
          </div>

          {/* Viewport: starts at x 529, clips at its left edge and bleeds past the 1280 row to the
              viewport's right edge (negative margin = the gutter beyond the row). Auto-advance
              isn't announced; tab-driven changes are. */}
          <div
            data-feature-viewport
            aria-live={playing ? 'off' : 'polite'}
            className="min-w-0 flex-1 overflow-x-clip lg:mr-[calc((100%-100vw)/2)]"
          >
            {/* All cards share one grid cell (so the track keeps the cards' height) and sit at
                position × pitch; the track slides by the active position. */}
            <div
              data-feature-track
              className="grid"
              style={{
                transform: `translateX(${-position * CARD_PITCH}px)`,
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
                    // Figma blur 30 = CSS 15px, on the whole card (visual + text).
                    className={`col-start-1 row-start-1 w-[537px] max-w-full ${active ? 'blur-none' : 'blur-[15px]'}`}
                    style={{ transform: `translateX(${slot * CARD_PITCH}px)`, transition: slide && `filter ${slide}` }}
                  >
                    <Visual active={active} playing={playing} />
                    <div className="mt-10">
                      <h3 className="text-feature-subtitle text-black">{title}</h3>
                      <p className="mt-2 text-body text-secondary">{body}</p>
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
