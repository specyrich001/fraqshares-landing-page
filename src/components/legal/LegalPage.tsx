import type { LegalDocument } from '../../content/legal/types.ts'
import { SiteFooter } from '../footer/SiteFooter.tsx'
import { LinkCardsSection, type LinkCard } from '../linkCards/LinkCardsSection.tsx'
import { SiteHeader } from '../SiteHeader.tsx'
import { CONTACT_HREF, FAQ_HREF, GLOSSARY_HREF } from '../siteLinks.ts'
import { useSmoothScroll } from '../../motion/useSmoothScroll.ts'
import { LegalContent } from './LegalContent.tsx'
import { LegalHero } from './LegalHero.tsx'

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
    title: 'Still Have Questions?',
    body: 'We’re here to help you understand how Fraqshares works.',
    label: 'Contact Us',
    href: CONTACT_HREF,
  },
]

/** /privacy-policy and /terms-and-conditions (each <name>/index.html): the plain white header, the hero,
 *  the document's text, the closing link cards, the footer. Prerendered at build (vite.config.ts), so
 *  the text is in the HTML. */
export function LegalPage({ document }: { document: LegalDocument }) {
  useSmoothScroll()

  return (
    <>
      <SiteHeader />
      {/* As on the other inner pages: below 1024 the text is held at DM Sans opsz 14. */}
      <main className="overflow-x-clip max-lg:[font-variation-settings:'opsz'_14]">
        <LegalHero document={document} />
        <LegalContent document={document} />
        {/* Figma 11126:116296 / 11126:115832: the Contact page's heading, About's cards. */}
        <LinkCardsSection
          id="legal-links-title"
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
