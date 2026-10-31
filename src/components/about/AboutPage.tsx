import { SiteFooter } from '../footer/SiteFooter.tsx'
import { SiteHeader } from '../SiteHeader.tsx'
import { useSmoothScroll } from '../../motion/useSmoothScroll.ts'
import { AboutBackdrop } from './AboutBackdrop.tsx'
import { AboutIntro } from './AboutIntro.tsx'
import { AboutLinks } from './AboutLinks.tsx'
import { AboutMission } from './AboutMission.tsx'
import { AboutOwnership } from './AboutOwnership.tsx'
import { AboutStory } from './AboutStory.tsx'
import { AboutValues } from './AboutValues.tsx'

/** /about (about/index.html). The plain white header (About marked current), sections, the footer. */
export function AboutPage() {
  useSmoothScroll()

  return (
    <>
      <SiteHeader />
      {/* Below 1024 the page loads DM Sans with its opsz axis, which the browser sizes automatically
          (about/index.html). The About mobile frames, unlike the home page's, are drawn at opsz 14:
          Figma 11074:45129's 42px H1 measures 270px of ink for "Building wealth", opsz 14 gives ~270 and
          auto (opsz 40 at that size) 243. So the About content is held at 14; header and footer stay as
          on the home page.
          overflow-x clip (not hidden: no scroll container, so pins and sticky still work): nothing may
          widen the page. A phone browser zooms out to fit anything wider than the screen, which shrinks
          the whole page and stretches the viewport ScrollTrigger measures pins against. */}
      <main className="overflow-x-clip max-lg:[font-variation-settings:'opsz'_14]">
        <AboutIntro />
        <AboutBackdrop>
          <AboutStory />
          <AboutMission />
        </AboutBackdrop>
        <AboutValues />
        <AboutOwnership />
        <AboutLinks />
      </main>
      <SiteFooter />
    </>
  )
}
