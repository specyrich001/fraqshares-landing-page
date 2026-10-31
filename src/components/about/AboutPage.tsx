import { SiteFooter } from '../footer/SiteFooter.tsx'
import { SiteHeader } from '../SiteHeader.tsx'
import { useSmoothScroll } from '../../motion/useSmoothScroll.ts'
import { AboutBackdrop } from './AboutBackdrop.tsx'
import { AboutIntro } from './AboutIntro.tsx'
import { AboutMission } from './AboutMission.tsx'
import { AboutStory } from './AboutStory.tsx'

/** /about (about/index.html). The plain white header (About marked current), sections, the footer. */
export function AboutPage() {
  useSmoothScroll()

  return (
    <>
      <SiteHeader />
      <main>
        <AboutIntro />
        <AboutBackdrop>
          <AboutStory />
          <AboutMission />
        </AboutBackdrop>
      </main>
      <SiteFooter />
    </>
  )
}
