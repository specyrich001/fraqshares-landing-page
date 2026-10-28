import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import images from '../../generated/images.json'
import { StepCursor } from './StepCursor.tsx'
import { stepControllers, type StepController, type StepGraphicProps } from './stepControllers.ts'
import './signUp.css'

gsap.registerPlugin(useGSAP)

/**
 * Step 1 ("Sign Up & Get Verified") micro-animation: a cursor fills in the sign-up form, creates the
 * account, goes through KYC and ends on "Account Verified". Seconds, from play(); px are screen px
 * (the 496 × 588 step frame) unless marked native.
 */
const STEP1 = {
  /** Screen A appears. */
  intro: { fromScale: 0.96, duration: 0.5, ease: 'power3.out' },

  /** Cursor tip, where it waits before entering: past the frame's lower-right edge. */
  enterFrom: { x: 530, y: 640 },
  /** Each glide bows this many px sideways at its midpoint. */
  toEmail: { at: 0.6, duration: 0.7, ease: 'power2.inOut', curve: 36 },
  emailClick: 1.3,
  emailFill: 1.45,
  /** Cursor fades out; focus moves to the password field. */
  emailDone: 1.9,
  passwordFill: 2.0,
  /** Focus off; the cursor fades in by the password field and moves to Create Account. */
  passwordDone: 2.5,
  toCreate: { duration: 0.6, ease: 'power2.inOut', curve: 14 },
  createClick: 3.1,
  toCreated: 3.3,
  toContinue: { at: 4.6, duration: 0.5, ease: 'power2.inOut', curve: 10 },
  continueClick: 5.1,
  toKyc: 5.3,
  toVerify: { at: 6.3, duration: 0.5, ease: 'power2.inOut', curve: 8 },
  verifyClick: 6.8,
  toVerified: 7.4,
  cursorOut: 8.0,
  /** Hold on Account Verified, crossfade back to the empty form, replay from the cursor's entry. */
  loop: { enabled: true, hold: 2.5, crossfade: 0.6 },

  /** Where the cursor tip lands, as fractions of each target's box. Figma: states 2–4. */
  targets: {
    email: [0.82, 0.22],
    password: [0.78, 0.5],
    create: [0.84, 0.6],
    continue: [0.86, 0.73],
    verify: [0.81, 0.42],
  },
  cursorFade: 0.2,
  /** Cursor and button press together: the button dips and darkens slightly. */
  press: { cursorScale: 0.85, buttonScale: 0.97, darken: 0.08, duration: 0.15 },
  /** Field underline to forest while focused (a second line fading in over the grey one). */
  focus: { duration: 0.2 },
  /** Placeholder out, value in rising 3px. */
  fill: { duration: 0.3, ease: 'power2.out', fromY: 3 },
  /** Verify KYC: the label gives way to three pulsing dots until the next screen. */
  loading: { at: 0.05, labelOut: 0.1, pulse: 0.2, stagger: 0.1, fromOpacity: 0.25, fromScale: 0.7 },
  /** Screen to screen. Times from the morph's start. */
  morph: {
    contentOut: 0.2,
    clipAt: 0.05,
    clip: 0.5,
    clipEase: 'power3.inOut',
    popAt: 0.3,
    pop: 0.45,
    popEase: 'back.out(1.8)',
    riseAt: 0.4,
    rise: 0.35,
    riseY: 4,
    riseStagger: 0.06,
    buttonAt: 0.5,
    button: 0.3,
  },
  /** Show the password as dots instead of plain text (Figma shows it plain). */
  maskPassword: false,
  /** Outside the pinned sequence (under 1024px): play while this much of the frame is on screen. */
  visibleThreshold: 0.5,
}

/** The screen is built at its 683 × 982 source size (Figma exports it at 2x) and scaled into the 321 × 462 card. */
const SCALE = 462 / 982
/** Card heights 462 (form, KYC) and 328 (results): the white layer clips this much off top and bottom. */
const SHORT_INSET = (462 - 328) / 2
// Always tweened fromTo between these two: the computed value comes back shortened ("inset(67px 0px)"),
// and GSAP would pair the wrong numbers.
const TALL = 'inset(0px 0px 0px 0px)'
const SHORT = `inset(${SHORT_INSET}px 0px ${SHORT_INSET}px 0px)`
const MOTION = '(prefers-reduced-motion: no-preference)'

