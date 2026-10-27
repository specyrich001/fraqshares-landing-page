import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import { Hero } from '../hero/Hero.tsx'
import { WealthSection } from '../wealth/WealthSection.tsx'
import { wealthFullPhoto, wealthPhotoCrop as crop } from '../wealth/wealthPhoto.ts'
import { STAGE_MEDIA, stageTiming as T } from './stageTiming.ts'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Span = { start: number; end: number }
const span = (s: Span) => s.end - s.start

/**
 * Hero + "Build wealth" as one scroll stage.
 *
 * Static by default (no JS, reduced motion, under 1024px): the two sections simply stack.
 * When the sequence runs, `data-staged` turns the stage into section 2 with the hero laid over it
 * (z-10), and the stage pins for T.trackVh of scroll:
 *   - the hero layer is clipped (clip-path: inset) from full-bleed down to section 2's image slot;
 *   - inside it, the hero photo and the full section-2 photo (Figma 10971:74811) both scale toward
 *     the slot, each staying a cover of the clip, so neither distorts as landscape becomes portrait;
 *   - the full photo starts in Figma's full-bleed framing and lands lined up with the slot's crop,
 *     where the slot's own photo takes over, so the end state *is* the static section 2 and
 *     unpinning has nothing to shift.
 * Only transform, opacity and clip-path animate. Targets are measured from the live slot and
 * re-measured on every ScrollTrigger refresh (resize, font/image load).
 */
