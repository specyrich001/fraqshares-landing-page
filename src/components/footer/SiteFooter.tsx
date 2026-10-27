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
        <div className="page-row">
          {/* CTA banner, 1280 × 546. Bottom to top: zigzag strip, phone, text. */}
          <div className="relative h-[546px] overflow-hidden bg-olive">
            {/* Figma 10994:214 (already upright), its shapes joined into one path so no seams show between
                them. 1440 wide and centred on the page, so the banner crops 80px each side. */}
            <img
              src={zigzag}
              width={1439.57}
              height={89.8956}
              alt=""
              className="pointer-events-none absolute bottom-0 left-1/2 h-[89.8956px] w-[1439.57px] max-w-none -translate-x-1/2"
            />
            {/* 490 wide at (650, 8). Figma's 546 tall runs 8px past the banner; that part is never seen,
                so the image stops at the banner edge (538). Transparency recovered from the original. */}
            <img
              src={phone.src}
              srcSet={`${phone.src} 1x, ${phone.src2x} 2x`}
              width={phone.width}
              height={phone.height}
              alt=""
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute top-2 left-[650px] h-[538px] w-[490px] max-w-none"
            />
            <div className="absolute top-[109px] left-[127px] flex w-[404px] flex-col items-start gap-10 max-md:right-gutter max-md:left-gutter max-md:w-auto">
              <h2 className="text-conversion-headline text-dark">
                <span className="text-dark/50">Own a share.</span> Expand your possibilities.
              </h2>
              {/* Section 3's outline button: 17px + 1px border = 18px, 10px to the arrow (Figma) → 180 wide. */}
              <a
                href="#get-started"
                className={`${buttonBase} h-13 gap-2.5 border border-black px-[17px] text-black hover:bg-black hover:text-white ${focusRing}`}
              >
                Start Investing
                <ArrowRightIcon className="shrink-0" />
              </a>
            </div>
          </div>

          <div className="mt-[100px] flex flex-col gap-[50px]">
            <div className="flex flex-wrap items-start justify-between gap-[50px]">
              <a href="/" aria-label="Fraqshares home" className={`shrink-0 ${focusRingOnDark}`}>
                <img src={logoFooter} width={200} height={34.1271} alt="" className="block h-[34.1271px] w-[200px]" />
              </a>

              <div className="flex w-[679px] max-w-full flex-col gap-[50px]">
                <nav aria-label="Footer" className="flex flex-wrap gap-x-24 gap-y-[50px]">
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

                <div className="flex flex-col gap-6 text-body text-step-body">
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

            <div className="flex min-h-7 flex-wrap items-center justify-between gap-6">
              <p className="flex items-center gap-[7px] opacity-80">
                <img src={copyrightIcon} width={20} height={20} alt="" className="shrink-0" />
                <span className="text-footer-link font-medium tracking-[-0.03em] text-footer-muted">
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