type Target = keyof typeof STEP1.targets

declare global {
  interface Window {
    /** DEV only: step 1's controller, for tuning and recordings in the console. */
    signUp?: StepController & { config: typeof STEP1 }
  }
}
type Point = { x: number; y: number }

/**
 * DEV ONLY, compiled out of production builds: ?overlay=1 lays the matching Figma screen image at 50%
 * over the rebuild; ?replay=1 adds a button that replays the sequence (next to the hero's).
 */
const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
const showOverlay = !!devParams?.has('overlay')
const showReplay = !!devParams?.has('replay')

/** Figma state images (11017:49788 / 49809 / 49830 / 49851 / 49872), reference only. */
const references = [
  { state: 1, image: images['steps/sign-up-reference/state-1'], short: false },
  { state: 2, image: images['steps/sign-up-reference/state-2'], short: false },
  { state: 3, image: images['steps/sign-up-reference/state-3'], short: true },
  { state: 4, image: images['steps/sign-up-reference/state-4'], short: false },
  { state: 5, image: images['steps/sign-up-reference/state-5'], short: true },
]

/*
 * 1. Sign Up — Figma states 11017:49782 (empty form) → 49803 (filled) → 49824 (Account Created) →
 * 49845 (KYC Verification) → 49866 (Account Verified). Figma has each screen as a flat image; this is
 * the same screen rebuilt as HTML: every px below marked native is in the 683 × 982 source, read from
 * the images. Decorative (the frame is aria-hidden): nothing in it is a real input or button, so
 * nothing can take focus.
 *
 * The card is 321 wide at x 88, vertically centred in the frame: 462 tall for the form and KYC, 328
 * for the two results. The height changes by clipping the white layer (clip-path), never by layout,
 * so nothing reflows mid-morph. The cursor moves in frame px, aimed at the targets' measured boxes.
 *
 * Starting state comes from signUp.css before the script runs (JS on, motion allowed): the card
 * hidden, the form empty. Without JS or with reduced motion it's the filled form, static, no cursor.
 */