export function HeroWealthStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(STAGE_MEDIA, () => {
        const stage = stageRef.current!
        const el = <E extends HTMLElement = HTMLElement>(selector: string) => stage.querySelector<E>(selector)!

        const hero = el('[data-hero]')
        const heroPhoto = el('[data-hero-photo]')
        const heroContent = el('[data-hero-content]')
        const heroCtas = el('[data-hero-ctas]')
        const heroFeed = stage.querySelector<HTMLElement>('[data-feed]')
        // The feed's visible pieces (its data-feed-fade leaves), faded one by one (see "Hero content out").
        const heroFeedParts = heroFeed ? [...heroFeed.querySelectorAll<HTMLElement>('[data-feed-fade]')] : []
        const handoff = el<HTMLImageElement>('[data-stage-handoff]')
        const slot = el('[data-wealth-slot]')
        const slotPhoto = el('[data-wealth-photo]')
        const backCard = el('[data-wealth-card=back]')
        const backCardOpacity = parseFloat(getComputedStyle(backCard).opacity)

        stage.dataset.staged = ''
        const spacer = spacerRef.current!
        spacer.style.height = `${T.trackVh}vh`

        // Slot rect in the hero layer's coordinates. Neither box is transformed, pinned separately
        // or scrolled relative to the other, so this is stable at any progress.
        const geometry = () => {
          const h = hero.getBoundingClientRect()
          const s = slot.getBoundingClientRect()
          const g = { W: h.width, H: h.height, l: s.left - h.left, t: s.top - h.top, w: s.width, h: s.height }
          return { ...g, r: g.W - g.l - g.w, b: g.H - g.t - g.h, cx: g.l + g.w / 2, cy: g.t + g.h / 2 }
        }
        // Where the full photo lands: the slot photo's own object-fit: cover mapping of its crop,
        // extended to the whole source, so the crop lines up with the slot pixel for pixel.
        // The slot photo is untransformed, so Chrome snaps it to the device-pixel grid (the slot sits
        // at x 502.5 at 1440); the transformed copy would draw at the exact half pixel and shift ½px
        // at the swap. Land the copy on the same snapped origin.
        const snap = (v: number) => Math.round(v * devicePixelRatio) / devicePixelRatio
        const landing = () => {
          const g = geometry()
          const k = Math.max(g.w / crop.width, g.h / crop.height) // CSS px per source px in the slot
          const heroBox = hero.getBoundingClientRect()
          const slotLeft = snap(heroBox.left + g.l) - heroBox.left
          const slotTop = snap(heroBox.top + g.t) - heroBox.top
          return {
            left: slotLeft + (g.w - crop.width * k) / 2 - crop.left * k,
            top: slotTop + (g.h - crop.height * k) / 2 - crop.top * k,
            width: crop.sourceWidth * k,
            height: crop.sourceHeight * k,
          }
        }
        // Where it starts: Figma's full-bleed frame, i.e. the hero's 1773 × 921 rect at x −174 with
        // the photo cover-fitted and centred. Past 1773px wide the rect fills the width, as the hero does.
        const start = () => {
          const g = geometry()
          const rectW = Math.max(g.W, (1773 * g.H) / 921)
          const rectLeft = (g.W - rectW) * (174 / (1773 - 1440))
          const s = Math.max(rectW / crop.sourceWidth, g.H / crop.sourceHeight)
          const w = crop.sourceWidth * s
          return { left: rectLeft + (rectW - w) / 2, top: (g.H - crop.sourceHeight * s) / 2, width: w }
        }
        // Laid out at its landing box (set, never tweened) and transformed from the start box.
        const placeHandoff = () => {
          const L = landing()
          // autoRound: false — GSAP rounds left/top/width/height to whole px by default, which put the
          // copy ½px off the slot photo at the swap.
          gsap.set(handoff, { left: L.left, top: L.top, width: L.width, height: L.height, autoRound: false })
        }
        placeHandoff()

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            // Pinned for the transition and then one more screen while section 3 scrolls up over it.
            // No pin spacing: the spacer below covers only the transition, so section 3 arrives
            // exactly as the transition ends instead of after the overlap.
            end: () => `+=${(window.innerHeight * (T.trackVh + T.overlapVh)) / 100}`,
            pin: true,
            pinSpacing: false,
            scrub: T.scrub,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: placeHandoff,
          },
          onUpdate() {
            // Hidden hero content shouldn't catch clicks or keyboard focus. The H1 stays in the
            // accessibility tree (opacity only); just the buttons go inert. Written only on change,
            // so scrolling doesn't trigger a style recalc per frame.
            const hidden = this.time() >= T.heroContentOut.end // time = fraction of the transition
            if (hidden === heroCtas.inert) return
            heroCtas.inert = hidden
            heroContent.style.pointerEvents = hidden ? 'none' : ''
          },
        })

        // Hero-side tweens don't pre-apply their starting styles (immediateRender: false). The values
        // are the hero's own resting state anyway, but inline clip-path/transforms change how Chrome
        // composites the feed's backdrop blur, and the first frame on load should be the static hero.
        const fromRest = { immediateRender: false }

        // --- Hero content out ---------------------------------------------------------------
        // Text block and feed drift up together; the feed fades piece by piece, never as a whole.
        // Opacity below 1 on an ancestor of the notification card makes that ancestor the card's
        // backdrop root, so its backdrop-filter would see only the feed (nothing behind it) and the
        // frosted card would turn clear the moment the fade started. Opacity on the card itself is fine.
        const out = T.heroContentOut
        const contentOut = { ...fromRest, duration: span(out), ease: out.ease }
        tl.fromTo([heroContent, heroFeed].filter(Boolean), { y: 0 }, { ...contentOut, y: out.driftY }, out.start)
        tl.fromTo([heroContent, ...heroFeedParts], { opacity: 1 }, { ...contentOut, opacity: 0 }, out.start)

        // --- Shrink into the slot (clip, hero photo and copy share one ease and duration, which
        //     keeps both photos covering the clip at every frame) ------------------------------
        const sh = T.shrink
        const shrink = { ...fromRest, duration: span(sh), ease: sh.ease }
        tl.fromTo(
          hero,
          { clipPath: 'inset(0px 0px 0px 0px)' },
          {
            ...shrink,
            clipPath: () => {
              const g = geometry()
              return `inset(${g.t}px ${g.r}px ${g.b}px ${g.l}px)`
            },
          },
          sh.start,
        )
        // Hero photo: from its full box to the smallest scale that still covers the slot, centred on it.
        const heroScale = () => {
          const g = geometry()
          return Math.max(g.w / g.W, g.h / g.H)
        }
        tl.fromTo(
          heroPhoto,
          { x: 0, y: 0, scale: 1, transformOrigin: '0 0' },
          {
            ...shrink,
            scale: heroScale,
            x: () => geometry().cx - (heroScale() * geometry().W) / 2,
            y: () => geometry().cy - (heroScale() * geometry().H) / 2,
          },
          sh.start,
        )
        // Full section-2 photo: from Figma's full-bleed framing to its landing box. Both boxes contain
        // the clip at their ends (and so at every eased step in between), so it always covers it.
        tl.fromTo(
          handoff,
          {
            transformOrigin: '0 0',
            scale: () => start().width / landing().width,
            x: () => start().left - landing().left,
            y: () => start().top - landing().top,
          },
          { ...shrink, scale: 1, x: 0, y: 0 },
          sh.start,
        )

        const ov = T.heroOverlaysOut
        tl.fromTo(el('[data-hero-gradient]'), { opacity: 1 }, { ...fromRest, opacity: 0, duration: span(ov), ease: ov.ease }, ov.start)
        tl.fromTo(el('[data-hero-grain]'), { opacity: 0.1 }, { ...fromRest, opacity: 0, duration: span(ov), ease: ov.ease }, ov.start)

        const cf = T.crossfade
        tl.fromTo(handoff, { opacity: 0 }, { opacity: 1, duration: span(cf), ease: cf.ease }, cf.start)

        const bl = T.bottomBlurIn
        tl.fromTo(el('[data-wealth-blur]'), { opacity: 0 }, { opacity: 1, duration: span(bl), ease: bl.ease }, bl.start)

        // --- Hand-off: the full photo's crop now sits exactly on the slot photo. Show the real one and clip the
        //     hero layer away entirely (it stays in the DOM, H1 included). Reverses when scrolling back.
        tl.fromTo(slotPhoto, { opacity: 0 }, { opacity: 1, duration: 0, immediateRender: true }, sh.end)
        tl.set(hero, { clipPath: 'inset(50% 50% 50% 50%)' }, sh.end)

        // --- Section 2 text + overlays in --------------------------------------------------------
        const tx = T.textIn
        const textIn = { duration: span(tx), ease: tx.ease }
        tl.fromTo(el('[data-wealth-heading]'), { x: -tx.offsetX, opacity: 0 }, { ...textIn, x: 0, opacity: 1 }, tx.start)
        tl.fromTo(el('[data-wealth-paragraph]'), { x: tx.offsetX, opacity: 0 }, { ...textIn, x: 0, opacity: 1 }, tx.start)

        const oi = T.overlaysIn
        tl.fromTo(
          [el('[data-wealth-pill]'), el('[data-wealth-card=front]')],
          { opacity: 0 },
          { opacity: 1, duration: span(oi), ease: oi.ease },
          oi.start,
        )
        tl.fromTo(backCard, { opacity: 0 }, { opacity: backCardOpacity, duration: span(oi), ease: oi.ease }, oi.start)

        // Positions above are fractions of the transition track. The timeline runs on through the
        // overlap (section 3 covering section 2) with nothing animating, so pad it to match.
        tl.set({}, {}, 1 + T.overlapVh / T.trackVh)

        // Runs after GSAP's own revert (tweens → timeline → cleanups). That revert leaves the
        // immediateRender:false tweens and the hand-off set behind (seen when resizing below 1024px
        // mid-sequence: hero still clipped to the slot, slot photo at opacity 0), so clear every
        // animated property explicitly. Only these properties: React owns the grain's background-image.
        return () => {
          delete stage.dataset.staged
          spacer.style.height = ''
          heroCtas.inert = false
          heroContent.style.pointerEvents = ''
          gsap.set(hero, { clearProps: 'clipPath' })
          gsap.set([heroPhoto, heroContent, heroFeed, handoff].filter(Boolean), {
            clearProps: 'transform,transformOrigin,translate,rotate,scale,opacity',
          })
          gsap.set(heroFeedParts, { clearProps: 'opacity' })
          gsap.set(
            [
              el('[data-hero-gradient]'),
              el('[data-hero-grain]'),
              slotPhoto,
              el('[data-wealth-blur]'),
              el('[data-wealth-pill]'),
              el('[data-wealth-card=front]'),
              backCard,
            ],
            { clearProps: 'opacity' },
          )
          gsap.set([el('[data-wealth-heading]'), el('[data-wealth-paragraph]')], {
            clearProps: 'transform,translate,rotate,scale,opacity',
          })
        }
      })
    },
    { scope: stageRef },
  )

  return (
    // Plain wrapper so GSAP's pin-spacer is inserted inside a node React doesn't reconcile around.
    <div>
      {/* isolate: the stage is its own stacking context, so section 3 (later in the DOM) always paints over it. */}
      <div ref={stageRef} data-stage className="group/stage relative isolate data-staged:overflow-hidden">
        <div className="group-data-staged/stage:absolute group-data-staged/stage:inset-x-0 group-data-staged/stage:top-0 group-data-staged/stage:z-10">
          <Hero
            transitionMedia={
              // Starts up to 1773px wide (Figma's full-bleed framing), so the 2000w file at 1x. No
              // will-change: it's scaled up to 1.8×, and a promoted layer would be rastered once at
              // its 974px layout size and stretched, losing that detail.
              <img
                src={wealthFullPhoto.src}
                srcSet={wealthFullPhoto.srcset}
                sizes="max(100vw, 1773px)"
                width={wealthFullPhoto.width}
                height={wealthFullPhoto.height}
                alt=""
                loading="lazy"
                decoding="async"
                data-stage-handoff
                className="pointer-events-none absolute hidden max-w-none opacity-0 group-data-staged/stage:block"
              />
            }
          />
        </div>
        <WealthSection />
      </div>
      {/* Scroll room for the transition while the stage is pinned (height set only when staged). */}
      <div ref={spacerRef} data-stage-spacer aria-hidden="true" />
    </div>
  )
}
