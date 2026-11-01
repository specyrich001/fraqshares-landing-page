import { SiteFooter } from '../footer/SiteFooter.tsx'
import { LinkCardsSection, type LinkCard } from '../linkCards/LinkCardsSection.tsx'
import { SiteHeader } from '../SiteHeader.tsx'
import { CONTACT_HREF, FAQ_HREF, LOGIN_URL } from '../siteLinks.ts'
import { useSmoothScroll } from '../../motion/useSmoothScroll.ts'
import { GlossaryIntro } from './GlossaryIntro.tsx'
import { GlossarySection } from './GlossarySection.tsx'

// Listings opens the web app's log in (the listings are behind it).
// Listings' description has no final period, as supplied.
const LINK_CARDS: LinkCard[] = [
  {
    title: 'FAQs',
    body: 'Find answers about getting started, ownership, fees, returns, and selling your shares.',
    label: 'Explore FAQs',
    href: FAQ_HREF,
  },
  {
    title: 'Listings',
    body: 'Explore fractional investment opportunities in real estate, land, and businesses with Fraqshares',
    label: 'Explore Investment Opportunities',
    href: LOGIN_URL,
  },
  {
    title: 'Still Have Questions?',
    body: 'We’re here to help you understand how Fraqshares works.',
    label: 'Contact Us',
    href: CONTACT_HREF,
  },
]

/** /glossary (glossary/index.html). The plain white header (Glossary isn't in the nav, so nothing is
 *  marked current), the intro, the term list with its filters, the closing link cards, the footer. Prerendered at build
 *  (vite.config.ts) so the terms are in the HTML. */
export function GlossaryPage() {
  useSmoothScroll()

  return (
    <>
      <SiteHeader />
      {/* As on the About page (AboutPage): nothing may widen the page, and below 1024 the text is held
          at DM Sans opsz 14, as the About mobile frames are drawn, so PageIntro looks the same on both. */}
      <main className="overflow-x-clip max-lg:[font-variation-settings:'opsz'_14]">
        <GlossaryIntro />
        <GlossarySection />
        {/* Figma 11100:112333 (mobile 11107:113154). "Put Your Knowledge / Into Practice." at 575 wide. */}
        <LinkCardsSection
          id="glossary-links-title"
          heading={
            <>
              <span className="text-muted">Put Your Knowledge</span> Into Practice.
            </>
          }
          headingClassName="w-[575px]"
          cards={LINK_CARDS}
        />
      </main>
      <SiteFooter />
    </>
  )
}