export function SignUpGraphic({ active, playing }: StepGraphicProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controller = useRef<StepController | null>(null)
  const [replay, setReplay] = useState<(() => void) | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, (context) => {
        const root = rootRef.current!
        const one = (selector: string, scope: Element = root) => scope.querySelector<HTMLElement>(selector)!
        const all = (selector: string, scope: Element = root) => [...scope.querySelectorAll<HTMLElement>(selector)]
        const card = one('[data-signup-card]')
        const bg = one('[data-signup-bg]')
        const screen = { a: one('[data-signup-screen=a]'), b: one('[data-signup-screen=b]'), c: one('[data-signup-screen=c]'), d: one('[data-signup-screen=d]') }
        const field = (name: string) => {
          const el = one(`[data-signup-field=${name}]`)
          return { placeholder: one('[data-signup-placeholder]', el), value: one('[data-signup-value]', el), focus: one('[data-signup-focus]', el) }
        }
        const email = field('email')
        const password = field('password')
        const button = (name: string) => one(`[data-signup-button=${name}]`)
        const cursor = one('[data-signup-cursor]')
        const pointer = one('[data-cursor-pointer]', cursor)
        const M = STEP1.morph

        /** Frame px of a target's aim point, measured now (the stage and frame may be scaled). */
        const point = (name: Target): Point => {
          const r = one(`[data-signup-target=${name}]`).getBoundingClientRect()
          const o = root.getBoundingClientRect()
          const k = o.width / root.offsetWidth
          const [fx, fy] = STEP1.targets[name]
          return { x: (r.left - o.left + r.width * fx) / k, y: (r.top - o.top + r.height * fy) / k }
        }
        /** Which Figma state is showing (1–5): data-screen, read by the dev overlay and tests. */
        const setScreen = (n: number) => (root.dataset.screen = String(n))

        /** Idle: card hidden, empty form, other screens hidden, cursor out of sight. */
        const idle = context.add('idle', () => {
          gsap.set(card, { opacity: 0, scale: 1 })
          gsap.set(bg, { clipPath: TALL })
          gsap.set(screen.a, { opacity: 1 })
          gsap.set([screen.b, screen.c, screen.d], { opacity: 0 })
          for (const f of [email, password]) {
            gsap.set(f.placeholder, { opacity: 1 })
            gsap.set(f.value, { opacity: 0, y: 0 })
            gsap.set(f.focus, { opacity: 0 })
          }
          gsap.set(cursor, { ...STEP1.enterFrom, opacity: 0 })
          gsap.set(pointer, { scale: 1 })
          setScreen(1)
        }) as () => void
        idle()

        /** Cursor glide along a shallow quadratic curve, from wherever it is when the glide starts. */
        const glide = (tl: gsap.core.Timeline, at: number, to: Target, { duration, ease, curve }: { duration: number; ease: string; curve: number }) => {
          const p = { t: 0 }
          let a: Point | undefined, b: Point, c: Point
          tl.to(
            p,
            {
              t: 1,
              duration,
              ease,
              onUpdate: () => {
                if (!a) {
                  // Ends measured on the glide's first frame.
                  a = { x: Number(gsap.getProperty(cursor, 'x')), y: Number(gsap.getProperty(cursor, 'y')) }
                  b = point(to)
                  const dx = b.x - a.x
                  const dy = b.y - a.y
                  const len = Math.hypot(dx, dy) || 1
                  c = { x: (a.x + b.x) / 2 - (dy / len) * curve, y: (a.y + b.y) / 2 + (dx / len) * curve }
                }
                const t = p.t
                const u = 1 - t
                gsap.set(cursor, { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y })
              },
            },
            at,
          )
        }

        const press = (tl: gsap.core.Timeline, at: number, target?: HTMLElement) => {
          const P = STEP1.press
          const half = { duration: P.duration / 2, ease: 'power1.inOut', yoyo: true, repeat: 1 }
          tl.to(pointer, { scale: P.cursorScale, ...half }, at)
          if (!target) return
          tl.to(target, { scale: P.buttonScale, ...half }, at)
          tl.to(one('[data-signup-press]', target), { opacity: P.darken, ...half }, at)
        }

        const focus = (tl: gsap.core.Timeline, at: number, f: typeof email, on: boolean) =>
          tl.to(f.focus, { opacity: on ? 1 : 0, duration: STEP1.focus.duration, ease: 'power1.inOut' }, at)

        const fill = (tl: gsap.core.Timeline, at: number, f: typeof email) => {
          const F = STEP1.fill
          tl.to(f.placeholder, { opacity: 0, duration: F.duration, ease: F.ease }, at)
          tl.fromTo(f.value, { opacity: 0, y: F.fromY / SCALE }, { opacity: 1, y: 0, duration: F.duration, ease: F.ease }, at)
        }

        /** Out with one screen, the card clipped to the next one's height, the next one's parts in. */
        const morph = (tl: gsap.core.Timeline, at: number, from: HTMLElement, to: HTMLElement, clip: string, state: number) => {
          tl.to(from, { opacity: 0, duration: M.contentOut, ease: 'power1.out' }, at)
          tl.fromTo(bg, { clipPath: clip === SHORT ? TALL : SHORT }, { clipPath: clip, duration: M.clip, ease: M.clipEase, immediateRender: false }, at + M.clipAt)
          // Undo the last pass's loading state.
          tl.set(one('[data-signup-label]', to), { opacity: 1 }, at)
          const dots = all('[data-signup-dot]', to)
          if (dots.length) tl.set(dots, { opacity: 0 }, at)
          tl.set(to, { opacity: 1 }, at + M.popAt)
          tl.call(setScreen, [state], at + M.popAt)
          tl.fromTo(one('[data-signup-badge]', to), { scale: 0 }, { scale: 1, duration: M.pop, ease: M.popEase }, at + M.popAt)
          tl.fromTo(
            all('[data-signup-rise]', to),
            { opacity: 0, y: M.riseY / SCALE },
            { opacity: 1, y: 0, duration: M.rise, ease: 'power2.out', stagger: M.riseStagger },
            at + M.riseAt,
          )
          tl.fromTo(one('[data-signup-button]', to), { opacity: 0 }, { opacity: 1, duration: M.button, ease: 'power1.out' }, at + M.buttonAt)
        }

        /** Verify KYC's loading state: label out, three dots pulse in turn. */
        const loading = (tl: gsap.core.Timeline, at: number, target: HTMLElement) => {
          const L = STEP1.loading
          tl.to(one('[data-signup-label]', target), { opacity: 0, duration: L.labelOut }, at + L.at)
          tl.fromTo(
            all('[data-signup-dot]', target),
            { opacity: L.fromOpacity, scale: L.fromScale },
            { opacity: 1, scale: 1, duration: L.pulse, ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: L.stagger },
            at + L.at,
          )
        }

        /**
         * One pass: the intro (first) or the crossfade back from Account Verified (loop), then the
         * cursor's flow. Loops build a fresh timeline, so every pass starts from the screen as it is.
         */
        const build = context.add('build', (first: boolean) => {
          const S = STEP1
          const tl = gsap.timeline({ onComplete: () => S.loop.enabled && (current = build(false)) })
          if (first) {
            tl.fromTo(card, { opacity: 0, scale: S.intro.fromScale }, { opacity: 1, scale: 1, duration: S.intro.duration, ease: S.intro.ease }, 0)
          } else {
            // Account Verified out over the first half, the empty form in from a quarter: they overlap.
            const X = S.loop.crossfade
            tl.to(screen.d, { opacity: 0, duration: X / 2, ease: 'none' }, 0)
            tl.fromTo(bg, { clipPath: SHORT }, { clipPath: TALL, duration: M.clip, ease: M.clipEase }, 0)
            for (const f of [email, password]) tl.set(f.placeholder, { opacity: 1 }, 0).set(f.value, { opacity: 0 }, 0).set(f.focus, { opacity: 0 }, 0)
            tl.call(setScreen, [1], X / 4)
            tl.fromTo(screen.a, { opacity: 0 }, { opacity: 1, duration: (X * 3) / 4, ease: 'power2.out' }, X / 4)
          }
          // The flow's times are from play(); a loop pass lines its cursor entry up with the crossfade's end.
          const o = first ? 0 : S.loop.crossfade - S.toEmail.at

          tl.set(cursor, { ...S.enterFrom, opacity: 1 }, o + S.toEmail.at)
          glide(tl, o + S.toEmail.at, 'email', S.toEmail)
          press(tl, o + S.emailClick)
          focus(tl, o + S.emailClick, email, true)
          fill(tl, o + S.emailFill, email)
          tl.to(cursor, { opacity: 0, duration: S.cursorFade }, o + S.emailDone)
          focus(tl, o + S.emailDone, email, false)
          focus(tl, o + S.emailDone, password, true)
          fill(tl, o + S.passwordFill, password)
          tl.call(setScreen, [2], o + S.passwordFill + S.fill.duration)
          focus(tl, o + S.passwordDone, password, false)
          tl.set(cursor, { x: () => point('password').x, y: () => point('password').y }, o + S.passwordDone)
          tl.to(cursor, { opacity: 1, duration: S.cursorFade }, o + S.passwordDone)
          glide(tl, o + S.passwordDone, 'create', S.toCreate)
          press(tl, o + S.createClick, button('create'))

          morph(tl, o + S.toCreated, screen.a, screen.b, SHORT, 3)
          glide(tl, o + S.toContinue.at, 'continue', S.toContinue)
          press(tl, o + S.continueClick, button('continue'))

          morph(tl, o + S.toKyc, screen.b, screen.c, TALL, 4)
          glide(tl, o + S.toVerify.at, 'verify', S.toVerify)
          press(tl, o + S.verifyClick, button('verify'))
          loading(tl, o + S.verifyClick, button('verify'))

          morph(tl, o + S.toVerified, screen.c, screen.d, SHORT, 5)
          tl.to(cursor, { opacity: 0, duration: S.cursorFade }, o + S.cursorOut)
          if (S.loop.enabled) tl.set({}, {}, o + S.cursorOut + S.loop.hold)
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
          idle()
          state = 'idle'
        }
        const c = { play, pause, reset }
        controller.current = c
        stepControllers.set(0, c)
        if (showReplay) setReplay(() => () => (reset(), play()))
        if (import.meta.env.DEV) window.signUp = { ...c, config: STEP1 }

        // Pause in a hidden tab (StepsSection's `playing` covers this too).
        const onVisibility = () => {
          if (document.visibilityState === 'hidden') pause()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
          document.removeEventListener('visibilitychange', onVisibility)
          current?.kill()
          controller.current = null
          if (stepControllers.get(0) === c) stepControllers.delete(0)
          if (import.meta.env.DEV) delete window.signUp
          delete root.dataset.screen
          setReplay(null)
        }
      })
    },
    { scope: rootRef },
  )

  // The scroll sequence drives it: at rest and on screen → play; leaving or off screen → pause (it
  // shrinks away frozen); collapsed or not yet grown → reset.
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
      { threshold: STEP1.visibleThreshold },
    )
    io.observe(root)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [active])

  return (
    <div ref={rootRef} data-signup data-screen="2" aria-hidden="true" className="product-ui absolute inset-0">
      <div data-signup-card className="absolute top-[63px] left-[88px] h-[462px] w-[321px]">
        <div data-signup-bg className="absolute inset-0 bg-white" />
        <div className="absolute top-0 left-0 h-[982px] w-[683px] origin-top-left scale-x-[0.46999] scale-y-[0.47047]">
          <FormScreen />
          <ResultScreen
            name="b"
            badge={<CheckBadge />}
            title="Account Created"
            subtitle="Your account has been successfully created"
            button="continue"
            label="Continue"
          />
          <KycScreen />
          <ResultScreen
            name="d"
            badge={<CheckBadge />}
            title="Account Verified"
            subtitle="Your account has been successfully verified"
            button="dashboard"
            label="Continue To Dashboard"
          />
        </div>
      </div>

      {import.meta.env.DEV &&
        showOverlay &&
        references.map(({ state, image, short }) => (
          <img
            key={state}
            data-signup-ref={state}
            src={image.src}
            srcSet={image.srcset}
            sizes="321px"
            width={image.width}
            height={image.height}
            alt=""
            className={`pointer-events-none absolute left-[88px] w-[321px] max-w-none ${short ? 'top-[130px] h-[328px]' : 'top-[63px] h-[462px]'}`}
          />
        ))}

      {/* Cursor: a point at its tip. Figma "Polygon 4" (11017:49891), the same 30°-rotated pointer as
          steps 3 and 5; the SVG carries its drop shadow. Its tip sits at (34.1, 18) in the SVG. */}
      <StepCursor data-signup-cursor className="top-0 left-0 opacity-0" />

      {import.meta.env.DEV &&
        replay &&
        createPortal(
          <button type="button" onClick={replay} className="fixed bottom-16 left-4 z-50 bg-white px-3 py-2 text-button text-black shadow-lg">
            Replay sign-up
          </button>,
          document.body,
        )}
    </div>
  )
}

