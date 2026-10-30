import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import images from '../../generated/images.json'
import { EXPAND, EXPAND_MEDIA, PHOTO_ASPECT } from './expandTiming.ts'
import './expanding-photo.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Figma 11049:450's fill: the 2000 × 1125 original (the largest there is), as 1440 / 1920 / 2000w. */
const photo = images['about/intro-photo']

/**
 * About section 1's photo, 1280 × 628 in the page row (Figma 11049:450), opening to the full window
 * width as it scrolls into view (ratio kept, so it grows taller too). See expanding-photo.css for the
 * two layouts. Only clip-path (and, with EXPAND.parallax, the image's scale) animate; no pin.
 *
 * The bleed is the window's clientWidth, not 100vw, which counts the scrollbar on Windows and would
 * scroll sideways. Sizes are measured on every ScrollTrigger refresh (load, fonts, resize).
 * Static for reduced motion and without JS.
 */
export function ExpandingPhoto({ className = '' }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(EXPAND_MEDIA, () => {
        const box = boxRef.current!
        const bleed = box.querySelector<HTMLElement>('[data-bleed]')!
        const img = bleed.querySelector('img')!
        // Insets that cut the full-bleed photo back to the box, in px.
        const inset = { top: 0, right: 0, left: 0 }

        const measure = () => {
          const r = box.getBoundingClientRect()
          const width = document.documentElement.clientWidth
          const height = width / PHOTO_ASPECT
          inset.left = r.left
          inset.right = width - r.right
          inset.top = (height - r.height) / 2
          box.style.setProperty('--bleed-left', `${inset.left}px`)
          box.style.setProperty('--bleed-y', `${inset.top}px`)
          box.style.setProperty('--bleed-w', `${width}px`)
          box.style.setProperty('--bleed-h', `${height}px`)
        }
        measure()
        box.dataset.expand = ''
        ScrollTrigger.addEventListener('refreshInit', measure)

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: box,
            start: EXPAND.start,
            end: EXPAND.end,
            scrub: EXPAND.scrub,
            invalidateOnRefresh: true,
          },
        })
        // Four explicit values both ways: the browser shortens computed insets ("inset(39px 80px)"),
        // and GSAP would pair the wrong numbers.
        tl.fromTo(
          bleed,
          { clipPath: () => `inset(${inset.top}px ${inset.right}px ${inset.top}px ${inset.left}px)` },
          { clipPath: 'inset(0px 0px 0px 0px)' },
          0,
        )
        if (EXPAND.parallax) tl.fromTo(img, { scale: EXPAND.parallaxFrom }, { scale: 1 }, 0)

        return () => {
          ScrollTrigger.removeEventListener('refreshInit', measure)
          delete box.dataset.expand
          gsap.set(bleed, { clearProps: 'clipPath' })
          gsap.set(img, { clearProps: 'transform,scale' })
        }
      })
    },
    { scope: boxRef },
  )

  return (
    <div ref={boxRef} data-expanding-photo className={className}>
      <div data-bleed>
        {/* Decorative: the heading and paragraphs carry the message. Above the fold at 1440, so eager. */}
        <img
          src={photo.src}
          srcSet={photo.srcset}
          sizes="100vw"
          width={photo.width}
          height={photo.height}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="size-full max-w-none object-cover"
        />
      </div>
    </div>
  )
}
