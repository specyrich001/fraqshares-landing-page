import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import discountIcon from '../../assets/icons/discount-shape.svg'
import images from '../../generated/images.json'
import { CardStack } from '../product/CardStack.tsx'
import { OWNERSHIP, OWNERSHIP_MEDIA } from './ownershipTiming.ts'
import { revealLines } from './revealLines.ts'
import './about-ownership.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Figma 11062:31693: a crop of the 2000 × 1333 original, 541 × 628 (and 2x). */
const photo = images['about/ownership-photo']
/** Figma 11065:45055: the café photo, centre-cropped square (its fill is "fill"). */
const thumb = images['about/card-thumb-cafe']

/** DEV: ?speed=0.5 plays the entrance at half speed (as on the hero). */
const devSpeed = () => (import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('speed')) || 1 : 1)

/**
 * About section 5, Figma: Desktop - 24 (11053:31692), 1440 × 888, under section 4. Timings:
 * ownershipTiming.ts.
 *
 * 130px above and below a 628px row: the photo (541 × 628) with homepage section 2's card stack on it
 * (CardStack, front card at (71, 256)), 80px, then the text column (640 wide): the heading at the top,
 * the paragraphs at the bottom.
 *
 * Entrance, once, when the section is 35% on screen: the heading's lines slide up out of their masks,
 * the paragraphs rise in; on the photo the back card rises in, the front card bounces onto it and its
 * content fills in, then the back card's amount pulses. The back card's blur is on the element that
 * moves and fades (never on an ancestor of it), so it stays frosted throughout.
 *
 * Reduced motion and no JS: the final state from the start. Only transform and opacity animate.
 * relative z-10 + white: the last section, so the footer reveal slides it up off the footer.
 */
export function AboutOwnership() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(OWNERSHIP_MEDIA, (context) => {
        const section = sectionRef.current!
        const q = <T extends HTMLElement = HTMLElement>(s: string) => section.querySelector<T>(s)!
        const heading = q('[data-ownership-title]')
        const paras = gsap.utils.toArray<HTMLElement>('[data-ownership-copy] > p', section)
        const photoEl = q('[data-ownership-photo]')
        const back = q('[data-stack-card=back]')
        const front = q('[data-stack-card=front]')
        const thumbEl = q('[data-stack-thumb]')
        const frontText = gsap.utils.toArray<HTMLElement>('.product-title, .product-detail', front)
        const amount = q('[data-tx-amount]')
        const backOpacity = parseFloat(getComputedStyle(back).opacity)
        const O = OWNERSHIP

        // Hidden until it plays (the section is far below the fold, so this lands before it's seen).
        gsap.set([back, front, thumbEl, ...frontText], { opacity: 0 })

        const play = context.add('play', () => {
          const { split, tween: lines } = revealLines(heading, {
            from: { yPercent: 100 },
            mask: true,
            duration: O.heading.duration,
            ease: O.heading.ease,
            stagger: O.heading.stagger,
          })
          gsap.set(heading, { opacity: 1 })
          const tl = gsap.timeline({ onComplete: () => split.revert() })
          tl.timeScale(devSpeed())
          tl.add(lines, O.heading.at)

          const P = O.paragraphs
          tl.fromTo(paras, { opacity: 0, y: P.rise }, { opacity: 1, y: 0, duration: P.duration, ease: P.ease, stagger: P.stagger }, P.at)

          const I = O.image
          if (I.enabled) tl.fromTo(photoEl, { opacity: 0, scale: I.fromScale }, { opacity: 1, scale: 1, duration: I.duration, ease: I.ease }, I.at)

          const B = O.back
          tl.fromTo(back, { opacity: 0, y: B.rise }, { opacity: backOpacity, y: 0, duration: B.duration, ease: B.ease }, B.at)

          const F = O.front
          tl.fromTo(
            front,
            { opacity: 0, y: F.rise, scale: F.fromScale, transformOrigin: '50% 100%' },
            { opacity: 1, y: 0, scale: 1, duration: F.duration, ease: F.ease },
            F.at,
          )

          const C = O.content
          tl.fromTo(thumbEl, { opacity: 0, scale: C.thumbScale }, { opacity: 1, scale: 1, duration: C.duration, ease: C.ease }, C.at)
          tl.fromTo(
            frontText,
            { opacity: 0, y: C.rise },
            { opacity: 1, y: 0, duration: C.duration, ease: C.ease, stagger: C.stagger },
            C.at + C.stagger,
          )

          const A = O.amount
          tl.to(amount, { keyframes: { scale: [A.peak, 1], easeEach: A.ease }, duration: A.duration, ease: 'none' }, A.at)
        }) as () => void
        ScrollTrigger.create({ trigger: section, start: O.start, once: true, onEnter: play })
        // DEV: window.ownershipReplay() plays the entrance again (its fromTo tweens reset each part).
        if (import.meta.env.DEV) Object.assign(window, { ownershipReplay: play })
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} data-ownership aria-labelledby="ownership-title" className="relative z-10 bg-white py-[130px]">
      <div className="page-row">
        {/* 541 + 80 + 640 = 1261 of the 1280 row, as in Figma. */}
        <div className="flex items-center gap-20">
          <div className="relative h-[628px] w-[541px] shrink-0 overflow-hidden">
            <img
              data-ownership-photo
              src={photo.src}
              srcSet={photo.srcset}
              sizes="541px"
              width={photo.width}
              height={photo.height}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
            />
            {/* Front card's box at (71, 256), back card's at (85.44, 297.99): Figma 11065:45044. */}
            <CardStack
              thumbnail={thumb}
              title="New business added to portfolio"
              meta="Investment update"
              backIcon={discountIcon}
              backAmount="+₦250,000"
              className="top-[256px] left-[71px]"
            />
          </div>

          <div className="flex h-[628px] w-[640px] flex-col justify-between">
            {/* "A clearer path / to ownership." at 464 wide. */}
            <h2 id="ownership-title" data-ownership-title className="w-[464px] text-display-lg text-strong">
              A clearer path to ownership.
            </h2>
            {/* One empty 18px line between paragraphs (1.4em). */}
            <div data-ownership-copy className="text-intro-body-tight text-body-muted [&>p+p]:mt-[1.4em]">
              <p>
                Each listed asset or business is held through a dedicated Special Purpose Vehicle (SPV). Your
                investment gives you a proportional stake in that SPV, with your ownership rights set out in the
                investment documents.
              </p>
              <p>
                Depending on the opportunity, you may receive rental income or distributions from business earnings.
                You may also benefit if the value of your shares increases.
              </p>
              <p>
                Returns are not guaranteed, and investment values can fall. Selling your shares is subject to any
                required holding period and a buyer matching your offer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