/** Screen A, states 1–2. Native px; content column x 130–546. */
function FormScreen() {
  return (
    <div data-signup-screen="a" className="absolute inset-0">
      <p className="absolute top-[179.2px] left-[130px] text-[32px] leading-none font-bold whitespace-nowrap text-black">Sign Up</p>
      <p className="absolute top-[227.1px] left-[130px] text-[16px] leading-none font-light whitespace-nowrap text-(--signup-muted)">
        Please enter your details below to start
      </p>
      <p className="absolute top-[289px] left-[130px] text-[14px] leading-none font-semibold whitespace-nowrap text-black uppercase">
        Already have an account? <span className="text-(--signup-link)">Login</span>
      </p>

      <Field name="email" label="Email Address" placeholder="Enter your email address" value="carlwinslow@jaymail.com" top={353.2} />
      <Field
        name="password"
        label="Password"
        placeholder="Enter password"
        value={STEP1.maskPassword ? '•'.repeat('DrealEstate123@'.length) : 'DrealEstate123@'}
        top={450.2}
      >
        <EyeIcon />
      </Field>

      <SolidButton name="create" label="Create Account" top={566} left={130} labelTop={17.2} />

      <p className="absolute top-[643.25px] left-[130px] w-[416px] text-center text-[12px] leading-[17.5px] text-(--signup-legal)">
        By signing up, you agree to Fraqshares
        <br />
        <span className="font-semibold text-black">Terms &amp; Condition</span> and{' '}
        <span className="font-semibold text-black">Privacy Policy</span>
      </p>
      {/* Figma centres OR 2.8px right of the column's centre. */}
      <p className="absolute top-[706.25px] left-[290.8px] w-[100px] text-center text-[15px] leading-none font-light text-(--signup-muted)">OR</p>

      <div className="absolute top-[750px] left-[130px] h-[54px] w-[416px] border-2 border-forest">
        <GoogleG />
        <span className="absolute top-[15.4px] left-[131.3px] text-[16px] leading-none font-semibold whitespace-nowrap text-(--signup-ink)">
          Continue With Google
        </span>
      </div>
    </div>
  )
}

