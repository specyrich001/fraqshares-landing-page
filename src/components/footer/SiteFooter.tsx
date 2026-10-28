import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import copyrightIcon from '../../assets/icons/copyright.svg'
import zigzag from '../../assets/footer-zigzag.svg'
import logoFooter from '../../assets/logo-footer.svg'
import images from '../../generated/images.json'
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx'
import { buttonBase, focusRing, focusRingOnDark } from '../linkStyles.ts'
import { STAGE_MEDIA } from '../stage/stageTiming.ts'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from './SocialIcons.tsx'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const phone = images['footer/phone-hand']
const phoneMobile = images['footer/phone-hand-mobile']
/** Read once when the page loads. */
const year = new Date().getFullYear()

// PLACEHOLDER hrefs: none of these pages exist yet.
const columns = [
  { heading: 'Products', links: ['Listings', 'Investments'] },
  { heading: 'Company', links: ['About Us', 'Terms & Conditions', 'Privacy Policy'] },
  { heading: 'Support', links: ['Blog', 'Community'] },
]

const socials = [
  { label: 'Fraqshares on X (Twitter)', Icon: TwitterIcon },
  { label: 'Fraqshares on Facebook', Icon: FacebookIcon },
  { label: 'Fraqshares on LinkedIn', Icon: LinkedinIcon },
  { label: 'Fraqshares on Instagram', Icon: InstagramIcon },
]

/** Takes no height: Figma draws its 1px rules in the row above, so the 50px gaps stay 50px. */
const divider = <div aria-hidden="true" className="-mt-px w-full border-t border-white/8" />

/**
 * Figma: Desktop - 17 (10810:75866), 1440 × 1642. CTA banner, then the main footer, in the page's
 * 1280 row. Static content.
 *
 * Reveal: the FAQ (z-10 above it) slides up off the footer like a curtain. While the footer's slot
 * travels from the bottom of the viewport to the top, the footer is shifted up by exactly the
 * distance still to go, so its top stays pinned to the viewport top and the FAQ uncovers it; then
 * it scrolls on normally. A transform, not position: sticky, because the footer is taller than the
 * viewport (sticky bottom would reveal its bottom first). The wrapper is the untransformed trigger,
 * dark so nothing light can show past the shifted footer. Static under 1024px and for reduced motion.
 *
 * Mobile, below 1024px (Figma 11006:49360, 393 × 2029): one 345px column (24px padding, capped at
 * 560 on tablets). The banner is 604 tall with its text centred, Figma's own phone crop and the same
 * zigzag; the main footer stacks logo, link columns (wrapping), legal text and the bottom row.
 */
