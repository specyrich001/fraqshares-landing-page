import { SiteFooter } from '../footer/SiteFooter.tsx'
import { LinkCardsSection, type LinkCard } from '../linkCards/LinkCardsSection.tsx'
import { SiteHeader } from '../SiteHeader.tsx'
import { FAQ_HREF, GLOSSARY_HREF, LOGIN_URL } from '../siteLinks.ts'
import { useSmoothScroll } from '../../motion/useSmoothScroll.ts'
import { ContactHero } from './ContactHero.tsx'

// No Contact card here. Listings opens the web app's log in, as on the Glossary page (the listings are
// behind it); its description has no final period, as supplied.
const LINK_CARDS: LinkCard[] = [
  {
    title: 'FAQs',
    body: 'Find answers about getting started, ownership, fees, returns, and selling your shares.',
    label: 'Explore FAQs',
    href: FAQ_HREF,
  },
  {
    title: 'Glossary',
    body: 'Get familiar with the terms used in fractional investing, from shares and SPVs to distributions and valuations.',
    label: 'Explore Glossary',
    href: GLOSSARY_HREF,
  },
  {
    title: 'Listings',
    body: 'Explore fractional investment opportunities in real estate, land, and businesses with Fraqshares',
    label: 'Explore Investment Opportunities',
    href: LOGIN_URL,
  },
]

/** /contact (contact/index.html). The plain white header (Contact isn't in the nav), the hero with the
 *  form, the closing link cards, the footer. Prerendered at build (vite.config.ts), so the form works
 *  without JS. */
export function ContactPage() {
  useSmoothScroll()

  return (
    <>
      <SiteHeader />
      {/* As on About and Glossary: below 1024 the text is held at DM Sans opsz 14, as the mobile frames
          are drawn. */}
      <main className="overflow-x-clip max-lg:[font-variation-settings:'opsz'_14]">
        <ContactHero />
        {/* Figma 11102:112965: About's heading and cards, minus Contact. */}
        <LinkCardsSection
          id="contact-links-title"
          heading={
            <>
              <span className="text-muted">Build Your</span> Investment Portfolio with Fraqshares.
            </>
          }
          headingClassName="w-[717px]"
          cards={LINK_CARDS}
        />
      </main>
      <SiteFooter />
    </>
  )
}
