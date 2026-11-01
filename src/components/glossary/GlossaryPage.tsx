import { SiteFooter } from '../footer/SiteFooter.tsx'
import { SiteHeader } from '../SiteHeader.tsx'
import { useSmoothScroll } from '../../motion/useSmoothScroll.ts'
import { GlossaryIntro } from './GlossaryIntro.tsx'
import { GlossarySection } from './GlossarySection.tsx'

/** /glossary (glossary/index.html). The plain white header (Glossary isn't in the nav, so nothing is
 *  marked current), the intro, the term list with its filters, the footer. Prerendered at build
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
      </main>
      <SiteFooter />
    </>
  )
}