/**
 * A field: label, then placeholder and value as two separate layers on the same line (one fades out
 * as the other fades in), a grey underline with a forest one over it for focus.
 * `top` is the label's; the rest follow Figma's spacing. Letter-spacing as measured: 0.4px on the label, 0.5px on the line.
 */
function Field({ name, label, placeholder, value, top, children }: { name: string; label: string; placeholder: string; value: string; top: number; children?: ReactNode }) {
  return (
    <div data-signup-field={name} className="absolute left-[130px] w-[416px] tracking-[0.4px]" style={{ top }}>
      <p className="absolute top-0 left-0 text-[16px] leading-none font-medium whitespace-nowrap text-(--signup-label)">{label}</p>
      <p data-signup-placeholder className="absolute top-[33.7px] left-0 text-[14px] leading-none font-light tracking-[0.5px] whitespace-nowrap text-(--signup-label)">
        {placeholder}
      </p>
      <p data-signup-value className="absolute top-[34.55px] left-0 text-[14px] leading-none tracking-[0.5px] whitespace-nowrap text-strong">
        {value}
      </p>
      <div data-signup-target={name} className="absolute top-[32.8px] left-0 h-[26px] w-full" />
      <div className="absolute top-[56.8px] left-0 h-[2px] w-full bg-(--signup-rule)" />
      <div data-signup-focus className="absolute top-[56.8px] left-0 h-[2px] w-full bg-forest opacity-0" />
      {children}
    </div>
  )
}

