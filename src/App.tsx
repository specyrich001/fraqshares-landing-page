import { FaqSection } from './components/faq/FaqSection.tsx'
import { FeatureSection } from './components/features/FeatureSection.tsx'
import { SiteFooter } from './components/footer/SiteFooter.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { HeroWealthStage } from './components/stage/HeroWealthStage.tsx'
import { StepsSection } from './components/steps/StepsSection.tsx'
import { TestimonialsSection } from './components/testimonials/TestimonialsSection.tsx'
import { useLandOnHash } from './motion/useLandOnHash.ts'
import { useSmoothScroll } from './motion/useSmoothScroll.ts'

export default function App() {
  useSmoothScroll()
  useLandOnHash()

  return (
    <>
      <SiteHeader overlay />
      <main>
        <HeroWealthStage />
        <FeatureSection />
        <StepsSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  )
}