export function SiteFooter() {
  const revealRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(STAGE_MEDIA, () => {
        const wrap = revealRef.current!
        const footer = wrap.querySelector('footer')!
        gsap.fromTo(
          footer,
          { y: () => -window.innerHeight },
          {
            y: 0,
            ease: 'none',
            // scrub: true (no catch-up lag), so the footer holds perfectly still behind the FAQ.
            scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
          },
        )
        return () => gsap.set(footer, { clearProps: 'transform,translate' })
      })
    },
    { scope: revealRef },
  )

  return (
    <div ref={revealRef} data-footer-reveal className="bg-dark">
      <footer className="bg-dark py-[100px]">
        <div className="page-row max-lg:max-w-[560px] max-lg:px-6">
          {/* CTA banner, 1280 × 546 (mobile 345 × 604). Bottom to top: zigzag strip, phone, text. */}
          <div className="relative h-[546px] overflow-hidden bg-olive max-lg:h-[604px]">
            {/* Figma 10994:214 (already upright), its shapes joined into one path so no seams show between
                them. 1440 wide and centred on the page, so the banner crops 80px each side. Mobile: the
                same strip centred on the banner (Figma 11006:49362, left −547). */}
            <img
              src={zigzag}
              width={1439.57}
              height={89.8956}
              alt=""
              className="pointer-events-none absolute bottom-0 left-1/2 h-[89.8956px] w-[1439.57px] max-w-none -translate-x-1/2"
            />
            {/* 490 wide at (650, 8). Figma's 546 tall runs 8px past the banner; that part is never seen,
                so the image stops at the banner edge (538). Transparency recovered from the original.
                Mobile: Figma's own crop (11006:49364), 253 × 307, centred on the banner's bottom edge. */}
            <picture>
              <source media="(max-width: 1023px)" srcSet={`${phoneMobile.src} 1x, ${phoneMobile.src2x} 2x`} />
              <img
                src={phone.src}
                srcSet={`${phone.src} 1x, ${phone.src2x} 2x`}
                width={phone.width}
                height={phone.height}
                alt=""
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute top-2 left-[650px] h-[538px] w-[490px] max-w-none max-lg:top-auto max-lg:bottom-0 max-lg:left-1/2 max-lg:h-[307px] max-lg:w-[253px] max-lg:-translate-x-1/2"
              />
            </picture>
            {/* Mobile: 243 wide and centred, 50px from the top (Figma 11006:49365). */}
            <div className="absolute top-[109px] left-[127px] flex w-[404px] flex-col items-start gap-10 max-lg:top-[50px] max-lg:left-1/2 max-lg:w-[243px] max-lg:-translate-x-1/2 max-lg:items-center">
              <h2 className="text-conversion-headline text-dark max-lg:text-center max-lg:text-conversion-headline-mobile">
                <span className="text-dark/50">Own a share.</span> Expand your possibilities.
              </h2>
              {/* Section 3's outline button: 17px + 1px border = 18px, 10px to the arrow (Figma) → 180 wide.
                  Mobile: 162 × 48 with the 14px label (Figma 11006:49367). */}
              <a
                href="#get-started"
                className={`${buttonBase} h-13 gap-2.5 border border-black px-[17px] text-black hover:bg-black hover:text-white max-lg:h-12 max-lg:text-button-sm ${focusRing}`}
              >
                Start Investing
                <ArrowRightIcon className="shrink-0 max-lg:size-5" />
              </a>
            </div>
          </div>

          {/* Mobile: 80px below the banner; logo, 40px, the columns (40px between wrapped rows). */}
          <div className="mt-[100px] flex flex-col gap-[50px] max-lg:mt-20">
            <div className="flex flex-wrap items-start justify-between gap-[50px] max-lg:flex-col max-lg:flex-nowrap max-lg:gap-10">
              <a href="/" aria-label="Fraqshares home" className={`shrink-0 ${focusRingOnDark}`}>
                <img src={logoFooter} width={200} height={34.1271} alt="" className="block h-[34.1271px] w-[200px] max-lg:h-[25.5953px] max-lg:w-[150px]" />
              </a>

              <div className="flex w-[679px] max-w-full flex-col gap-[50px]">
                {/* Mobile: Products and Company share the first row (Figma: 96px apart); on phones narrower than 393
                    the gap gives way first (Products 91 + Company 146 + a little slack = 240), so they still do. */}
                <nav aria-label="Footer" className="flex flex-wrap gap-x-24 gap-y-[50px] max-lg:gap-x-[min(96px,calc(100%-240px))] max-lg:gap-y-10">
                  {columns.map(({ heading, links }) => (
                    <div key={heading} className="flex flex-col gap-4">
                      <h2 className="text-footer-heading text-mint">{heading}</h2>
                      {/* Type on the list too, so each item's line box is the link's 22.4px, not the body's 24. */}
                      <ul role="list" className="flex flex-col gap-4 text-footer-link">
                        {links.map((label) => (
                          <li key={label}>
                            <a
                              href="#"
                              className={`text-mint/50 transition-colors duration-150 hover:text-mint focus-visible:text-mint motion-reduce:transition-none ${focusRingOnDark}`}
                            >
                              {label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>

                {divider}

                {/* Paragraphs a blank line apart (1.5em: 24px, mobile 21px as Figma's empty lines). */}
                <div className="flex flex-col gap-6 text-body text-step-body max-lg:gap-[21px] max-lg:text-legal-mobile">
                  <p>
                    Fraqshares makes fractional ownership in real estate, land, and businesses more accessible to
                    Africans at home and abroad. Discover opportunities to diversify your portfolio without purchasing
                    an entire asset.
                  </p>
                  <p>
                    Fraqshares is owned and operated by FRAQTECH GLOBAL LIMITED (RC: 9623748), a company registered with
                    Nigeria’s Corporate Affairs Commission (CAC). Access to investment opportunities is subject to
                    eligibility requirements and applicable laws.
                  </p>
                  <p>
                    <strong className="font-bold">Investment Risk Disclosure</strong>
                  </p>
                  <p>
                    All investments involve risk, including the possible loss of some or all of your capital. Income,
                    appreciation, and returns are not guaranteed. Past performance does not guarantee future results, and
                    projected returns are estimates only. Selling your investment depends on applicable restrictions and
                    buyer availability.
                  </p>
                  <p>
                    Information from third parties is believed to be reliable, but its accuracy and completeness cannot
                    be guaranteed. Review each opportunity’s investment documents, fees, and risks before investing.
                  </p>
                </div>
              </div>
            </div>

            {divider}

            {/* Mobile: stacked, 32px apart, left-aligned; the copyright line at 14px (Figma 11006:49417). */}
            <div className="flex min-h-7 flex-wrap items-center justify-between gap-6 max-lg:flex-col max-lg:items-start max-lg:gap-8">
              <p className="flex items-center gap-[7px] opacity-80">
                <img src={copyrightIcon} width={20} height={20} alt="" className="shrink-0" />
                <span className="text-footer-link font-medium tracking-[-0.03em] text-footer-muted max-lg:text-legal-mobile max-lg:leading-[normal]">
                  {year} Fraqshares. All Rights Reserved
                </span>
              </p>
              <ul role="list" className="flex items-center gap-4">
                {socials.map(({ label, Icon }) => (
                  <li key={label} className="flex">
                    {/* PLACEHOLDER href: profile URLs not supplied yet. */}
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener"
                      aria-label={label}
                      className={`text-olive transition-colors duration-150 hover:text-mint focus-visible:text-mint motion-reduce:transition-none ${focusRingOnDark}`}
                    >
                      <Icon className="block" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