/** Olive button, square corners; `labelTop` from Figma (its label sits ~2px above centre). */
function SolidButton({ name, label, top, left, labelTop, loading = false }: { name: string; label: string; top: number; left: number; labelTop: number; loading?: boolean }) {
  return (
    <div data-signup-button={name} data-signup-target={name} className="absolute h-[54px] w-[416px] bg-olive" style={{ top, left }}>
      <div data-signup-press className="absolute inset-0 bg-black opacity-0" />
      <p
        data-signup-label
        className="absolute inset-x-0 text-center text-[16px] leading-none font-semibold whitespace-nowrap text-(--signup-ink)"
        style={{ top: labelTop }}
      >
        {label}
      </p>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-[7px]">
          {[0, 1, 2].map((i) => (
            <span key={i} data-signup-dot className="size-[8px] rounded-full bg-(--signup-ink) opacity-0" />
          ))}
        </div>
      )}
    </div>
  )
}

/** Screens B and D (states 3 and 5): badge, title, subtitle, button. Centred on the 683 frame. */
function ResultScreen({ name, badge, title, subtitle, button, label }: { name: string; badge: ReactNode; title: string; subtitle: string; button: string; label: string }) {
  return (
    <div data-signup-screen={name} className="absolute inset-0 opacity-0">
      <div data-signup-badge className="absolute top-[311.24px] left-[279.24px] size-[125px] rounded-full bg-(--signup-ink)">
        {badge}
      </div>
      <p data-signup-rise className="absolute inset-x-0 top-[482.3px] text-center text-[26px] leading-none font-semibold whitespace-nowrap text-(--signup-ink)">
        {title}
      </p>
      <p data-signup-rise className="absolute inset-x-0 top-[523.9px] text-center text-[16px] leading-none font-light whitespace-nowrap text-(--signup-muted)">
        {subtitle}
      </p>
      <SolidButton name={button} label={label} top={629} left={134} labelTop={17.2} />
    </div>
  )
}

