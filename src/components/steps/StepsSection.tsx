import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState, type ComponentType } from 'react'
import images from '../../generated/images.json'
import { BuyUnitsGraphic, DashboardGraphic, FundWalletGraphic, ListingsGraphic, SignUpGraphic } from './StepGraphics.tsx'
import './steps.css'
import { REDUCED_MEDIA, STEPS_COUNT, STEPS_MEDIA, stepsTiming as T } from './stepsTiming.ts'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Step = { title: string; body: string; Graphic: ComponentType }

const steps: Step[] = [
  { title: 'Sign Up', body: 'Create an account on Fraqshares and get verified', Graphic: SignUpGraphic },
  { title: 'Fund Your Wallet', body: 'Add some money to your account', Graphic: FundWalletGraphic },
  {
    title: 'Browse Available Listings',
    body: 'Explore expert-curated listings of real estate assets and businesses',
    Graphic: ListingsGraphic,
  },
  {
    title: 'Buy Units',
    body: 'Purchase shares or units representing a portion of the Assets ownership.',
    Graphic: BuyUnitsGraphic,
  },
  {
    title: 'Monitor & Manage Portfolio',
    body: 'Use the Fraqshares dashboard to track your portfolio performance and receive updates',
    Graphic: DashboardGraphic,
  },
]

const glow = images['steps/glow']
const LAST = STEPS_COUNT - 1
/** Transition length, as a fraction of a step segment. */
const D = 1 - T.hold
/** Timeline length in step units: four segments, then the last step's hold. */
const TOTAL = LAST + T.hold
/** Indicator: active 54 tall, inactive 24, 8 apart. */
const SEG_ACTIVE = 54
const SEG_INACTIVE = 24
const SEG_GAP = 8
/** Tolerance in step units (~2px of scroll at 1070px tall). */
const EPS = 0.002

type Span = readonly [number, number]
/** Timeline position and duration of a span inside transition k. */
const at = (k: number, [a, b]: Span) => ({ position: k + T.hold + a * D, duration: (b - a) * D })

type RestState = 'active' | 'above' | 'below' | 'hiddenAbove' | 'hiddenBelow'
const restState = (i: number, current: number): RestState =>
  i === current ? 'active' : i === current - 1 ? 'above' : i === current + 1 ? 'below' : i < current ? 'hiddenAbove' : 'hiddenBelow'

/** Which step is current at timeline time t (switches at the transition's switchAt point). */
function stepAt(t: number) {
  let current = 0
  for (let k = 0; k < LAST; k++) if (t >= k + T.hold + T.switchAt * D) current = k + 1
  return current
}

/**
 * DEV ONLY — remove before launch. ?step=1…5 scrolls to that step at rest (the end of its hold, where
 * the snap lands) so each one can be checked against Figma. Compiled out of production builds.
 */
function devStep() {
  if (!import.meta.env.DEV) return null
  const n = Number(new URLSearchParams(window.location.search).get('step'))
  return n >= 1 && n <= STEPS_COUNT ? n - 1 : null
}

/**
 * Figma: Desktop - 14 (10805:25442) and Steps 2–5 (10982:213), each 1440 × 1070.
 *
 * Static by default (under 1024px, and before the script runs): the five steps stack as plain blocks,
 * each with its full frame. At 1024px and up, `data-staged` turns the section into a tall track with a
 * sticky 100vh stage, and one scrubbed timeline steps through it.
 *
 * The five step frames all sit in the active slot. The small olive squares above and below the
 * active frame are the neighbouring frames themselves, collapsed: scaled to the square (496 → 26,
 * uniform) and moved up or down the centre line, with a solid olive cover faded in over them. Each
 * transition collapses the current frame into the top slot while the next grows out of the bottom
 * one. Only transform and opacity animate.
 */
