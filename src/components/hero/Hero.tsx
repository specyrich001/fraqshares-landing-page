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
  return (
    <section
      id="hero"
      data-hero
      aria-labelledby="hero-title"
      className="relative flex min-h-[max(100svh,704px)] flex-col justify-end overflow-hidden bg-black"
    >
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

      {/* 4. Content, on the bottom: 130px under the buttons (Figma). The top padding only keeps it clear
          of the 88px header when the text wraps tall (narrow screens, zoom). */}
      <div data-hero-content className="page-row relative pt-[128px] pb-[130px]">
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

      <div aria-hidden="true" className={photoBox}>
        <HeroActivityFeed className={feedPosition} />
      </div>
    </section>
  )
}