/** Screen C (state 4). */
function KycScreen() {
  return (
    <div data-signup-screen="c" className="absolute inset-0 opacity-0">
      <div data-signup-badge className="absolute top-[286.78px] left-[278.78px] size-[126px] rounded-full bg-forest">
        <ShieldIcon />
      </div>
      <p data-signup-rise className="absolute inset-x-0 top-[456.1px] text-center text-[24px] leading-none font-bold whitespace-nowrap text-(--signup-kyc-title)">
        KYC Verification
      </p>
      <p data-signup-rise className="absolute inset-x-0 top-[500.1px] text-center text-[16px] leading-[22px] font-light whitespace-nowrap text-(--signup-body)">
        Almost there, provide your National
        <br />
        Identification Number to complete your
        <br />
        account setup.
      </p>
      <SolidButton name="verify" label="Verify KYC" top={652} left={134} labelTop={16.9} loading />
    </div>
  )
}

/** White check, 9px stroke, in the 125 circle (measured from the state 3 image). */
function CheckBadge() {
  return (
    <svg viewBox="0 0 125 125" fill="none" className="absolute inset-0 size-full">
      <polyline points="35.6,63.9 53.2,80.6 89.3,45.3" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Olive shield with a forest keyhole, 46 × 54 in the 126 circle (redrawn from the state 4 image). */
function ShieldIcon() {
  return (
    <svg viewBox="0 0 46 54" width="46" height="54" fill="none" overflow="visible" className="absolute top-[36.22px] left-[40.22px]">
      <polygon points="23,3.9 42,10.4 42,34.6 23,51 4,34.6 4,10.4" fill="var(--color-olive)" stroke="var(--color-olive)" strokeWidth="8" strokeLinejoin="round" />
      <circle cx="23" cy="23.6" r="6.8" fill="var(--color-forest)" />
      <line x1="23" y1="26" x2="23" y2="36.5" stroke="var(--color-forest)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

/** Password visibility eye, 17.8 × 15.5 at the end of the field line (redrawn from the state 1 image). */
function EyeIcon() {
  return (
    <svg viewBox="0 0 17.8 15.5" width="17.8" height="15.5" fill="none" className="absolute top-[35.8px] left-[395.2px]">
      <path
        d="M0.75 7.75C1.5 3.9 4.9 0.75 8.9 0.75C12.9 0.75 16.3 3.9 17.05 7.75C16.3 11.6 12.9 14.75 8.9 14.75C4.9 14.75 1.5 11.6 0.75 7.75Z"
        stroke="var(--signup-icon)"
        strokeWidth="1.5"
      />
      <circle cx="8.9" cy="7.75" r="2.8" stroke="var(--signup-icon-soft)" strokeWidth="1.1" />
    </svg>
  )
}

/** Google "G", the official four-colour mark (Google sign-in branding), 20 × 20. */
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" className="absolute top-[15px] left-[101.6px]">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
