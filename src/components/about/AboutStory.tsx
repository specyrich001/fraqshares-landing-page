import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useRef } from 'react'
import images from '../../generated/images.json'
import { MIN_INVESTMENT } from '../minimumInvestment.ts'
import { STORY, STORY_MEDIA } from './storyTiming.ts'
import './about-story.css'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

/** Figma 11051:592 and 11051:17496: thousands of vector dots each, so rasters (rendered from Figma's
 *  SVGs at 2x, lossless WebP: lossy smears the halftone). */
const handLeft = images['about/hand-left']
const handRight = images['about/hand-right']

/** DEV: ?phase=a (start: all dim), b (hands met, statement still hidden), end (final). Static, no pin. */
function devPhase() {
  if (!import.meta.env.DEV) return null
  const phase = new URLSearchParams(window.location.search).get('phase')
  return phase === 'a' || phase === 'b' || phase === 'end' ? phase : null
}

/**
 * About section 2, Figma: Desktop - 21 (11049:456), 1440 × 1483, under section 1. Timings: storyTiming.ts.
 *
 * Phase A: as the paragraphs scroll up, their words turn from --text-dim to #111 in reading order
 * (SplitText words, scrubbed, no pin). SplitText's aria option labels each <p> with its text and
 * hides the word spans, so screen readers read plain sentences; autoSplit re-splits when fonts load
 * or the width changes.
 *
 * Phase B: when the hands + statement group is centred in the viewport the section pins (1.5
 * screens). The hands slide in from the edges (0 → 60%), the statement's lines rise in (55 → 85%)
 * with the amount last, then it holds and unpins. Before the pin the hands are off screen and the
 * statement transparent, so the space under the paragraphs reads as breathing room.
 *
 * The markup is the final state, which is what reduced motion and no JS get: dark text, hands met,
 * statement shown, no pin. Only transform, opacity and colour animate.
 *
 * relative z-10 + bg: it's the last section, so the footer reveal slides it up off the footer.
 */