export function StepsSection() {
  const rootRef = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState(0)
  const [staged, setStaged] = useState(false)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add({ staged: STEPS_MEDIA, reduce: REDUCED_MEDIA }, (context) => {
        const { staged, reduce } = context.conditions as { staged: boolean; reduce: boolean }
        if (!staged) return

        const root = rootRef.current!
        const q = <E extends Element = HTMLElement>(selector: string) => [...root.querySelectorAll<E>(selector)] as E[]
        const one = (selector: string) => root.querySelector<HTMLElement>(selector)!
        const track = one('[data-steps-track]')
        const stage = one('[data-steps-stage]')
        const frames = q('[data-step-frame]')
        const covers = q('[data-step-cover]')
        const contents = q('[data-step-content]')
        const copies = q('[data-step-copy]')
        const fills = q('[data-indicator-progress]')
        const slot = { top: one('[data-steps-slot=top]'), active: one('[data-steps-slot=active]'), bottom: one('[data-steps-slot=bottom]') }

        root.dataset.staged = ''
        track.style.height = `${100 + TOTAL * T.segmentVh}vh`
        setStaged(true)

        // Fit the 1440 × 810 canvas into the viewport (never upscale).
        const applyScale = () => {
          const vw = document.documentElement.clientWidth
          stage.style.setProperty('--steps-scale', String(Math.min(1, vw / T.designWidth, window.innerHeight / T.fitHeight)))
        }
        applyScale()
        ScrollTrigger.addEventListener('refreshInit', applyScale)

        // Collapse geometry from the rendered slots, in the canvas's own (unscaled) px. Re-read on every
        // refresh through the function-based tween values below.
        const geometry = () => {
          const a = slot.active.getBoundingClientRect()
          const t = slot.top.getBoundingClientRect()
          const b = slot.bottom.getBoundingClientRect()
          const k = a.width / slot.active.offsetWidth // canvas scale
          const centre = (r: DOMRect) => r.top + r.height / 2
          return { scale: t.width / a.width, up: (centre(t) - centre(a)) / k, down: (centre(b) - centre(a)) / k }
        }
        const collapsed = () => geometry().scale
        const frameVars = (s: RestState): gsap.TweenVars => ({
          scale: s === 'active' ? 1 : collapsed,
          y: s === 'active' ? 0 : s === 'above' || s === 'hiddenAbove' ? () => geometry().up : () => geometry().down,
          opacity: s === 'hiddenAbove' || s === 'hiddenBelow' ? 0 : 1,
        })
        const coverVars = (s: RestState) => ({ opacity: s === 'active' ? 0 : 1 })
        const contentVars = (s: RestState) => ({ opacity: s === 'active' ? 1 : 0 })

        gsap.set(frames, { transformOrigin: '50% 50%' })
        gsap.set(fills, { scaleY: 0, transformOrigin: '50% 0%' })

        let shown = -1
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
                  snapTo: (value, self) => {
                    // Rest positions are the ends of the holds; anywhere inside a hold already is rest.
                    // (EPS: scroll positions are whole px, so a hold end can land a hair past it.)
                    const t = value * TOTAL
                    const k = Math.floor(t)
                    if (k >= LAST || t - k <= T.hold + EPS) return value
                    const target = (self?.direction ?? 1) > 0 ? (k + 1 >= LAST ? TOTAL : k + 1 + T.hold) : k + T.hold
                    return target / TOTAL
                  },
                  // No inertia: snap from where the scroll actually stopped, one step at a time, instead
                  // of a velocity projection that can fling past several steps.
                  inertia: false,
                  duration: T.snapDuration,
                  delay: T.snapDelay,
                  ease: 'power1.inOut',
                }
              : undefined,
            // Promote the frames only while the section is on screen.
            onToggle: (self) => frames.forEach((f) => (f.style.willChange = self.isActive ? 'transform, opacity' : '')),
          },
          onUpdate() {
            const t = this.time()
            const step = stepAt(t)
            const length = step < LAST ? 1 : T.hold
            fills[step].style.transform = `scaleY(${gsap.utils.clamp(0, 1, (t - step) / length)})`
            if (step !== shown) {
              shown = step
              setCurrent(step)
            }
          },
        })

        // Rest state of step 1 at time 0, applied now (the stage is on screen before its trigger starts).
        const now = { immediateRender: true }
        frames.forEach((frame, i) => {
          const s = restState(i, 0)
          tl.set(frame, { ...frameVars(s), ...now }, 0)
          tl.set(covers[i], { ...coverVars(s), ...now }, 0)
          tl.set(contents[i], { ...contentVars(s), ...now }, 0)
          tl.set(copies[i], { opacity: i === 0 ? 1 : 0, y: 0, ...now }, 0)
        })

        for (let k = 0; k < LAST; k++) {
          const out = k
          const into = k + 1

          if (reduce) {
            // No shrink/grow or crossfade: jump to the next rest state at the switch point.
            const p = at(k, [T.switchAt, T.switchAt]).position
            frames.forEach((frame, i) => {
              const s = restState(i, into)
              tl.set(frame, frameVars(s), p)
              tl.set(covers[i], coverVars(s), p)
              tl.set(contents[i], contentVars(s), p)
              tl.set(copies[i], { opacity: i === into ? 1 : 0 }, p)
            })
            continue
          }

          const move = at(k, [0, 1])
          const cover = at(k, T.coverSpan)
          // Current frame: active → collapsed in the top slot.
          tl.fromTo(frames[out], frameVars('active'), { ...frameVars('above'), duration: move.duration, ease: T.ease }, move.position)
          tl.fromTo(covers[out], { opacity: 0 }, { opacity: 1, duration: cover.duration, ease: T.ease }, cover.position)
          const cOut = at(k, T.contentOutSpan)
          tl.fromTo(contents[out], { opacity: 1 }, { opacity: 0, duration: cOut.duration }, cOut.position)
          // Next frame: collapsed in the bottom slot → active.
          tl.fromTo(frames[into], frameVars('below'), { ...frameVars('active'), duration: move.duration, ease: T.ease }, move.position)
          tl.fromTo(covers[into], { opacity: 1 }, { opacity: 0, duration: cover.duration, ease: T.ease }, cover.position)
          const cIn = at(k, T.contentInSpan)
          tl.fromTo(contents[into], { opacity: 0 }, { opacity: 1, duration: cIn.duration }, cIn.position)
          // The old top square leaves; the step after next appears in the bottom slot.
          if (out > 0) {
            const s = at(k, T.topSquareOutSpan)
            tl.fromTo(frames[out - 1], { opacity: 1 }, { opacity: 0, duration: s.duration }, s.position)
          }
          if (into < LAST) {
            const s = at(k, T.bottomSquareInSpan)
            tl.fromTo(frames[into + 1], { opacity: 0 }, { opacity: 1, duration: s.duration }, s.position)
          }
          // Text: out with a small upward drift, then in from below. Never overlapping.
          const tOut = at(k, T.textOutSpan)
          tl.fromTo(copies[out], { opacity: 1, y: 0 }, { opacity: 0, y: -T.textDriftY, duration: tOut.duration, ease: 'power1.in' }, tOut.position)
          const tIn = at(k, T.textInSpan)
          tl.fromTo(copies[into], { opacity: 0, y: T.textDriftY }, { opacity: 1, y: 0, duration: tIn.duration, ease: 'power1.out' }, tIn.position)
        }

        // The last step's hold.
        tl.set({}, {}, TOTAL)

        const jump = devStep()
        const onDevRefresh = () => {
          const st = tl.scrollTrigger!
          // Just inside the hold's end, so neither the snap nor the release past the end moves it.
          const t = jump! + T.hold - EPS
          window.scrollTo(0, Math.round(st.start + (st.end - st.start) * (t / TOTAL)))
        }
        let stopDev = () => {}
        if (jump !== null) {
          // Re-apply after each refresh (image loads, the hero stage's pin) until the user scrolls.
          ScrollTrigger.addEventListener('refresh', onDevRefresh)
          const stop = () => ScrollTrigger.removeEventListener('refresh', onDevRefresh)
          window.addEventListener('wheel', stop, { once: true })
          window.addEventListener('keydown', stop, { once: true })
          stopDev = stop
          ScrollTrigger.refresh()
        }

        // Runs after GSAP's own revert; clear everything it may leave behind (as in HeroWealthStage).
        return () => {
          stopDev()
          ScrollTrigger.removeEventListener('refreshInit', applyScale)
          delete root.dataset.staged
          track.style.height = ''
          stage.style.removeProperty('--steps-scale')
          gsap.set([...frames, ...fills, ...copies], { clearProps: 'transform,transformOrigin,translate,rotate,scale,opacity,willChange' })
          gsap.set([...covers, ...contents], { clearProps: 'opacity' })
          setStaged(false)
          setCurrent(0)
        }
      })
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} id="getting-started" aria-labelledby="steps-title" data-steps className="relative bg-dark text-white">
      <div data-steps-track>
        <div data-steps-stage>
          {/* Centre line: 1px, full stage height, olive fading out at both ends (behind the frames). */}
          <div
            aria-hidden="true"
            data-steps-line
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-olive/0 via-olive to-olive/0"
          />

          <div data-steps-canvas className="page-row relative py-[130px]">
            <h2 id="steps-title" data-steps-title className="mb-16 w-[308px] max-w-full text-section-h2">
              Getting started in <span className="text-olive">5 easy steps</span>
            </h2>

            {(['top', 'active', 'bottom'] as const).map((name) => (
              <div key={name} aria-hidden="true" data-steps-slot={name} className="hidden" />
            ))}

            <ol className="flex flex-col gap-24">
              {steps.map(({ title, body, Graphic }, i) => (
                <li
                  key={title}
                  data-step={i + 1}
                  aria-current={staged && i === current ? 'step' : undefined}
                  className="flex flex-wrap items-center gap-x-[92px] gap-y-8"
                >
                  {/* The frame. Figma: #0E1711, 1px olive stroke (drawn over the screens, as Figma
                      strokes are), glow 496 × 230 at the bottom behind the screens, clipped. */}
                  <div
                    aria-hidden="true"
                    data-step-frame={i + 1}
                    className="relative h-[588px] w-[496px] max-w-full shrink-0 overflow-hidden bg-dark"
                  >
                    <img
                      data-step-glow
                      src={glow.src}
                      srcSet={glow.srcset}
                      sizes="496px"
                      width={glow.width}
                      height={glow.height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute bottom-0 left-0 h-[230px] w-[496px] max-w-none"
                    />
                    <div data-step-content className="absolute inset-0">
                      <Graphic />
                    </div>
                    <div data-step-border className="pointer-events-none absolute inset-0 border border-olive" />
                    {/* Collapsed, the frame reads as a solid olive square. */}
                    <div data-step-cover className="absolute inset-0 bg-olive opacity-0" />
                  </div>

                  <div data-step-text className="w-[222px] max-w-full">
                    <div data-step-copy>
                      <h3 className="text-step-title text-white">{title}</h3>
                      <p className="mt-2 text-step-description text-step-body">{body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div aria-hidden="true" data-steps-indicator className="hidden h-[182px] w-0.5">
              {steps.map(({ title }, i) => {
                const active = i === current
                const top = i * (SEG_INACTIVE + SEG_GAP) + (i > current ? SEG_ACTIVE - SEG_INACTIVE : 0)
                const ms = { transitionDuration: `${T.indicatorMs}ms` }
                return (
                  <span
                    key={title}
                    data-indicator-segment={i + 1}
                    data-state={active ? 'active' : 'inactive'}
                    className="absolute top-0 left-0 h-[54px] w-full origin-top transition-transform ease-out motion-reduce:transition-none"
                    style={{ ...ms, transform: `translateY(${top}px) scaleY(${active ? 1 : SEG_INACTIVE / SEG_ACTIVE})` }}
                  >
                    <span
                      className="absolute inset-0 bg-indicator-inactive transition-opacity motion-reduce:transition-none"
                      style={{ ...ms, opacity: active ? 0 : 1 }}
                    />
                    <span className="absolute inset-0 bg-white transition-opacity motion-reduce:transition-none" style={{ ...ms, opacity: active ? 1 : 0 }} />
                    {/* Progress through the current step; scaleY written by the timeline. */}
                    <span data-indicator-progress className="absolute inset-0 bg-indicator-progress" style={{ opacity: active ? 1 : 0 }} />
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
