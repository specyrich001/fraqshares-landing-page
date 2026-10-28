import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import images from '../../generated/images.json'
import { ScaledArtboard } from '../ScaledArtboard.tsx'
import { SignUpGraphic } from './SignUpGraphic.tsx'
import { ListingsGraphic } from './ListingsGraphic.tsx'
import { DashboardGraphic } from './DashboardGraphic.tsx'
import { BuyUnitsGraphic, FundWalletGraphic } from './StepGraphics.tsx'
import type { StepGraphicProps } from './stepControllers.ts'
import './steps.css'
import { MOBILE_MEDIA, REDUCED_MEDIA, STEPS_COUNT, STEPS_MEDIA, stepsMobile as M, stepsTiming as T } from './stepsTiming.ts'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** `wide`: Figma's text frame is 245 wide with an auto-width, one-line title (step 1); the others are 222. */
type Step = { title: string; body: string; Graphic: ComponentType<StepGraphicProps>; wide?: boolean }

const steps: Step[] = [
  { title: 'Sign Up & Get Verified', body: 'Create an account on Fraqshares and get verified in minutes', Graphic: SignUpGraphic, wide: true },
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
/** Indicator: active 54 tall, inactive 24, 8 apart (mobile: the same, across). */
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

type Phase = 'rest' | 'leaving' | 'gone'
/**
 * Where step i is at timeline time t, for its graphic's micro-animation: at rest (its hold), leaving
 * (shrinking into the top square), or gone (collapsed, or not grown out of the bottom square yet).
 */
const phaseAt = (i: number, t: number): Phase =>
  t >= i - EPS && t <= i + T.hold + EPS ? 'rest' : t > i + T.hold && t < i + 1 - EPS ? 'leaving' : 'gone'
const restPhases = () => steps.map((_, i) => phaseAt(i, 0))
/** Share of the stage on screen for a graphic at rest to play. */
const STAGE_VISIBLE = 0.5

/**
 * DEV ONLY — remove before launch. ?step=1…5 scrolls to that step at rest (the end of its hold, where
 * the snap lands), so each one can be checked against Figma and step 1's sequence plays. Compiled out
 * of production builds.
 */
function devStep() {
  if (!import.meta.env.DEV) return null
  const n = Number(new URLSearchParams(window.location.search).get('step'))
  return n >= 1 && n <= STEPS_COUNT ? n - 1 : null
}

/** Snap the scroll to the end of each hold (T.snap), shared by the desktop and mobile sequences. */
function snapConfig(): ScrollTrigger.SnapVars | undefined {
  if (!T.snap) return undefined
  return {
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
}

/** DEV ?step=N: scroll to that step at rest (devStep). Returns the cleanup. */
function devJump(tl: gsap.core.Timeline) {
  const jump = devStep()
  if (jump === null) return () => {}
  const onDevRefresh = () => {
    const st = tl.scrollTrigger!
    // Just inside the hold's end, so neither the snap nor the release past the end moves it.
    const t = jump + T.hold - EPS
    window.scrollTo(0, Math.round(st.start + (st.end - st.start) * (t / TOTAL)))
  }
  // Re-apply after each refresh (image loads, the hero stage's pin) until the user scrolls.
  ScrollTrigger.addEventListener('refresh', onDevRefresh)
  const stop = () => ScrollTrigger.removeEventListener('refresh', onDevRefresh)
  window.addEventListener('wheel', stop, { once: true })
  window.addEventListener('keydown', stop, { once: true })
  window.addEventListener('touchstart', stop, { once: true })
  ScrollTrigger.refresh()
  return stop
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
 *
 * Step graphics with a micro-animation follow `active` / `playing`: they play at rest while the stage
 * is on screen and the tab is visible, freeze as their frame shrinks away, and reset once it has
 * collapsed (or before it grows back).
 *
 * Mobile, below 1024px (Figma 11004:16302): Figma's column exactly — 100px above, the H2, 50px, the
 * frame as a scaled artboard (496 × 588 → 329 wide), 50px, the text (281 wide), the horizontal
 * indicator 32px under it, 100px below. Each step carries its own indicator under its own text, so the 32px holds
 * whatever the text's length. Static, the five steps stack in that column. With JS
 * (`data-staged-mobile`) it's the same pinned track, segments and snapping as desktop, but no squares:
 * all five frames sit in one place and steps switch with a timed crossfade (stepsMobile) when the
 * scroll crosses a transition's switch point; the text (and its indicator) crossfades with the scroll
 * as on desktop. The column is taller than most phone screens, so it pins with its bottom on the
 * screen's bottom: the heading scrolls past, the frame, text and indicator stay in view.
 */
export function StepsSection() {
  const rootRef = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState(0)
  const [staged, setStaged] = useState(false)
  const [phases, setPhases] = useState<Phase[]>(restPhases)
  const [stageInView, setStageInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState === 'visible')

  /**
   * Mobile pinned sequence: the shared scroll track, snapping and phases; steps switch with a timed
   * crossfade of the graphics (the frames stay put) and the text fades with the scroll.
   */
  function stageMobile(reduce: boolean) {
    const root = rootRef.current!
    const q = <E extends Element = HTMLElement>(selector: string) => [...root.querySelectorAll<E>(selector)] as E[]
    const one = (selector: string) => root.querySelector<HTMLElement>(selector)!
    const track = one('[data-steps-track]')
    const stage = one('[data-steps-stage]')
    const items = q('[data-step]')
    const frames = q('[data-step-frame]')
    const contents = q('[data-step-content]')
    const copies = q('[data-step-copy]')
    const fills = q('[data-indicator-progress-mobile]')

    root.dataset.stagedMobile = ''
    setStaged(true)

    // The stage is Figma's column at full size (its 100px paddings included), usually taller than the
    // screen. It sticks with its middle on the screen's middle, the paddings past the edges, unless
    // that would put the lowest indicator under the bottom edge: then lower, so the frame, text and
    // indicator stay in view and the heading goes first. A negative sticky top does it; the track grows
    // by the same offset so the pinned scroll stays T.segmentVh per step. Re-measured on every refresh.
    let overhang = 0
    const place = () => {
      const extra = Math.max(0, stage.offsetHeight - window.innerHeight)
      const stageTop = stage.getBoundingClientRect().top
      const lowest = Math.max(...q('[data-steps-indicator-mobile]').map((el) => el.getBoundingClientRect().bottom - stageTop))
      overhang = Math.min(extra, Math.max(extra / 2, lowest + M.edge - window.innerHeight))
      stage.style.top = `${-overhang}px`
      track.style.height = `calc(${stage.offsetHeight}px + ${TOTAL * T.segmentVh}svh)`
    }
    place()
    ScrollTrigger.addEventListener('refreshInit', place)
    // The stage's height settles after first layout (the scaled artboards apply their scale, fonts
    // load): re-place and re-measure the trigger whenever it changes.
    let lastHeight = stage.offsetHeight
    const ro = new ResizeObserver(() => {
      if (stage.offsetHeight === lastHeight) return
      lastHeight = stage.offsetHeight
      ScrollTrigger.refresh()
    })
    ro.observe(stage)

    gsap.set(fills, { scaleX: 0, transformOrigin: '0% 50%' })
    gsap.set(frames, { opacity: (i: number) => (i === 0 ? 1 : 0) })
    gsap.set(items, { zIndex: (i: number) => (i === 0 ? 1 : 0) })

    // The crossfade between two steps: the outgoing frame on top fades out while its graphic shrinks
    // a little; the incoming one, underneath and fully shown, brings its graphic in from slightly
    // larger. Identical frame shells, so only the graphics appear to change.
    let fade: gsap.core.Timeline | undefined
    const crossfade = (from: number, to: number) => {
      fade?.progress(1).kill()
      const C = M.crossfade
      frames.forEach((frame, i) => i !== from && i !== to && gsap.set(frame, { opacity: 0 }))
      items.forEach((item, i) => gsap.set(item, { zIndex: i === from ? 2 : i === to ? 1 : 0 }))
      gsap.set(frames[to], { opacity: 1 })
      fade = gsap
        .timeline({ defaults: { duration: reduce ? 0 : C.duration, ease: C.ease } })
        .to(frames[from], { opacity: 0 }, 0)
        .fromTo(contents[from], { scale: 1 }, { scale: C.outScale }, 0)
        .fromTo(contents[to], { opacity: 0, scale: C.inScale }, { opacity: 1, scale: 1 }, 0)
        .set(contents[from], { scale: 1 })
    }

    let shown = 0
    let shownPhases = restPhases().join()
    const tl = gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: {
        trigger: track,
        // Exactly while the stage sticks: from its offset until the track runs out under it.
        start: () => `top+=${overhang} top`,
        end: () => `+=${track.offsetHeight - stage.offsetHeight}`,
        scrub: T.scrub,
        invalidateOnRefresh: true,
        snap: snapConfig(),
      },
      onUpdate() {
        const t = this.time()
        const step = stepAt(t)
        // Every step's own indicator shows its own progress (only the showing one is seen).
        fills.forEach((fill, i) => (fill.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (t - i) / (i < LAST ? 1 : T.hold))})`))
        if (step !== shown) {
          crossfade(shown, step)
          shown = step
          setCurrent(step)
        }
        const next = steps.map((_, i) => phaseAt(i, t))
        if (next.join() !== shownPhases) {
          shownPhases = next.join()
          setPhases(next)
        }
      },
    })
    // Text: out with a small upward drift, then in from below, scrubbed (as desktop); instant with reduced motion.
    copies.forEach((copy, i) => tl.set(copy, { opacity: i === 0 ? 1 : 0, y: 0, immediateRender: true }, 0))
    for (let k = 0; k < LAST; k++) {
      if (reduce) {
        const p = at(k, [T.switchAt, T.switchAt]).position
        copies.forEach((copy, i) => tl.set(copy, { opacity: i === k + 1 ? 1 : 0 }, p))
        continue
      }
      const tOut = at(k, T.textOutSpan)
      tl.fromTo(copies[k], { opacity: 1, y: 0 }, { opacity: 0, y: -T.textDriftY, duration: tOut.duration, ease: 'power1.in' }, tOut.position)
      const tIn = at(k, T.textInSpan)
      tl.fromTo(copies[k + 1], { opacity: 0, y: T.textDriftY }, { opacity: 1, y: 0, duration: tIn.duration, ease: 'power1.out' }, tIn.position)
    }
    tl.set({}, {}, TOTAL)
    const stopDev = devJump(tl)

    return () => {
      stopDev()
      fade?.kill()
      ScrollTrigger.removeEventListener('refreshInit', place)
      ro.disconnect()
      delete root.dataset.stagedMobile
      track.style.height = ''
      stage.style.top = ''
      gsap.set([...fills, ...copies, ...contents], { clearProps: 'transform,transformOrigin,translate,rotate,scale,opacity' })
      gsap.set([...frames, ...items], { clearProps: 'opacity,zIndex' })
      setStaged(false)
      setCurrent(0)
      setPhases(restPhases())
    }
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add({ staged: STEPS_MEDIA, mobile: MOBILE_MEDIA, reduce: REDUCED_MEDIA }, (context) => {
        const { staged, mobile, reduce } = context.conditions as { staged: boolean; mobile: boolean; reduce: boolean }
        if (mobile) return stageMobile(reduce)
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
        let shownPhases = restPhases().join()
        const tl = gsap.timeline({
          defaults: { ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: track,
            start: 'top top',
            end: 'bottom bottom',
            scrub: T.scrub,
            invalidateOnRefresh: true,
            snap: snapConfig(),
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
            const next = steps.map((_, i) => phaseAt(i, t))
            if (next.join() !== shownPhases) {
              shownPhases = next.join()
              setPhases(next)
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

        const stopDev = devJump(tl)

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
          setPhases(restPhases())
        }
      })
    },
    { scope: rootRef },
  )

  // Graphics play only while the stage is on screen and the tab is visible.
  useEffect(() => {
    if (!staged) return
    const stage = rootRef.current?.querySelector('[data-steps-stage]')
    if (!stage) return
    const io = new IntersectionObserver(([entry]) => setStageInView(entry.isIntersecting), { threshold: STAGE_VISIBLE })
    io.observe(stage)
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [staged])

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

          <div
            data-steps-canvas
            className="page-row relative py-[130px] max-lg:flex max-lg:max-w-[560px] max-lg:flex-col max-lg:items-center max-lg:px-8 max-lg:py-[100px]"
          >
            <h2
              id="steps-title"
              data-steps-title
              className="mb-16 w-[308px] max-w-full text-section-h2 max-lg:mb-[50px] max-lg:w-[280px] max-lg:text-center max-lg:text-section-h2-mobile max-lg:leading-[1.1]"
            >
              Getting started in <span className="text-olive">5 easy steps</span>
            </h2>

            {(['top', 'active', 'bottom'] as const).map((name) => (
              <div key={name} aria-hidden="true" data-steps-slot={name} className="hidden" />
            ))}

            <ol data-steps-list className="flex flex-col gap-24 max-lg:w-full max-lg:gap-20">
              {steps.map(({ title, body, Graphic, wide }, i) => (
                <li
                  key={title}
                  data-step={i + 1}
                  aria-current={staged && i === current ? 'step' : undefined}
                  className="flex flex-wrap items-center gap-x-[92px] gap-y-8 max-lg:flex-col max-lg:flex-nowrap max-lg:gap-[50px]"
                >
                  {/* The frame. Figma: #0E1711, 1px olive stroke (drawn over the screens, as Figma
                      strokes are), glow 496 × 230 at the bottom behind the screens, clipped. */}
                  <ScaledArtboard width={496} height={588} className="shrink-0">
                    <div
                      aria-hidden="true"
                      data-step-frame={i + 1}
                      className="relative h-[588px] w-[496px] max-w-full shrink-0 overflow-hidden bg-dark max-lg:max-w-none"
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
                        <Graphic
                          {...(staged && {
                            active: phases[i] !== 'gone',
                            playing: phases[i] === 'rest' && stageInView && tabVisible,
                          })}
                        />
                      </div>
                      <div data-step-border className="pointer-events-none absolute inset-0 border border-olive" />
                      {/* Collapsed, the frame reads as a solid olive square. */}
                      <div data-step-cover className="absolute inset-0 bg-olive opacity-0" />
                    </div>
                  </ScaledArtboard>

                  <div data-step-text className={`${wide ? 'w-[245px]' : 'w-[222px]'} max-w-full max-lg:w-[281px] max-lg:text-center`}>
                    <div data-step-copy>
                      <h3 className={`text-step-title text-white max-lg:text-step-title-mobile ${wide ? 'whitespace-nowrap' : ''}`}>{title}</h3>
                      <p className="mt-2 max-w-[222px] text-step-description text-step-body max-lg:max-w-none max-lg:text-step-description-mobile">{body}</p>
                      <StepIndicator active={i} />
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

/**
 * Mobile indicator (Figma 11004:16315), one per step under its text: the desktop indicator across,
 * 2px tall, 32px below the text, with step `active` lit; the timeline writes its progress fill (left to
 * right). Desktop uses the vertical one beside the frames.
 */
function StepIndicator({ active }: { active: number }) {
  return (
    <span aria-hidden="true" data-steps-indicator-mobile className="relative mx-auto mt-8 block h-0.5 w-[182px] lg:hidden">
      {steps.map(({ title }, i) => {
        const on = i === active
        const left = i * (SEG_INACTIVE + SEG_GAP) + (i > active ? SEG_ACTIVE - SEG_INACTIVE : 0)
        return (
          <span
            key={title}
            className={`absolute top-0 left-0 h-full origin-left ${on ? 'w-[54px] bg-white' : 'w-6 bg-indicator-inactive'}`}
            style={{ transform: `translateX(${left}px)` }}
          >
            {on && <span data-indicator-progress-mobile className="absolute inset-0 origin-left scale-x-0 bg-indicator-progress" />}
          </span>
        )
      })}
    </span>
  )
}
