import type { ReactNode } from 'react'
import images from '../../generated/images.json'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { buttonBase, focusRingOnDark } from '../linkStyles.ts'
import { HeroActivityFeed } from './HeroActivityFeed.tsx'

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
 * Activity feed: positioned on the section, tracking the phone so its dot stays on it.
 * The phone sits at 1315px into the rendered image (u = 1315 / 1772.9 = 74.17%), so its x is
 *   up to 1773px wide: 1315px − 52.27% × (1772.9px − section width)
 *   wider:             74.17% × section width
 * and the feed's left is that minus 153px (dot centre within the feed). At 1440 → 988px.
 * Its top keeps the dot on the phone's row: 74.05% − 479px → 203px at 921.
 * Hidden below 1200px, where it would run off the right edge (mobile design pending).
 */
const feedPosition =
  'left-[max(calc(1162px_-_0.5227_*_(1772.9px_-_100%)),calc(74.17%_-_153px))] top-[calc(74.05%_-_479px)]'

/**
 * `transitionMedia` renders above the photo layers and below the content: the hero → section-2
 * scroll transition puts its copy of the section-2 photo there. data-hero-* attributes are its hooks.
 */
export function Hero({ transitionMedia }: { transitionMedia?: ReactNode }) {
  return (
    <section id="hero" data-hero aria-labelledby="hero-title" className="relative min-h-[921px] overflow-hidden bg-black">
      {/* 1. Photo (LCP): eager + high priority. Rendered width is max(100vw, 1773px) at desktop height. */}
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

      {/* 4. Content: 401px = 88px header + Figma's 313px to the headline. */}
      <div data-hero-content className="page-row relative pt-[401px] pb-20">
        <div className="max-w-[638px]">
          <h1 id="hero-title" className="text-hero-h1 text-white">
            Buy, sell, and
            <br />
            own shares in real estate &amp; businesses
          </h1>
          <p className="mt-[18px] max-w-[557px] text-body-main text-white/70">
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

      <HeroActivityFeed className={`absolute hidden min-[1200px]:block ${feedPosition}`} />
    </section>
  )
}
