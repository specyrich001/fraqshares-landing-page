import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useRef, type ReactNode } from 'react'
import images from '../../generated/images.json'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { buttonBase, focusRingOnDark } from '../linkStyles.ts'
import { HeroActivityFeed } from './HeroActivityFeed.tsx'
import { heroIntroTiming as I } from './heroIntroTiming.ts'

/**
 * Pointer parallax on the hero photo: it drifts against the cursor, a few px, while the hero sits at
 * the top of the page. Scroll can't drive it: scrolling already moves the photo (the hero → section-2
 * shrink). The activity feed rides the same layer transform so its dot stays on the phone.
 */
const PARALLAX = {
  /** Furthest drift at the section's edges, px. */
  x: 10,
  y: 6,
  /** Zoom that keeps the drift from showing the section's edges (≥ 1 + 2 × drift / size). */
  overscan: 1.015,
  /** Follow lag: each pointer move eases the layers to the new spot over this. */
  follow: { duration: 1.1, ease: 'power3.out' },
  /** Back to rest (no drift, no zoom) when the page scrolls away from the top, and back again. */
  reset: { duration: 0.5, ease: 'power2.out' },
}
const PARALLAX_MEDIA = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

gsap.registerPlugin(SplitText, useGSAP)

const photo = images['hero/photo']
const grain = images['hero/grain']

const button = `${buttonBase} h-13 px-4.5 ${focusRingOnDark}`

/*
 * Figma: Hero Section (10799:25074), 1440 × 921 from the top of the page. The fixed SiteHeader
 * overlays its first 88px, transparent while it's over this section (id="hero").
 *
 * Photo: Figma fits the flipped image to a 1773px-wide rect at (−174, 0) and shifts it up 6.44%.
 * The build flips it and crops it to the 1039 source rows that are visible
 * (assets-src/hero/photo.json), so `cover` at 921px tall lands on Figma's exact scale
 * (1772.9px wide). Only the horizontal crop is left to object-position:
 *   x 52.27% → 174 of the 332.9px overflow, i.e. Figma's −174px offset at 1440.
 *   y 74.05% → the phone's row (682 / 921). Past 1773px wide, cover starts scaling by width
 *              and crops vertically; anchoring at the phone keeps it at y 682.
 *
 * Height: the viewport (100svh), never less than 704px: below that the feed's notification card
 * would slide under the 88px header. The text block sits on the bottom, 130px above the edge as in
 * Figma (its 921px frame put the buttons at 791), so short screens shrink the space above it.
 *
 * Activity feed: rides on the phone at any size. photoBox is an invisible box with the photo's
 * rendered geometry, i.e. what object-fit: cover draws: at least the section's height and width at
 * the photo's 1772.9 : 921 ratio, anchored by the same 52.27% / 74.05% as object-position (left/top
 * of the section minus that share of its own size). Inside it the phone is at (74.17%, 74.05%); the
 * feed's dot is at (153, 479) in the feed, so the feed goes at those minus 153px / 479px
 * (988, 203 at 1440 × 921). Hidden below 1200px, where it would run off the right edge (mobile
 * design pending).
 */
const photoBox =
  'pointer-events-none absolute top-[74.05%] left-[52.27%] hidden aspect-[1772.9/921] h-full min-w-full -translate-x-[52.27%] -translate-y-[74.05%] min-[1200px]:block'
const feedPosition = 'absolute top-[calc(74.05%_-_479px)] left-[calc(74.17%_-_153px)]'

/**
 * `transitionMedia` renders above the photo layers and below the content: the hero → section-2
 * scroll transition puts its copy of the section-2 photo there. data-hero-* attributes are its hooks.
 */