export function AboutStory() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(STORY_MEDIA, () => {
        const section = sectionRef.current!
        const copy = section.querySelector<HTMLElement>('[data-story-copy]')!
        const stage = section.querySelector<HTMLElement>('[data-story-stage]')!
        const left = section.querySelector<HTMLElement>('[data-hand="left"]')!
        const right = section.querySelector<HTMLElement>('[data-hand="right"]')!
        const lines = gsap.utils.toArray<HTMLElement>('[data-statement-line]', section)
        const amount = section.querySelector<HTMLElement>('[data-amount]')!
        const strong = getComputedStyle(section).getPropertyValue('--color-strong').trim()
        const frozen = devPhase()
        // CSS dims the paragraphs; each word then animates to #111 from that inherited colour.
        section.dataset.animate = ''

        // Phase A: the highlight. Each unit fades over `softness` units of scroll, one unit after another.
        const H = STORY.highlight
        SplitText.create(copy.querySelectorAll('p'), {
          type: H.by,
          autoSplit: true,
          aria: 'auto',
          onSplit(self) {
            const units = H.by === 'lines' ? self.lines : self.words
            const tl = gsap.timeline({
              paused: !!frozen,
              scrollTrigger: frozen ? undefined : { trigger: copy, start: H.start, end: H.end, scrub: H.scrub },
            })
            tl.to(units, { color: strong, duration: H.softness, ease: 'none', stagger: 1 }, 0)
            if (frozen) tl.progress(frozen === 'a' ? 0 : 1)
            // Returned so SplitText reverts it before re-splitting.
            return tl
          },
        })

        // Phase B: the pinned hands and statement, 0 → 1 over the pin.
        const { pin: P, hands: K, statement: S } = STORY
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          paused: !!frozen,
          scrollTrigger: frozen
            ? undefined
            : {
                trigger: stage,
                start: P.start,
                end: () => `+=${window.innerHeight * P.length}`,
                pin: section,
                scrub: P.scrub,
                invalidateOnRefresh: true,
              },
        })
        // A fresh object per tween: fromTo stores its from-values on the to-vars (startAt).
        const handsIn = () => ({ x: 0, rotate: 0, duration: K.to - K.from, ease: K.ease })
        // Fully off screen: the left hand's right edge (its tip) and the right hand's left edge (its
        // palm) end up `offscreen` px past the section's edges. offsetLeft ignores transforms.
        tl.fromTo(left, { x: () => -(left.offsetLeft + left.offsetWidth + K.offscreen), rotate: K.rotate ? K.rotateLeft : 0 }, handsIn(), K.from)
        tl.fromTo(right, { x: () => section.clientWidth - right.offsetLeft + K.offscreen, rotate: K.rotate ? K.rotateRight : 0 }, handsIn(), K.from)
        // Opacity, not autoAlpha: visibility: hidden would drop the heading from screen readers until it's in.
        tl.fromTo(lines, { opacity: 0, y: S.rise }, { opacity: 1, y: 0, duration: S.line, stagger: S.stagger, ease: S.ease }, S.from)
        // The amount sits in line 2 and finishes after every line.
        const amountAt = S.from + S.stagger
        tl.fromTo(amount, { opacity: 0, scale: S.amountScale }, { opacity: 1, scale: 1, duration: S.to - amountAt, ease: S.ease }, amountAt)
        // Hold to the end of the pin.
        tl.set({}, {}, 1)
        if (frozen) tl.progress(frozen === 'end' ? 1 : frozen === 'b' ? K.to : 0)

        return () => {
          delete section.dataset.animate
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} data-story className="relative z-10 overflow-clip bg-soft pt-[130px] pb-[195.2px]">
      {/* 690 wide, centred; Figma separates the paragraphs with an empty line (1.4em, 44.8px). */}
      <div data-story-copy className="mx-auto w-[690px] max-w-[calc(100%-2*var(--spacing-gutter))] text-center text-lead-lg text-strong [&>p+p]:mt-[1.4em]">
        <p>
          Owning property or investing in a business can feel out of reach when it requires substantial capital,
          specialist knowledge, and time to manage.
        </p>
        <p>We created Fraqshares to make that starting point smaller.</p>
        <p>
          By dividing ownership into shares, we connect investors with opportunities across real estate, land, and
          businesses. You choose the investments that suit your goals, while professional managers oversee the
          underlying assets and operations.
        </p>
      </div>

      {/* The pinned group (Figma y 636 → 1289): the hands row, then the statement. The row starts at
          636, overlapping the paragraphs' box (130 + 10 lines and 2 blank ones at 44.8 = 667.6) by 31.6. */}
      <div data-story-stage className="-mt-[31.6px]">
        <div data-story-hands aria-hidden="true">
          <img
            data-hand="left"
            src={handLeft.src}
            srcSet={handLeft.srcset}
            sizes="max(900px, 62.5vw)"
            width={900}
            height={369.4}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <img
            data-hand="right"
            src={handRight.src}
            srcSet={handRight.srcset}
            sizes="max(900px, 62.5vw)"
            width={900}
            height={372}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Figma y 1079, 616 wide. Its three lines are part of the design ("Start with as little as /
            ₦25,000 and build your / portfolio over time."), so they're set here rather than split at
            runtime; each animates on its own. */}
        <h2 className="mx-auto mt-[71px] w-[616px] max-w-[calc(100%-2*var(--spacing-gutter))] text-center text-statement-h2 text-strong">
          <span data-statement-line className="block">
            Start with as little as
          </span>{' '}
          <span data-statement-line className="block">
            <span data-amount className="inline-block text-olive">
              {MIN_INVESTMENT}
            </span>{' '}
            and build your
          </span>{' '}
          <span data-statement-line className="block">
            portfolio over time.
          </span>
        </h2>
      </div>
    </section>
  )
}