export function Hero({ transitionMedia }: { transitionMedia?: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)

  // Intro (heroIntroTiming): runs once on load, never with reduced motion. It animates the text
  // elements themselves, so it can't collide with the scroll transition, which moves their wrapper.
  // The text is hidden before first paint (layout effect), revealed once the font is in, and the
  // split is reverted afterwards so the headline is plain text again and reflows normally.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', (context) => {
        const section = sectionRef.current!
        const title = section.querySelector<HTMLElement>('#hero-title')!
        const paragraph = section.querySelector<HTMLElement>('[data-hero-paragraph]')!
        const buttons = [...section.querySelectorAll<HTMLElement>('[data-hero-ctas] > *')]
        const text = [title, paragraph, ...buttons]
        gsap.set(text, { autoAlpha: 0 })

        let split: SplitText | undefined
        let cancelled = false
        // Named, so it isn't run now: context.add(name, fn) returns fn bound to this matchMedia context.
        const play = context.add('play', () => {
          if (cancelled) return
          split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'hero-line' })
          gsap.set(title, { autoAlpha: 1 })
          const { headline: h, paragraph: p, buttons: b } = I
          gsap
            .timeline({
              delay: I.delay,
              // Back to plain text with no inline styles, so it reflows and the scroll transition owns it.
              onComplete: () => {
                split?.revert()
                gsap.set(text, { clearProps: 'opacity,visibility,transform,translate,rotate,scale' })
              },
            })
            .from(split.lines, { yPercent: h.yPercent, duration: h.duration, stagger: h.stagger, ease: h.ease }, 0)
            .fromTo(paragraph, { autoAlpha: 0, y: p.y }, { autoAlpha: 1, y: 0, duration: p.duration, ease: p.ease }, p.at)
            .fromTo(buttons, { autoAlpha: 0, y: b.y }, { autoAlpha: 1, y: 0, duration: b.duration, stagger: b.stagger, ease: b.ease }, b.at)
        })
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, I.fontTimeoutMs))]).then(() => play())

        return () => {
          cancelled = true
          split?.revert()
          gsap.set(text, { clearProps: 'opacity,visibility,transform,translate' })
        }
      })
    },
    { scope: sectionRef },
  )

  // Parallax (PARALLAX): both layers get the same transform about the section centre.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(PARALLAX_MEDIA, () => {
        const section = sectionRef.current!
        const layers = [...section.querySelectorAll<HTMLElement>('[data-hero-parallax]')]
        const P = PARALLAX
        gsap.set(layers, { scale: P.overscan, transformOrigin: '50% 50%' })
        const toX = gsap.quickTo(layers, 'x', P.follow)
        const toY = gsap.quickTo(layers, 'y', P.follow)
        let active = window.scrollY <= 0

        const onMove = (e: PointerEvent) => {
          if (!active) return
          const r = section.getBoundingClientRect()
          // -1 … 1 across the section; the photo moves the other way, as a far layer would.
          const nx = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1)
          const ny = gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1)
          toX(-nx * P.x)
          toY(-ny * P.y)
        }
        const toRest = () => {
          toX(0)
          toY(0)
        }
        // Scrolled away: settle to identity so the shrink transition's measurements hold exactly.
        const onScroll = () => {
          const atTop = window.scrollY <= 0
          if (atTop === active) return
          active = atTop
          toRest()
          gsap.to(layers, { scale: atTop ? P.overscan : 1, ...P.reset, overwrite: 'auto' })
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        document.documentElement.addEventListener('pointerleave', toRest)
        window.addEventListener('scroll', onScroll, { passive: true })
        if (!active) gsap.set(layers, { scale: 1 })
        return () => {
          window.removeEventListener('pointermove', onMove)
          document.documentElement.removeEventListener('pointerleave', toRest)
          window.removeEventListener('scroll', onScroll)
          gsap.set(layers, { clearProps: 'transform,translate,rotate,scale,transformOrigin' })
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-hero
      aria-labelledby="hero-title"
      className="relative flex min-h-[max(100svh,704px)] flex-col justify-end overflow-hidden bg-black"
    >
      {/* 1. Photo (LCP): eager + high priority. Rendered width is max(100vw, 1773px) at desktop height.
          Inside the parallax layer (PARALLAX), which the scroll transition never touches. */}
      <div data-hero-parallax className="absolute inset-0">
        <img
          src={photo.src}
          srcSet={photo.srcset}
          sizes="max(100vw, 1773px)"
          width={photo.width}
          height={photo.height}
          alt=""
          loading="eager"
          fetchPriority="high"
          data-hero-photo
          className="absolute inset-0 size-full object-cover object-[52.27%_74.05%] group-data-staged/stage:will-change-transform"
        />
      </div>
      {/* 2. Gradient: transparent → black over the full section, as in Figma. The clear top keeps the nav readable. */}
      <div aria-hidden="true" data-hero-gradient className="absolute inset-0 bg-linear-to-b from-black/0 to-black" />
      {/* 3. Grain: 432×288 tile from the top-left, 10% opacity. */}
      <div
        aria-hidden="true"
        data-hero-grain
        className="pointer-events-none absolute inset-0 bg-[length:432px_288px] bg-top-left bg-repeat opacity-10"
        style={{ backgroundImage: `url(${grain.src})` }}
      />

      {transitionMedia}

      {/* 4. Content, on the bottom: 130px under the buttons (Figma). The top padding only keeps it clear
          of the 88px header when the text wraps tall (narrow screens, zoom). */}
      <div data-hero-content className="page-row relative pt-[128px] pb-[130px]">
        <div className="max-w-[638px]">
          {/* The 1.0 line box is too tight for the masks' clip: descenders and the ampersand would be cut.
              Widen what each mask shows with a clip-path past its box (no margins: they collapse between
              stacked lines, making the split headline taller and jumping when it's reverted). */}
          <h1
            id="hero-title"
            className="text-hero-h1 text-white [&_.hero-line-mask]:overflow-visible! [&_.hero-line-mask]:[clip-path:inset(-0.2em_-0.15em_-0.25em)]"
          >
            Buy, sell, and
            <br />
            own shares in real estate &amp; businesses
          </h1>
          <p data-hero-paragraph className="mt-[18px] max-w-[557px] text-body-main text-white/70">
            Diversify your portfolio with income and growth potential, without the management hassle
          </p>
          <div data-hero-ctas className="mt-12 flex flex-wrap gap-4">
            {/* Figma: 10px between label and arrow (18 + 110 + 10 + 24 + 18 = 180). */}
            <a href="#get-started" className={`${button} gap-2.5 bg-forest text-white hover:bg-olive hover:text-strong`}>
              Start Investing
              <ArrowRightIcon className="shrink-0" />
            </a>
            <a href="#how-it-works" className={`${button} bg-white text-black hover:bg-mint`}>
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* The feed's layer moves exactly as the photo's, so the dot stays on the phone. */}
      <div data-hero-parallax className="pointer-events-none absolute inset-0">
        <div aria-hidden="true" className={photoBox}>
          <HeroActivityFeed className={feedPosition} />
        </div>
      </div>
    </section>
  )
}
